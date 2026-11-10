// Audio utility functions for game sound effects

const audioContext: { ctx?: AudioContext; masterGain?: GainNode } = {}
let masterVolume = 0.5 // Default to 50%

function getAudioContext(): AudioContext {
  if (!audioContext.ctx) {
    audioContext.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    // Create a master gain node for volume control
    audioContext.masterGain = audioContext.ctx.createGain()
    audioContext.masterGain.connect(audioContext.ctx.destination)
    audioContext.masterGain.gain.value = masterVolume
  }
  
  // Resume audio context if suspended (due to browser autoplay policy)
  if (audioContext.ctx.state === 'suspended') {
    audioContext.ctx.resume().catch(e => console.debug('Could not resume audio context:', e))
  }
  
  return audioContext.ctx
}

function getMasterGain(): GainNode {
  getAudioContext() // Ensure context is initialized
  return audioContext.masterGain!
}

export function setVolume(volume: number) {
  masterVolume = Math.max(0, Math.min(1, volume)) // Clamp between 0 and 1
  const masterGain = getMasterGain()
  masterGain.gain.value = masterVolume
}

export function getVolume(): number {
  return masterVolume
}

export function playHappySound() {
  try {
    const ctx = getAudioContext()
    const masterGain = getMasterGain()
    const now = ctx.currentTime
    
    // First note - C5
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(masterGain)
    osc1.frequency.value = 523.25 // C5
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
    osc1.start(now)
    osc1.stop(now + 0.1)

    // Second note - E5
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(masterGain)
    osc2.frequency.value = 659.25 // E5
    gain2.gain.setValueAtTime(0.3, now + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
    osc2.start(now + 0.1)
    osc2.stop(now + 0.2)
  } catch (e) {
    console.error('Error playing happy sound:', e)
  }
}

export function playSadSound() {
  try {
    const ctx = getAudioContext()
    const masterGain = getMasterGain()
    const now = ctx.currentTime
    
    // First note - G4
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(masterGain)
    osc1.frequency.value = 392 // G4
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.125)
    osc1.start(now)
    osc1.stop(now + 0.125)

    // Second note - C4
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(masterGain)
    osc2.frequency.value = 261.63 // C4
    gain2.gain.setValueAtTime(0.3, now + 0.125)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
    osc2.start(now + 0.125)
    osc2.stop(now + 0.25)
  } catch (e) {
    console.error('Error playing sad sound:', e)
  }
}

export function playCelebrationSound() {
  try {
    const ctx = getAudioContext()
    const masterGain = getMasterGain()
    const now = ctx.currentTime

    // Create a fun celebration melody with separate oscillators for each note
    const notes = [
      { freq: 523.25, time: 0 },      // C5
      { freq: 659.25, time: 0.15 },   // E5
      { freq: 783.99, time: 0.3 },    // G5
      { freq: 1047.0, time: 0.45 },   // C6
    ]

    notes.forEach(note => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(masterGain)

      osc.frequency.value = note.freq
      gain.gain.setValueAtTime(0.3, now + note.time)
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + 0.12)

      osc.start(now + note.time)
      osc.stop(now + note.time + 0.12)
    })
  } catch (e) {
    console.error('Error playing celebration sound:', e)
  }
}
