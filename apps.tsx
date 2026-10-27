import { useState, useEffect, useRef } from 'react'

type BlockType = 'clean' | 'pollutant' | 'empty'

interface Cell {
  id: string
  type: BlockType
  cracking: boolean
  onPath: boolean
}

interface FloatText {
  id: number
  text: string
  col: number
  row: number
  color: string
}

const COLS = 5
const ROWS = 8
const EXIT_COL = Math.floor(COLS / 2)

function generateGrid(level: number, usedMazes?: Set<string>): Cell[][] {
  const turnRowPatterns = [
    [1, 3, 5],
    [1, 3, 6],
    [1, 4, 6],
    [2, 4, 6],
  ]
  const candidates: { cells: Set<string>; signature: string }[] = []

  for (let startCol = 0; startCol < COLS; startCol++) {
    for (let firstTurn = 0; firstTurn < COLS; firstTurn++) {
      if (firstTurn === startCol) continue

      for (let secondTurn = 0; secondTurn < COLS; secondTurn++) {
        if (
          secondTurn === firstTurn ||
          secondTurn === EXIT_COL ||
          Math.sign(secondTurn - firstTurn) === Math.sign(firstTurn - startCol)
        ) continue

        for (const turnRows of turnRowPatterns) {
          const cells = new Set<string>()
          const columns = [startCol, firstTurn, secondTurn, EXIT_COL]
          let currentRow = 0
          let currentCol = startCol
          cells.add(`${currentRow}-${currentCol}`)

          turnRows.forEach((turnRow, index) => {
            while (currentRow < turnRow) {
              currentRow++
              cells.add(`${currentRow}-${currentCol}`)
            }

            const nextCol = columns[index + 1]
            const direction = Math.sign(nextCol - currentCol)
            while (currentCol !== nextCol) {
              currentCol += direction
              cells.add(`${currentRow}-${currentCol}`)
            }
          })

          while (currentRow < ROWS - 1) {
            currentRow++
            cells.add(`${currentRow}-${currentCol}`)
          }

          candidates.push({
            cells,
            signature: [...cells].sort().join('|'),
          })
        }
      }
    }
  }

  // Each level adds one route cell until the fair maximum is reached.
  // The route always remains a single, fully connected zigzag.
  const targetRouteLength = Math.min(10 + level, 18)
  const levelCandidates = candidates.filter(
    candidate => candidate.cells.size === targetRouteLength,
  )
  const unusedCandidates = levelCandidates.filter(
    candidate => !usedMazes?.has(candidate.signature),
  )
  const availableCandidates =
    unusedCandidates.length > 0 ? unusedCandidates : levelCandidates
  const selected =
    availableCandidates[Math.floor(Math.random() * availableCandidates.length)]
  const cleanCells = selected.cells
  const signature = selected.signature

  usedMazes?.add(signature)

  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const isCleanRoute = cleanCells.has(`${r}-${c}`)
      return {
        id: `${r}-${c}`,
        type: (isCleanRoute ? 'clean' : 'pollutant') as BlockType,
        cracking: false,
        onPath: isCleanRoute,
      }
    })
  )
}

// BFS: find a connected path of empty cells from the surface to the single exit.
function findPath(grid: Cell[][]): [number, number][] | null {
  const queue: [number, number][] = []
  const prev = new Map<string, [number, number] | null>()

  for (let c = 0; c < COLS; c++) {
    if (grid[0][c].type === 'empty' && grid[0][c].onPath) {
      queue.push([0, c])
      prev.set(`0-${c}`, null)
    }
  }

  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  let head = 0

  while (head < queue.length) {
    const [r, c] = queue[head++]
    if (r === ROWS - 1 && c === EXIT_COL) {
      // Reconstruct path
      const path: [number, number][] = []
      let cur: [number, number] | null = [r, c]
      while (cur) {
        path.push(cur)
        cur = prev.get(`${cur[0]}-${cur[1]}`) ?? null
      }
      return path
    }
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      const key = `${nr}-${nc}`
      if (!prev.has(key) && grid[nr][nc].type === 'empty' && grid[nr][nc].onPath) {
        prev.set(key, [r, c])
        queue.push([nr, nc])
      }
    }
  }
  return null
}

const CONFETTI_COLORS = ['#00ffcc', '#00c9ff', '#ffd700', '#ff6b9d', '#a78bfa', '#34d399', '#fb923c']

interface KnowledgeFact {
  id: string
  fact: string
}

const CLEAN_WATER_FACTS = [
  { id: 'clean-access', fact: 'WHO and UNICEF reported that 2.2 billion people still lacked safely managed drinking water in 2022—every safe connection can transform a community.' },
  { id: 'clean-health', fact: 'WHO estimates that better water, sanitation, and hygiene could have prevented at least 1.4 million deaths worldwide in 2019.' },
  { id: 'clean-time', fact: 'UNICEF reports that women and girls spend about 200 million hours collecting water every day. Nearby safe water returns time for school, work, and family.' },
  { id: 'clean-right', fact: 'The United Nations recognizes safe drinking water and sanitation as human rights essential to health, dignity, and opportunity.' },
  { id: 'clean-climate', fact: 'Protecting groundwater strengthens climate resilience by preserving reliable local water supplies through droughts and extreme weather.' },
  { id: 'clean-groundwater', fact: 'UNESCO reports that groundwater supplies nearly half of all domestic water used worldwide, making aquifer protection globally important.' },
  { id: 'clean-school', fact: 'Safe water and sanitation at school help students stay healthy, attend class, and manage hygiene with dignity.' },
  { id: 'clean-food', fact: 'Reliable clean water supports food security by helping farmers grow crops safely and communities prepare food without spreading disease.' },
  { id: 'clean-wetlands', fact: 'Healthy wetlands naturally store water, reduce floods, and filter some pollutants before water reaches rivers and aquifers.' },
  { id: 'clean-economy', fact: 'Accessible safe water saves time and medical costs, allowing families and communities to invest more in education and livelihoods.' },
] satisfies KnowledgeFact[]

const TOXIC_WATER_FACTS = [
  { id: 'toxic-fecal', fact: 'WHO estimates that at least 1.7 billion people use a drinking-water source contaminated with feces, putting entire communities at risk.' },
  { id: 'toxic-deaths', fact: 'Contaminated drinking water causes an estimated 505,000 diarrhoeal deaths each year, according to WHO.' },
  { id: 'toxic-arsenic', fact: 'WHO estimates that arsenic-contaminated drinking water affects at least 140 million people across 70 countries.' },
  { id: 'toxic-plastic', fact: 'UNEP estimates that 19–23 million tonnes of plastic waste leak into aquatic ecosystems every year, damaging rivers, lakes, and oceans.' },
  { id: 'toxic-disease', fact: 'Polluted water can carry cholera, dysentery, typhoid, and polio—diseases that safe water and sanitation can prevent.' },
  { id: 'toxic-nutrients', fact: 'Excess fertilizer in waterways can trigger algal blooms that remove oxygen and create aquatic dead zones.' },
  { id: 'toxic-mercury', fact: 'Mercury pollution can build up in fish and move through the food chain, threatening wildlife and people who depend on fish for food.' },
  { id: 'toxic-lead', fact: 'Lead in drinking water can permanently harm brain development in children; no level of lead exposure is considered safe.' },
  { id: 'toxic-wastewater', fact: 'Untreated wastewater spreads pathogens and chemicals downstream, crossing community and national boundaries through shared rivers.' },
  { id: 'toxic-ecosystems', fact: 'Water pollution reduces biodiversity and can make rivers, lakes, and groundwater unsafe for drinking, farming, fishing, and recreation.' },
] satisfies KnowledgeFact[]

const ALL_WATER_FACTS = [...CLEAN_WATER_FACTS, ...TOXIC_WATER_FACTS]

function CelebrationOverlay({
  benefit,
  triviaNext,
  nextLevel,
  onContinue,
}: {
  benefit: string
  triviaNext: boolean
  nextLevel: number
  onContinue: () => void
}) {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: 4 + (i * 3.3) % 92,
    size: 6 + (i % 4) * 3,
    dur: `${1.2 + (i % 5) * 0.25}s`,
    delay: `${(i % 8) * 0.07}s`,
    shape: i % 3,
  }))

  const drops = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 2 * Math.PI
    const dist = 70 + (i % 3) * 20
    return {
      id: i,
      tx: `${Math.cos(angle) * dist}px`,
      ty: `${Math.sin(angle) * dist}px`,
      delay: `${i * 0.04}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }
  })

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{ borderRadius: 40, background: 'rgba(4,18,32,0.85)', backdropFilter: 'blur(3px)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: 40 }}>
        {pieces.map(p => (
          <div
            key={p.id}
            className="confetti-piece absolute"
            style={{
              left: `${p.left}%`, top: -16,
              width: p.size, height: p.size,
              background: p.color,
              borderRadius: p.shape === 1 ? '50%' : p.shape === 2 ? '50% 50% 50% 0' : 3,
              '--dur': p.dur, '--delay': p.delay, opacity: 0,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="absolute" style={{ top: '42%', left: '50%' }}>
        {drops.map(d => (
          <div key={d.id} className="burst-drop absolute rounded-full"
            style={{
              width: 10, height: 10, background: d.color,
              '--tx': d.tx, '--ty': d.ty, '--delay': d.delay,
              marginLeft: -5, marginTop: -5, opacity: 0,
              boxShadow: `0 0 6px ${d.color}`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="pop-in relative flex flex-col items-center gap-3 px-10 py-8 mx-6"
        style={{
          background: 'linear-gradient(135deg, #041e38 0%, #073060 100%)',
          border: '2px solid rgba(0,255,204,0.5)',
          borderRadius: 28,
          boxShadow: '0 0 60px rgba(0,255,204,0.25), 0 0 0 1px rgba(0,201,255,0.15)',
          maxWidth: 300,
        }}
      >
        <div className="absolute rounded-full"
          style={{
            width: 100, height: 100, top: -20,
            background: 'radial-gradient(circle, rgba(0,255,204,0.3) 0%, transparent 70%)',
            animation: 'shimmer-pulse 1.4s ease-in-out infinite',
          }}
        />
        <div className="flex gap-1 relative">
          {['💧', '🎉', '💧'].map((e, i) => (
            <span key={i} className="drop-bounce"
              style={{ fontSize: i === 1 ? 44 : 28, '--delay': `${i * 0.1}s`, display: 'inline-block' } as React.CSSProperties}
            >{e}</span>
          ))}
        </div>
        <div className="font-black text-center leading-tight"
          style={{ fontSize: 26, color: '#00ffcc', textShadow: '0 0 24px rgba(0,255,204,0.7)', letterSpacing: '-0.02em' }}
        >
          PIPE CONNECTED!
        </div>
        <div className="font-bold text-center"
          style={{ fontSize: 13, color: 'rgba(168,216,240,0.75)', lineHeight: 1.4 }}
        >
          Fresh water is flowing to the surface!
        </div>
        <div
          className="w-full rounded-2xl px-4 py-3 text-center"
          style={{
            background: 'rgba(0,255,204,0.07)',
            border: '1px solid rgba(0,255,204,0.2)',
          }}
        >
          <div
            className="font-black"
            style={{ fontSize: 9, color: '#00ffcc', letterSpacing: '0.12em' }}
          >
            CLEAN WATER BENEFIT
          </div>
          <p
            className="mb-0 mt-1 font-bold"
            style={{ fontSize: 11, color: 'rgba(220,247,255,0.82)', lineHeight: 1.45 }}
          >
            {benefit}
          </p>
        </div>
        <div className="w-full">
          <div className="flex justify-between mb-1">
            <span style={{ fontSize: 10, color: 'rgba(168,216,240,0.5)', fontWeight: 700, letterSpacing: '0.08em' }}>WATER FLOW</span>
            <span style={{ fontSize: 10, color: '#00ffcc', fontWeight: 800 }}>100%</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 8, background: 'rgba(255,255,255,0.08)' }}>
            <div style={{
              height: '100%', width: '100%',
              background: 'linear-gradient(90deg, #00c9ff, #00ffcc)',
              boxShadow: '0 0 12px rgba(0,255,204,0.6)', borderRadius: 9999,
              animation: 'shimmer-pulse 1.2s ease-in-out infinite',
            }} />
          </div>
        </div>
        <button
          onClick={onContinue}
          className="font-black rounded-2xl px-8 py-3 transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #00c9ff, #00ffcc)',
            color: '#041220', fontSize: 14, letterSpacing: '0.06em',
            boxShadow: '0 4px 20px rgba(0,201,255,0.4)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {triviaNext ? 'CONTINUE TO TRIVIA' : `CONTINUE TO LEVEL ${nextLevel}`}
        </button>
      </div>
    </div>
  )
}

function TriviaOverlay({
  level,
  score,
  correctFact,
  options,
  wagerPercent,
  selectedFactId,
  scoreChange,
  onChooseWager,
  onAnswer,
  onContinue,
}: {
  level: number
  score: number
  correctFact: KnowledgeFact
  options: KnowledgeFact[]
  wagerPercent: number | null
  selectedFactId: string | null
  scoreChange: number | null
  onChooseWager: (percent: number) => void
  onAnswer: (fact: KnowledgeFact) => void
  onContinue: () => void
}) {
  const answered = selectedFactId !== null
  const wagerPoints = answered
    ? Math.abs(scoreChange ?? 0)
    : wagerPercent === null
      ? 0
      : Math.floor(score * wagerPercent / 100)
  const startLevel = level - 9

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center px-5"
      style={{ background: 'rgba(4,18,32,0.96)', backdropFilter: 'blur(5px)' }}
    >
      <div
        className="w-full rounded-3xl px-5 py-6"
        style={{
          background: 'linear-gradient(145deg, #071f3c, #0b3151)',
          border: '1.5px solid rgba(0,255,204,0.45)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.6), 0 0 35px rgba(0,201,255,0.12)',
        }}
      >
        <div className="text-center">
          <div className="font-black" style={{ color: '#00ffcc', fontSize: 10, letterSpacing: '0.15em' }}>
            KNOWLEDGE CHECK · LEVELS {startLevel}–{level}
          </div>
          <div className="mt-1 font-black" style={{ color: '#e8f4fd', fontSize: 24 }}>
            WATER TRIVIA WAGER
          </div>
          <p className="mx-auto mb-0 mt-2 font-bold" style={{ color: 'rgba(168,216,240,0.72)', fontSize: 11, lineHeight: 1.45, maxWidth: 290 }}>
            Risk none, some, or all of your {score} points on a fact you encountered during this ten-level run.
          </p>
        </div>

        <div className="mt-4">
          <div className="mb-2 font-black" style={{ color: 'rgba(168,216,240,0.62)', fontSize: 9, letterSpacing: '0.12em' }}>
            CHOOSE YOUR WAGER
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 25, 50, 100].map(percent => (
              <button
                key={percent}
                onClick={() => !answered && onChooseWager(percent)}
                disabled={answered}
                className="rounded-xl py-2 font-black transition-all active:scale-95"
                style={{
                  background: wagerPercent === percent ? 'rgba(0,255,204,0.18)' : 'rgba(255,255,255,0.05)',
                  border: wagerPercent === percent ? '1.5px solid #00ffcc' : '1px solid rgba(168,216,240,0.16)',
                  color: wagerPercent === percent ? '#00ffcc' : 'rgba(220,247,255,0.7)',
                  fontSize: 10,
                }}
              >
                {percent === 0 ? 'NONE' : percent === 100 ? 'ALL' : `${percent}%`}
              </button>
            ))}
          </div>
          <div className="mt-2 text-center font-bold" style={{ color: '#00c9ff', fontSize: 10 }}>
            {wagerPercent === null ? 'Select a wager to unlock the question' : `${wagerPoints} points at stake`}
          </div>
        </div>

        <div className="mt-4">
          <div className="font-black" style={{ color: '#e8f4fd', fontSize: 13, lineHeight: 1.35 }}>
            Which fact was shared with you during Levels {startLevel}–{level}?
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {options.map((option, index) => {
              const isCorrect = option.id === correctFact.id
              const isSelected = option.id === selectedFactId
              const revealCorrect = answered && isCorrect
              const revealWrong = answered && isSelected && !isCorrect
              return (
                <button
                  key={option.id}
                  onClick={() => wagerPercent !== null && !answered && onAnswer(option)}
                  disabled={wagerPercent === null || answered}
                  className="rounded-xl px-3 py-2.5 text-left font-bold transition-all active:scale-[0.98]"
                  style={{
                    background: revealCorrect
                      ? 'rgba(34,197,94,0.18)'
                      : revealWrong
                        ? 'rgba(239,68,68,0.18)'
                        : 'rgba(255,255,255,0.045)',
                    border: revealCorrect
                      ? '1.5px solid rgba(74,222,128,0.85)'
                      : revealWrong
                        ? '1.5px solid rgba(248,113,113,0.85)'
                        : '1px solid rgba(168,216,240,0.14)',
                    color: 'rgba(232,244,253,0.88)',
                    fontSize: 10,
                    lineHeight: 1.35,
                    opacity: wagerPercent === null ? 0.45 : 1,
                  }}
                >
                  <span style={{ color: '#00c9ff', marginRight: 6 }}>{String.fromCharCode(65 + index)}.</span>
                  {option.fact}
                </button>
              )
            })}
          </div>
        </div>

        {answered && (
          <div className="mt-4 text-center">
            <div className="font-black" style={{ color: (scoreChange ?? 0) >= 0 ? '#00ffcc' : '#ff7434', fontSize: 18 }}>
              {selectedFactId === correctFact.id ? 'CORRECT' : 'NOT THIS TIME'}
              {' · '}
              {(scoreChange ?? 0) >= 0 ? '+' : ''}{scoreChange} POINTS
            </div>
            <button
              onClick={onContinue}
              className="mt-3 w-full rounded-2xl py-3 font-black transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #00c9ff, #00ffcc)',
                color: '#041220',
                border: 'none',
                fontSize: 13,
                letterSpacing: '0.05em',
              }}
            >
              CONTINUE TO LEVEL {level + 1}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function MinerCharacter({ celebrate, compact = false }: { celebrate: boolean; compact?: boolean }) {
  return (
    <svg
      width={compact ? 34 : 52}
      height={compact ? 42 : 60}
      viewBox="0 0 52 64"
      fill="none"
      style={{ overflow: 'visible' }}
    >
      <rect x="12" y="4" width="28" height="8" rx="4" fill="#f59e0b" />
      <rect x="9" y="10" width="34" height="4" rx="2" fill="#d97706" />
      <circle cx="26" cy="7" r="3" fill="#fef3c7" />
      <circle cx="26" cy="22" r="11" fill="#f4c87a" />
      <circle cx="21" cy="21" r="2.5" fill="#1a1a2e" />
      <circle cx="31" cy="21" r="2.5" fill="#1a1a2e" />
      <circle cx="22" cy="20" r="0.8" fill="white" />
      <circle cx="32" cy="20" r="0.8" fill="white" />
      {celebrate
        ? <path d="M20 26 Q26 31 32 26" stroke="#1a1a2e" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        : <path d="M21 27 Q26 29 31 27" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      }
      <rect x="16" y="31" width="20" height="20" rx="5" fill="#1d4ed8" />
      <rect x="4" y="32" width="12" height="5" rx="2.5" fill="#1d4ed8"
        style={{ transformOrigin: '16px 34px', transform: celebrate ? 'rotate(-60deg)' : 'rotate(50deg)', transition: 'transform 0.3s' }}
      />
      <rect x="36" y="32" width="12" height="5" rx="2.5" fill="#1d4ed8"
        style={{ transformOrigin: '36px 34px', transform: celebrate ? 'rotate(60deg)' : 'rotate(-40deg)', transition: 'transform 0.3s' }}
      />
      <rect x="17" y="49" width="7" height="12" rx="3.5" fill="#1e3a8a" />
      <rect x="28" y="49" width="7" height="12" rx="3.5" fill="#1e3a8a" />
    </svg>
  )
}

export default function App() {
  const usedMazes = useRef(new Set<string>())
  const [grid, setGrid] = useState<Cell[][]>(() => generateGrid(1, usedMazes.current))
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [floatTexts, setFloatTexts] = useState<FloatText[]>([])
  const [floatId, setFloatId] = useState(0)
  const [celebrate, setCelebrate] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [pathCells, setPathCells] = useState<Set<string>>(new Set())
  const [pipeActive, setPipeActive] = useState(false)
  const [showToxicWarning, setShowToxicWarning] = useState(false)
  const [showRules, setShowRules] = useState(true)
  const [lastCleanCell, setLastCleanCell] = useState<string | null>(null)
  const [cleanWaterFact, setCleanWaterFact] = useState(CLEAN_WATER_FACTS[0])
  const [toxicWaterFact, setToxicWaterFact] = useState(TOXIC_WATER_FACTS[0])
  const [quizFact, setQuizFact] = useState<KnowledgeFact | null>(null)
  const [quizOptions, setQuizOptions] = useState<KnowledgeFact[]>([])
  const [wagerPercent, setWagerPercent] = useState<number | null>(null)
  const [selectedQuizFactId, setSelectedQuizFactId] = useState<string | null>(null)
  const [quizScoreChange, setQuizScoreChange] = useState<number | null>(null)
  const factUseCounts = useRef(new Map<string, number>())
  const learnedFactIds = useRef(new Set<string>())
  const completedGrid = useRef<Cell[][] | null>(null)
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const drawFact = (facts: KnowledgeFact[], current: KnowledgeFact) => {
    const lowestUseCount = Math.min(
      ...facts.filter(fact => fact.id !== current.id).map(
        fact => factUseCounts.current.get(fact.id) ?? 0,
      ),
    )
    const leastSeen = facts.filter(
      fact =>
        fact.id !== current.id &&
        (factUseCounts.current.get(fact.id) ?? 0) === lowestUseCount,
    )
    const selected = leastSeen[Math.floor(Math.random() * leastSeen.length)]
    factUseCounts.current.set(
      selected.id,
      (factUseCounts.current.get(selected.id) ?? 0) + 1,
    )
    learnedFactIds.current.add(selected.id)
    return selected
  }

  const startTriviaQuiz = () => {
    const learnedFacts = ALL_WATER_FACTS.filter(fact =>
      learnedFactIds.current.has(fact.id),
    )
    const correctFact =
      learnedFacts[Math.floor(Math.random() * learnedFacts.length)]
    const unseenFacts = ALL_WATER_FACTS.filter(
      fact => !learnedFactIds.current.has(fact.id),
    )
    const distractorPool = unseenFacts.length >= 2
      ? unseenFacts
      : ALL_WATER_FACTS.filter(fact => fact.id !== correctFact.id)
    const distractors = [...distractorPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    const options = [correctFact, ...distractors].sort(() => Math.random() - 0.5)

    setShowCelebration(false)
    setQuizFact(correctFact)
    setQuizOptions(options)
    setWagerPercent(null)
    setSelectedQuizFactId(null)
    setQuizScoreChange(null)
  }

  // After each grid change, check if a path exists
  useEffect(() => {
    const path = findPath(grid)
    if (path && !pipeActive && completedGrid.current !== grid) {
      completedGrid.current = grid
      const pathSet = new Set(path.map(([r, c]) => `${r}-${c}`))
      setPathCells(pathSet)
      setPipeActive(true)
      setCelebrate(true)
      setShowCelebration(false)
      setCleanWaterFact(drawFact(CLEAN_WATER_FACTS, cleanWaterFact))
      setScore(s => s + 50)
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current)
      celebrationTimer.current = setTimeout(() => setShowCelebration(true), 600)
    } else if (!path) {
      setPathCells(new Set())
    }
  }, [grid])

  const tap = (row: number, col: number) => {
    if (pipeActive) return
    const playerRow = lastCleanCell
      ? Number(lastCleanCell.split('-')[0])
      : -1
    if (row > playerRow + 1) return

    const cell = grid[row][col]
    if (cell.type === 'empty' || cell.cracking) return

    setGrid(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })))
      next[row][col].cracking = true
      return next
    })

    const isClean = cell.type === 'clean'
    const pts = isClean ? 10 : -5
    if (!isClean) {
      setToxicWaterFact(drawFact(TOXIC_WATER_FACTS, toxicWaterFact))
      setShowToxicWarning(true)
    }

    const id = floatId + 1
    setFloatId(id)
    setFloatTexts(prev => [...prev, { id, text: isClean ? `+${pts}` : `${pts}`, row, col, color: isClean ? '#00ffcc' : '#ff6b35' }])
    setTimeout(() => setFloatTexts(prev => prev.filter(f => f.id !== id)), 900)

    setTimeout(() => {
      setGrid(prev => {
        const next = prev.map(r => r.map(c => ({ ...c })))
        next[row][col] = { ...next[row][col], type: 'empty', cracking: false }
        return next
      })
      setScore(s => Math.max(0, s + pts))

      if (isClean) {
        setLastCleanCell(`${row}-${col}`)
      }
    }, 300)
  }

  const nextLevel = () => {
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current)
    setLevel(l => l + 1)
    setGrid(generateGrid(level + 1, usedMazes.current))
    setPathCells(new Set())
    setPipeActive(false)
    setCelebrate(false)
    setShowCelebration(false)
    setShowToxicWarning(false)
    setLastCleanCell(null)
  }

  const reset = () => {
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current)
    setGrid(generateGrid(level, usedMazes.current))
    setScore(0)
    setPathCells(new Set())
    setPipeActive(false)
    setCelebrate(false)
    setShowCelebration(false)
    setShowToxicWarning(false)
    setLastCleanCell(null)
  }

  const answerTrivia = (answer: KnowledgeFact) => {
    if (!quizFact || wagerPercent === null || selectedQuizFactId) return
    const wagerPoints = Math.floor(score * wagerPercent / 100)
    const isCorrect = answer.id === quizFact.id
    const scoreChange = isCorrect ? wagerPoints : -wagerPoints

    setSelectedQuizFactId(answer.id)
    setQuizScoreChange(scoreChange)
    setScore(current => Math.max(0, current + scoreChange))
  }

  const continueAfterTrivia = () => {
    learnedFactIds.current.clear()
    setQuizFact(null)
    setQuizOptions([])
    setWagerPercent(null)
    setSelectedQuizFactId(null)
    setQuizScoreChange(null)
    nextLevel()
  }

  const emptyCells = grid.flat().filter(c => c.type === 'empty').length
  const totalCells = ROWS * COLS

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#041220' }}>
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 375, minHeight: 780,
          borderRadius: 40,
          background: 'linear-gradient(180deg, #041220 0%, #062040 100%)',
          boxShadow: '0 0 0 8px #1a2540, 0 0 0 10px #0d1a30, 0 30px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-7 pt-5 pb-1">
          <span style={{ fontSize: 11, color: 'rgba(168,216,240,0.5)', fontWeight: 700 }}>9:41</span>
          <span style={{ fontSize: 10, color: 'rgba(168,216,240,0.4)' }}>●●●</span>
        </div>

        {/* HUD */}
        <div className="px-5 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-black leading-none"
                style={{ fontSize: 20, color: '#00c9ff', textShadow: '0 0 16px rgba(0,201,255,0.5)', letterSpacing: '-0.02em' }}
              >
                WATER RECLAIM
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 rounded-lg font-bold"
                  style={{ fontSize: 10, background: 'rgba(0,255,204,0.1)', color: '#00ffcc', border: '1px solid rgba(0,255,204,0.25)' }}
                >
                  LVL {level}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(168,216,240,0.5)', fontWeight: 600 }}>
                  {emptyCells}/{totalCells} dug
                </span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-2xl font-black"
              style={{
                background: 'rgba(0,201,255,0.1)', border: '1.5px solid rgba(0,201,255,0.25)',
                fontSize: 26, color: '#00c9ff', textShadow: '0 0 12px rgba(0,201,255,0.4)',
                minWidth: 80, textAlign: 'center',
              }}
            >
              {score}
            </div>
          </div>
        </div>

        {/* Miner + water tank at top */}
        <div className="flex items-end justify-center gap-6 px-5 pb-1">
          <div style={{ opacity: 0, width: 52 }} />
          {/* Tank */}
          <div className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t-2xl flex items-center justify-center transition-all duration-700"
              style={{
                height: 52,
                background: pipeActive
                  ? 'linear-gradient(180deg, #00264d, #003d6b)'
                  : 'rgba(13,31,53,0.8)',
                border: pipeActive
                  ? '1.5px solid rgba(0,255,204,0.5)'
                  : '1.5px solid rgba(0,201,255,0.1)',
                borderBottom: 'none',
                boxShadow: pipeActive ? '0 0 24px rgba(0,255,204,0.15)' : 'none',
              }}
            >
              <span className="font-black transition-colors duration-500"
                style={{ fontSize: 10, letterSpacing: '0.1em', color: pipeActive ? '#00ffcc' : 'rgba(168,216,240,0.25)' }}
              >
                {pipeActive ? '✅ WATER DELIVERED' : '⬛ WATER TANK'}
              </span>
            </div>
          </div>
          <div style={{ opacity: 0, width: 52 }} />
        </div>

        {/* Miner row — above the grid */}
        <div className="flex items-end justify-center px-5" style={{ marginBottom: -4 }}>
          <div className="flex items-end justify-around w-full">
            {Array.from({ length: COLS }).map((_, c) => (
              <div key={c} className="flex justify-center" style={{ width: 56 }}>
                {c === Math.floor(COLS / 2) && !lastCleanCell && (
                  <div style={{ marginBottom: -2 }}>
                    <MinerCharacter celebrate={celebrate} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="relative px-5">
          <p
            className="m-0 pb-2 text-center font-bold"
            style={{ fontSize: 9, color: 'rgba(168,216,240,0.5)', letterSpacing: '0.06em' }}
          >
            ONE HIDDEN ROUTE — ONE EXIT
          </p>
          {/* Float texts */}
          {floatTexts.map(ft => (
            <div key={ft.id} className="float-up-text absolute font-black z-20 pointer-events-none"
              style={{
                left: `${(ft.col / COLS) * 100 + 4}%`,
                top: `${(ft.row / ROWS) * 100}%`,
                color: ft.color, fontSize: 13,
                textShadow: `0 0 8px ${ft.color}`,
              }}
            >
              {ft.text}
            </div>
          ))}

          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isPath = pathCells.has(`${r}-${c}`)
                const isEmpty = cell.type === 'empty'
                const playerRow = lastCleanCell
                  ? Number(lastCleanCell.split('-')[0])
                  : -1
                const isLocked = r > playerRow + 1
                const isClearedClean = isEmpty && cell.onPath
                const isClearedToxic = isEmpty && !cell.onPath
                const isStart = r === 0 && cell.onPath && !isEmpty
                const isExit = r === ROWS - 1 && c === EXIT_COL && cell.onPath && !isEmpty
                const hasMiner = lastCleanCell === `${r}-${c}`

                return (
                  <button
                    key={cell.id}
                    onClick={() => tap(r, c)}
                    disabled={isEmpty || cell.cracking || pipeActive || isLocked}
                    className={`relative rounded-lg flex flex-col items-center justify-center overflow-hidden transition-all ${cell.cracking ? 'block-breaking' : ''}`}
                    style={{
                      height: 52,
                      background: isClearedClean
                        ? 'linear-gradient(135deg, rgba(12,122,79,0.95), rgba(20,164,104,0.9))'
                        : isClearedToxic
                          ? 'linear-gradient(135deg, rgba(132,35,35,0.95), rgba(181,47,47,0.9))'
                        : isStart
                          ? 'linear-gradient(135deg, #087f8c, #00a896)'
                          : isExit
                            ? 'linear-gradient(135deg, #075985, #0284c7)'
                          : 'linear-gradient(135deg, #164d66, #1d6078)',
                      border: isClearedClean
                        ? '1.5px solid rgba(74,222,128,0.85)'
                        : isClearedToxic
                          ? '1.5px solid rgba(248,113,113,0.8)'
                        : isStart
                          ? '1.5px solid rgba(0,255,204,0.85)'
                          : isExit
                            ? '1.5px solid rgba(56,189,248,0.9)'
                          : '1.5px solid rgba(104,196,214,0.42)',
                      boxShadow: isClearedClean
                        ? '0 0 10px rgba(34,197,94,0.28), inset 0 0 12px rgba(187,247,208,0.12)'
                        : isClearedToxic
                          ? '0 0 10px rgba(239,68,68,0.22), inset 0 0 12px rgba(254,202,202,0.08)'
                          : isStart
                            ? '0 0 16px rgba(0,255,204,0.32), inset 0 0 12px rgba(255,255,255,0.08)'
                            : isExit
                              ? '0 0 16px rgba(56,189,248,0.38), inset 0 0 12px rgba(255,255,255,0.08)'
                          : '0 3px 8px rgba(0,20,35,0.35)',
                      cursor: isEmpty || pipeActive || isLocked ? 'default' : 'pointer',
                      opacity: isLocked ? 0.42 : 1,
                    }}
                  >
                    {/* Pipe water fill animation */}
                    {isPath && (
                      <div className="absolute inset-0 rounded-lg"
                        style={{
                          background: 'linear-gradient(180deg, rgba(0,220,255,0.32) 0%, rgba(0,160,255,0.18) 100%)',
                          animation: 'shimmer-pulse 1s ease-in-out infinite',
                        }}
                      />
                    )}

                    {/* Shine */}
                    {!isEmpty && (
                      <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg opacity-15" style={{ background: 'white' }} />
                    )}

                    {/* All unopened cells look alike; the score reveals the result. */}
                    {!isEmpty && (
                      isStart || isExit ? (
                        <>
                          <span
                            className="rounded-full"
                            style={{
                              width: 10,
                              height: 10,
                              background: isStart ? '#bfffee' : '#bae6fd',
                              boxShadow: isStart
                                ? '0 0 10px rgba(191,255,238,0.8)'
                                : '0 0 10px rgba(186,230,253,0.85)',
                              position: 'relative',
                              zIndex: 1,
                            }}
                          />
                          <span className="font-black" style={{ fontSize: 7, letterSpacing: '0.1em', color: isStart ? '#e6fff8' : '#e0f7ff', position: 'relative', zIndex: 1 }}>
                            {isStart ? 'START' : 'EXIT'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            className="font-black"
                            style={{ fontSize: 15, color: 'rgba(168,216,240,0.48)', position: 'relative', zIndex: 1 }}
                          >
                            {isLocked ? '×' : '?'}
                          </span>
                          <span className="font-bold" style={{ fontSize: 7, letterSpacing: '0.08em', color: 'rgba(168,216,240,0.55)', position: 'relative', zIndex: 1 }}>
                            {isLocked ? 'TOO DEEP' : 'UNKNOWN'}
                          </span>
                        </>
                      )
                    )}

                    {/* Path water drop */}
                    {isPath && (
                      <span style={{ fontSize: 18, position: 'relative', zIndex: 1, animation: 'bob 1s ease-in-out infinite' }}>💧</span>
                    )}

                    {hasMiner && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <MinerCharacter celebrate={celebrate} compact />
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Water source at bottom */}
        <div className="mx-5 mt-1">
          <div
            className="flex items-center justify-center overflow-hidden"
            style={{
              height: 64,
              borderRadius: '0 0 16px 16px',
              background: 'linear-gradient(180deg, #062040 0%, #0a4080 100%)',
              border: '1.5px solid rgba(0,201,255,0.15)',
              borderTop: 'none',
            }}
          >
            {[0, 1, 2].map(i => (
              <div key={i} className="absolute left-5 right-5"
                style={{
                  height: 2,
                  top: `calc(100% - ${36 - i * 12}px)`,
                  background: `rgba(0,${150 + i * 30},255,${0.25 - i * 0.06})`,
                  borderRadius: 2,
                  animation: `wave ${2.5 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
            <div className="relative z-10 flex flex-col items-center">
              <span style={{ fontSize: 20 }}>🌊</span>
              <span className="font-black" style={{ fontSize: 8, color: 'rgba(0,201,255,0.5)', letterSpacing: '0.1em' }}>
                GROUNDWATER SOURCE
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-center py-2">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded flex items-center justify-center"
              style={{ background: 'rgba(0,255,204,0.15)', border: '1.5px solid rgba(0,255,204,0.5)' }}>
              <span style={{ fontSize: 9, color: '#00ffcc', fontWeight: 900 }}>+</span>
            </div>
            <span style={{ fontSize: 9, color: 'rgba(168,216,240,0.6)', fontWeight: 600 }}>Clean +10</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded flex items-center justify-center"
              style={{ background: 'rgba(74,26,10,0.8)', border: '1.5px solid rgba(200,80,20,0.5)' }}>
              <span style={{ fontSize: 9, color: '#ff8c3c', fontWeight: 900 }}>−</span>
            </div>
            <span style={{ fontSize: 9, color: 'rgba(168,216,240,0.6)', fontWeight: 600 }}>Toxic −5</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 pb-7 flex gap-3">
          <button onClick={reset}
            className="flex-1 font-black rounded-2xl py-3 transition-all active:scale-95"
            style={{
              background: 'rgba(0,201,255,0.1)', color: '#00c9ff', fontSize: 13,
              border: '1.5px solid rgba(0,201,255,0.3)', cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            NEW GRID
          </button>
          <button onClick={nextLevel} disabled
            className="flex-1 font-black rounded-2xl py-3 transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.05)', color: 'rgba(168,216,240,0.3)', fontSize: 13,
              border: 'none', cursor: 'default', letterSpacing: '0.04em',
            }}
          >
            NEXT LEVEL →
          </button>
        </div>

        {/* Celebration */}
        {showToxicWarning && !showCelebration && (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center px-5"
            style={{ background: 'rgba(4,18,32,0.72)', backdropFilter: 'blur(3px)' }}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="pop-in relative w-full max-w-[300px] overflow-hidden rounded-3xl px-6 py-5 text-center"
              style={{
                background: 'linear-gradient(145deg, rgba(55,24,12,0.98), rgba(30,17,14,0.98))',
                border: '1.5px solid rgba(255,116,52,0.7)',
                boxShadow: '0 18px 45px rgba(0,0,0,0.55), 0 0 28px rgba(255,90,30,0.18)',
              }}
            >
              <div
                className="font-black"
                style={{ color: '#ff7434', fontSize: 11, letterSpacing: '0.14em' }}
              >
                −5 POINTS · GLOBAL IMPACT
              </div>
              <div
                className="mt-1 font-black"
                style={{ color: '#fff2e8', fontSize: 22, letterSpacing: '-0.02em' }}
              >
                WRONG BLOCK
              </div>
              <div
                className="mx-auto mt-2 h-px w-14"
                style={{ background: 'rgba(255,116,52,0.55)' }}
              />
              <p
                className="mb-0 mt-3 font-bold"
                style={{ color: 'rgba(255,226,207,0.78)', fontSize: 12, lineHeight: 1.45 }}
              >
                {toxicWaterFact.fact}
              </p>
              <button
                onClick={() => setShowToxicWarning(false)}
                className="mt-4 w-full rounded-2xl py-3 font-black transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #ff7434, #ff9a4d)',
                  color: '#241008',
                  border: 'none',
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                I UNDERSTAND
              </button>
            </div>
          </div>
        )}
        {showCelebration && (
          <CelebrationOverlay
            key={`level-${level}`}
            benefit={cleanWaterFact.fact}
            triviaNext={level % 10 === 0}
            nextLevel={level + 1}
            onContinue={() => level % 10 === 0 ? startTriviaQuiz() : nextLevel()}
          />
        )}
        {quizFact && (
          <TriviaOverlay
            level={level}
            score={score}
            correctFact={quizFact}
            options={quizOptions}
            wagerPercent={wagerPercent}
            selectedFactId={selectedQuizFactId}
            scoreChange={quizScoreChange}
            onChooseWager={setWagerPercent}
            onAnswer={answerTrivia}
            onContinue={continueAfterTrivia}
          />
        )}
        {showRules && (
          <div
            className="absolute inset-0 z-[70] flex items-center justify-center px-5"
            style={{ background: 'rgba(4,18,32,0.96)', backdropFilter: 'blur(5px)' }}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="pop-in w-full max-w-[315px] rounded-3xl px-6 py-6"
              style={{
                background: 'linear-gradient(145deg, #071f3c, #0b3151)',
                border: '1.5px solid rgba(0,255,204,0.5)',
                boxShadow: '0 24px 70px rgba(0,0,0,0.65), 0 0 35px rgba(0,201,255,0.14)',
              }}
            >
              <div className="text-center">
                <div className="font-black" style={{ color: '#00ffcc', fontSize: 10, letterSpacing: '0.15em' }}>
                  MISSION BRIEFING
                </div>
                <div className="mt-1 font-black" style={{ color: '#e8f4fd', fontSize: 25 }}>
                  HOW TO RECLAIM WATER
                </div>
                <p className="mb-0 mt-2 font-bold" style={{ color: 'rgba(168,216,240,0.72)', fontSize: 11, lineHeight: 1.45 }}>
                  Find the one hidden clean route from START to the groundwater EXIT.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {[
                  ['1', 'DIG CAREFULLY', 'Only the row beside or directly below the miner can be opened.'],
                  ['2', 'FOLLOW GREEN', 'Clean blocks turn green, move the miner, and add 10 points.'],
                  ['3', 'LEARN FROM TOXIC WATER', 'Toxic blocks turn red, cost 5 points, and reveal a global water fact. Confirm each fact before digging again.'],
                  ['4', 'CONNECT AND LEARN', 'Reach the EXIT, read the clean-water fact, and confirm before advancing. Every 10 levels unlocks a trivia wager.'],
                ].map(([number, title, detail]) => (
                  <div key={number} className="flex gap-3">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-black"
                      style={{
                        background: 'rgba(0,255,204,0.13)',
                        border: '1px solid rgba(0,255,204,0.4)',
                        color: '#00ffcc',
                        fontSize: 11,
                      }}
                    >
                      {number}
                    </div>
                    <div>
                      <div className="font-black" style={{ color: '#e8f4fd', fontSize: 10, letterSpacing: '0.06em' }}>
                        {title}
                      </div>
                      <div className="mt-0.5 font-bold" style={{ color: 'rgba(168,216,240,0.65)', fontSize: 10, lineHeight: 1.4 }}>
                        {detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="mt-6 w-full rounded-2xl py-3 font-black transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #00c9ff, #00ffcc)',
                  color: '#041220',
                  border: 'none',
                  fontSize: 13,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                START RECLAIMING
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
