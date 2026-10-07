export type ScanFeedback = 'success' | 'repeat' | 'error'

// [frequency in Hz (0 = silence), duration in ms]
type Note = [number, number]

const feedback: Record<ScanFeedback, { vibrate: number | number[]; notes: Note[] }> = {
  success: {
    vibrate: 80,
    notes: [
      [880, 70],
      [1320, 90],
    ],
  },
  repeat: {
    vibrate: [60, 80, 60],
    notes: [
      [440, 90],
      [0, 60],
      [440, 90],
    ],
  },
  error: { vibrate: 250, notes: [[220, 250]] },
}

const VOLUME = 0.2

let context: AudioContext | null = null

// Browsers (iPhone above all) only play sound after a tap; ScanStation calls this on pointerdown.
export function unlockScanSound() {
  if (typeof window === 'undefined') return
  const Context =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return
  context ??= new Context()
  if (context.state === 'suspended') void context.resume()
}

export function playScanFeedback(kind: ScanFeedback) {
  const { vibrate, notes } = feedback[kind]
  navigator.vibrate?.(vibrate)
  unlockScanSound()
  if (!context || context.state === 'closed') return

  let at = context.currentTime
  for (const [frequency, ms] of notes) {
    const seconds = ms / 1000
    if (frequency) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.frequency.value = frequency
      // Short fades so the tone does not click.
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(VOLUME, at + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, at + seconds)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(at)
      oscillator.stop(at + seconds + 0.02)
    }
    at += seconds
  }
}
