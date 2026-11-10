// Audio utility functions for game sound effects

const audioContext: { ctx?: AudioContext } = {}

function getAudioContext(): AudioContext {
  if (!audioContext.ctx) {
    audioContext.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext.ctx
}

export function playHappySound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Two ascending notes for a happy "beep"
    osc.frequency.setValueAtTime(523.25, now) // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1) // E5

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    osc.start(now)
    osc.stop(now + 0.2)
  } catch (e) {
    console.debug('Audio context not available')
  }
}

export function playSadSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Two descending notes for a sad "beep"
    osc.frequency.setValueAtTime(392, now) // G4
    osc.frequency.setValueAtTime(261.63, now + 0.15) // C4

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc.start(now)
    osc.stop(now + 0.25)
  } catch (e) {
    console.debug('Audio context not available')
  }
}

export function playCelebrationSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Create a fun celebration melody
    const notes = [
      { freq: 523.25, time: 0 },      // C5
      { freq: 659.25, time: 0.1 },    // E5
      { freq: 783.99, time: 0.2 },    // G5
      { freq: 1047.0, time: 0.3 },    // C6
    ]

    notes.forEach(note => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.frequency.setValueAtTime(note.freq, now + note.time)
      gain.gain.setValueAtTime(0.3, now + note.time)
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + 0.15)

      osc.start(now + note.time)
      osc.stop(now + note.time + 0.15)
    })
  } catch (e) {
    console.debug('Audio context not available')
  }
}
