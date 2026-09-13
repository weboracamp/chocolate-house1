/**
 * Web Audio API Sound Synthesizer for POS / Dashboard alerts.
 * Generates an elegant, warm 3-tone chime without relying on external media files.
 */

const STORAGE_KEY = 'chocolate_house_sound_enabled';

export function isSoundEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
}

export function playNewOrderSound(): void {
  if (!isSoundEnabled()) return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Master volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.connect(ctx.destination);

    // Chime Note 1: E5 (659.25 Hz) - Warm Bell Tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.8, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Chime Note 2: B5 (987.77 Hz) - Sparkle Tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.9, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);

    // Chime Note 3: E6 (1318.51 Hz) - High harmonic ring
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1318.51, now + 0.25);
    gain3.gain.setValueAtTime(0, now + 0.25);
    gain3.gain.linearRampToValueAtTime(0.7, now + 0.27);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(now + 0.25);
    osc3.stop(now + 0.95);
  } catch (err) {
    // Autoplay restrictions or headless environments
    console.warn('[SoundAlert] Audio synthesizer notice:', err);
  }
}
