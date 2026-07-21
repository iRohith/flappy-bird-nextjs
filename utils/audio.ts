import { useGameStore } from "../store/useGameStore";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

interface ToneOptions {
  frequency: number;
  duration: number;
  delay?: number;
  type?: OscillatorType;
  volume?: number;
  endFrequency?: number;
}

function tone({
  frequency,
  duration,
  delay = 0,
  type = "square",
  volume = 0.035,
  endFrequency = frequency,
}: ToneOptions) {
  const isMuted = useGameStore.getState().muted;
  if (isMuted) return;

  const audio = getAudioContext();
  if (!audio) return;

  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, endFrequency),
    start + duration,
  );

  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playFlap() {
  tone({
    frequency: 560,
    endFrequency: 760,
    duration: 0.07,
    type: "square",
    volume: 0.025,
  });
}

export function playPoint() {
  tone({
    frequency: 880,
    endFrequency: 1060,
    duration: 0.08,
    type: "square",
    volume: 0.028,
  });
  tone({
    frequency: 1120,
    endFrequency: 1320,
    duration: 0.09,
    delay: 0.075,
    type: "square",
    volume: 0.024,
  });
}

export function playHit() {
  tone({
    frequency: 170,
    endFrequency: 58,
    duration: 0.22,
    type: "sawtooth",
    volume: 0.055,
  });
}

export function playGameOver() {
  tone({
    frequency: 260,
    endFrequency: 150,
    duration: 0.16,
    type: "square",
    volume: 0.025,
  });
  tone({
    frequency: 190,
    endFrequency: 95,
    duration: 0.24,
    delay: 0.14,
    type: "square",
    volume: 0.027,
  });
}
export function closeAudio() {
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
}
