import { useEffect, useState } from 'react'

export interface SupportedLanguage {
  language: string
  name: string
}

interface TextMetadata {
  source: string
  leading: string
  trailing: string
  lastTranslation: string | null
}

interface TranslationTarget {
  source: string
  isCurrent: () => boolean
  apply: (translation: string) => void
}

const TRANSLATABLE_ATTRIBUTES = ['aria-label', 'title', 'placeholder', 'alt']
const EXCLUDED_SELECTOR = 'script,style,noscript,svg,[translate="no"],[aria-hidden="true"]'
const translationCache = new Map<string, string>()

function readSavedLanguage(): string {
  try {
    return window.localStorage.getItem('water-reclaim-language') ?? 'en'
  } catch {
    return 'en'
  }
}

export function useAutomaticTranslation() {
  const [language, setLanguageState] = useState(readSavedLanguage)
  const [languages, setLanguages] = useState<SupportedLanguage[]>([
    { language: 'en', name: 'English' },
  ])
  const [languageError, setLanguageError] = useState<string | null>(null)
  const [translationError, setTranslationError] = useState<string | null>(null)

  const setLanguage = (nextLanguage: string) => {
    try {
      window.localStorage.setItem('water-reclaim-language', nextLanguage)
    } catch {
      // The selected language still applies for this session.
    }
    setLanguageState(nextLanguage)
  }

  useEffect(() => {
    const controller = new AbortController()
    setLanguageError(null)

    fetch(`/api/languages?target=${encodeURIComponent(language)}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Language list unavailable')
        return response.json() as Promise<{ languages: SupportedLanguage[] }>
      })
      .then(result => {
        const available = result.languages.filter(item => item.language !== 'en')
        setLanguages([{ language: 'en', name: 'English' }, ...available])
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setLanguages([{ language: 'en', name: 'English' }])
        setLanguageError('Automatic translation is unavailable. Check the translation service setup.')
        if (language !== 'en') {
          try {
            window.localStorage.setItem('water-reclaim-language', 'en')
          } catch {
            // The English fallback still applies for this session.
          }
          setLanguageState('en')
        }
      })

    return () => controller.abort()
  }, [language])

  useEffect(() => {
    const root = document.documentElement
    const rtlLanguages = new Set(['ar', 'fa', 'he', 'ur', 'ps', 'sd', 'ug', 'yi'])
    root.lang = language
    root.dir = rtlLanguages.has(language.split('-')[0].toLowerCase()) ? 'rtl' : 'ltr'
    setTranslationError(null)

    const textMetadata = new Map<Text, TextMetadata>()
    const attributeMetadata = new Map<Element, Map<string, TextMetadata>>()
    const trackedAttributes = new Set<{ element: Element; name: string; metadata: TextMetadata }>()
    const pending = new Map<string, TranslationTarget[]>()
    const controllers = new Set<AbortController>()
    let active = true
    let flushTimer: number | undefined
    let observer: MutationObserver

    const restoreOriginalText = () => {
      observer?.disconnect()
      for (const [node, metadata] of textMetadata) {
        const translated = metadata.lastTranslation
        if (node.isConnected && translated && node.nodeValue === translated) {
          node.nodeValue = `${metadata.leading}${metadata.source}${metadata.trailing}`
        }
      }
      for (const { element, name, metadata } of trackedAttributes) {
        if (element.isConnected && metadata.lastTranslation && element.getAttribute(name) === metadata.lastTranslation) {
          element.setAttribute(name, metadata.source)
        }
      }
    }

    if (language === 'en') {
      return () => {
        active = false
        restoreOriginalText()
        root.lang = 'en'
        root.dir = 'ltr'
      }
    }

    const cacheKey = (source: string) => `${language}\u0000${source}`
    const scheduleFlush = () => {
      if (flushTimer !== undefined || pending.size === 0) return
      flushTimer = window.setTimeout(() => {
        flushTimer = undefined
        void flushPending()
      }, 80)
    }

    const queueTarget = (target: TranslationTarget) => {
      if (!target.source.trim() || !/\p{L}/u.test(target.source)) return
      const cached = translationCache.get(cacheKey(target.source))
      if (cached !== undefined) {
        if (target.isCurrent()) target.apply(cached)
        return
      }
      const targets = pending.get(target.source) ?? []
      targets.push(target)
      pending.set(target.source, targets)
      scheduleFlush()
    }

    const collectText = (node: Text) => {
      const parent = node.parentElement
      if (!parent || parent.closest(EXCLUDED_SELECTOR)) return

      const raw = node.nodeValue ?? ''
      let metadata = textMetadata.get(node)
      if (metadata?.lastTranslation === raw) return

      const match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/)
      const leading = match?.[1] ?? ''
      const source = match?.[2] ?? raw
      const trailing = match?.[3] ?? ''
      if (!source.trim()) return

      metadata = { source, leading, trailing, lastTranslation: null }
      textMetadata.set(node, metadata)
      const originalValue = raw
      queueTarget({
        source,
        isCurrent: () => node.isConnected && node.nodeValue === originalValue,
        apply: translation => {
          metadata!.lastTranslation = `${leading}${translation}${trailing}`
          node.nodeValue = metadata!.lastTranslation
        },
      })
    }

    const collectAttributes = (element: Element) => {
      if (element.closest(EXCLUDED_SELECTOR)) return

      for (const name of TRANSLATABLE_ATTRIBUTES) {
        const raw = element.getAttribute(name)
        if (!raw) continue
        let attributes = attributeMetadata.get(element)
        if (!attributes) {
          attributes = new Map()
          attributeMetadata.set(element, attributes)
        }

        let metadata = attributes.get(name)
        if (metadata?.lastTranslation === raw) continue
        metadata = { source: raw, leading: '', trailing: '', lastTranslation: null }
        attributes.set(name, metadata)
        trackedAttributes.add({ element, name, metadata })
        const originalValue = raw
        queueTarget({
          source: raw,
          isCurrent: () => element.isConnected && element.getAttribute(name) === originalValue,
          apply: translation => {
            metadata!.lastTranslation = translation
            element.setAttribute(name, translation)
          },
        })
      }
    }

    const collectSubtree = (node: Node) => {
      if (node instanceof Text) {
        collectText(node)
        return
      }
      if (!(node instanceof Element) || node.closest(EXCLUDED_SELECTOR)) return

      collectAttributes(node)
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
      let textNode = walker.nextNode()
      while (textNode) {
        collectText(textNode as Text)
        textNode = walker.nextNode()
      }
      node.querySelectorAll('*').forEach(collectAttributes)
    }

    const flushPending = async () => {
      if (!active || pending.size === 0) return
      const batch: [string, TranslationTarget[]][] = []
      let characterCount = 0
      for (const entry of pending) {
        if (batch.length >= 40 || (batch.length > 0 && characterCount + entry[0].length > 18_000)) break
        batch.push(entry)
        characterCount += entry[0].length
      }
      batch.forEach(([source]) => pending.delete(source))

      const controller = new AbortController()
      controllers.add(controller)
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: language, texts: batch.map(([source]) => source) }),
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Translation request failed')
        const result = await response.json() as { translations: string[] }
        if (result.translations.length !== batch.length) throw new Error('Incomplete translation response')

        const updates: (() => void)[] = []
        batch.forEach(([source, targets], index) => {
          const translated = result.translations[index]
          translationCache.set(cacheKey(source), translated)
          for (const target of targets) {
            if (target.isCurrent()) updates.push(() => target.apply(translated))
          }
        })

        observer.disconnect()
        updates.forEach(update => update())
        observer.observe(root, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: TRANSLATABLE_ATTRIBUTES,
        })
        if (active) setTranslationError(null)
      } catch {
        if (active && !controller.signal.aborted) {
          setTranslationError('Some text could not be translated. Check the translation service and try again.')
        }
      } finally {
        controllers.delete(controller)
        scheduleFlush()
      }
    }

    observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData' && record.target instanceof Text) {
          collectText(record.target)
        } else if (record.type === 'attributes' && record.target instanceof Element) {
          collectAttributes(record.target)
        } else {
          record.addedNodes.forEach(collectSubtree)
        }
      }
    })
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    })
    collectSubtree(root)

    return () => {
      active = false
      observer.disconnect()
      if (flushTimer !== undefined) window.clearTimeout(flushTimer)
      controllers.forEach(controller => controller.abort())
      restoreOriginalText()
    }
  }, [language])

  return {
    language,
    languages,
    languageError,
    translationError,
    setLanguage,
  }
}