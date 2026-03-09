type ToneOptions = {
  frequency: number;
  durationMs: number;
  type: OscillatorType;
  volume?: number;
  delayMs?: number;
  sweepToFrequency?: number;
};

interface AudioPreferences {
  muted: boolean;
  volume: number;
  uiEnabled: boolean;
}

let sharedAudioContext: AudioContext | null = null;
let sharedMasterGain: GainNode | null = null;
let audioPreferences: AudioPreferences = {
  muted: false,
  volume: 0.75,
  uiEnabled: true,
};

function normalizeVolume(value: number): number {
  if (!Number.isFinite(value)) return 0.75;
  return Math.max(0, Math.min(1, value));
}

export function setAudioPreferences(next: Partial<AudioPreferences>): void {
  audioPreferences = {
    ...audioPreferences,
    ...next,
    volume: normalizeVolume(next.volume ?? audioPreferences.volume),
  };

  if (sharedMasterGain) {
    sharedMasterGain.gain.value = audioPreferences.muted ? 0 : audioPreferences.volume;
  }
}

export function getAudioPreferences(): AudioPreferences {
  return { ...audioPreferences };
}

function getAudioGraph(): { ctx: AudioContext; masterGain: GainNode } | null {
  if (typeof window === "undefined") return null;

  const AudioContextConstructor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextConstructor();
    sharedMasterGain = sharedAudioContext.createGain();
    sharedMasterGain.gain.value = audioPreferences.muted ? 0 : audioPreferences.volume;
    sharedMasterGain.connect(sharedAudioContext.destination);
  }

  if (!sharedMasterGain) return null;
  if (sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume();
  }
  return { ctx: sharedAudioContext, masterGain: sharedMasterGain };
}

function playTone({ frequency, durationMs, type, volume = 0.08, delayMs = 0, sweepToFrequency }: ToneOptions): void {
  if (audioPreferences.muted || audioPreferences.volume <= 0) return;
  const graph = getAudioGraph();
  if (!graph) return;

  const { ctx, masterGain } = graph;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const startAt = ctx.currentTime + delayMs / 1000;
  const endAt = startAt + durationMs / 1000;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  if (sweepToFrequency !== undefined) {
    oscillator.frequency.linearRampToValueAtTime(sweepToFrequency, endAt);
  }

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(startAt);
  oscillator.stop(endAt + 0.015);
}

export function playSuccessTone(): void {
  playTone({ frequency: 660, durationMs: 90, type: "triangle", volume: 0.08 });
  playTone({ frequency: 860, durationMs: 120, type: "triangle", volume: 0.07, delayMs: 70 });
}

export function playErrorTone(): void {
  playTone({ frequency: 230, durationMs: 190, type: "sawtooth", volume: 0.085, sweepToFrequency: 150 });
}

export function playUiHoverTone(): void {
  if (!audioPreferences.uiEnabled) return;
  playTone({ frequency: 530, durationMs: 38, type: "sine", volume: 0.018 });
}

export function playUiClickTone(): void {
  if (!audioPreferences.uiEnabled) return;
  playTone({ frequency: 430, durationMs: 42, type: "square", volume: 0.022 });
  playTone({ frequency: 600, durationMs: 54, type: "triangle", volume: 0.018, delayMs: 34 });
}

export function playCelebrationTone(): void {
  playTone({ frequency: 700, durationMs: 86, type: "triangle", volume: 0.05 });
  playTone({ frequency: 840, durationMs: 86, type: "triangle", volume: 0.05, delayMs: 80 });
  playTone({ frequency: 1020, durationMs: 106, type: "triangle", volume: 0.045, delayMs: 160 });
}

export function playApplauseTone(): void {
  if (audioPreferences.muted || audioPreferences.volume <= 0) return;
  for (let idx = 0; idx < 18; idx += 1) {
    const delay = idx * 70;
    const base = 360 + Math.floor(Math.random() * 320);
    playTone({ frequency: base, durationMs: 36, type: "square", volume: 0.016, delayMs: delay });
    playTone({ frequency: base + 220, durationMs: 24, type: "triangle", volume: 0.012, delayMs: delay + 16 });
  }
}
