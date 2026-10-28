import type { RingtoneId } from '../types';

/**
 * Ringtones synthesized with the Web Audio API, so there are no audio files to ship.
 * Each tone is a short phrase that the player repeats every `period` seconds.
 */

interface ToneOpts {
  freq: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  /** Glide to this frequency over the note. */
  endFreq?: number;
  /** Hold full volume and cut off sharply (buzzers), instead of decaying (bells, plucks). */
  hold?: boolean;
}

type Phrase = (ac: AudioContext, out: AudioNode, t: number) => void;

function tone(ac: AudioContext, out: AudioNode, o: ToneOpts) {
  const { freq, at, dur, type = 'sine', gain = 0.2, attack = 0.005, endFreq, hold } = o;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, at + dur);

  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + attack);
  if (hold) {
    env.gain.setValueAtTime(gain, at + dur - 0.02);
    env.gain.linearRampToValueAtTime(0.0001, at + dur);
  } else {
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  }

  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

/** Bell-like strike: a fundamental plus inharmonic partials that fade faster. */
function bell(ac: AudioContext, out: AudioNode, freq: number, at: number, dur: number, gain = 0.16) {
  const partials: [ratio: number, level: number, decay: number][] = [
    [1, 1, 1],
    [2.01, 0.45, 0.6],
    [3.0, 0.22, 0.4],
    [4.16, 0.12, 0.25],
  ];
  for (const [ratio, level, decay] of partials) {
    tone(ac, out, { freq: freq * ratio, at, dur: dur * decay, gain: gain * level, attack: 0.002 });
  }
}

const SYNTHS: Record<RingtoneId, { period: number; phrase: Phrase }> = {
  sweet: {
    period: 2.4,
    phrase: (ac, out, t) => {
      [1047, 1319, 1568, 2093, 1568, 1319].forEach((f, i) => {
        tone(ac, out, { freq: f, at: t + i * 0.18, dur: 0.9, type: 'triangle', gain: 0.16 });
        tone(ac, out, { freq: f * 2, at: t + i * 0.18, dur: 0.4, gain: 0.03 });
      });
    },
  },
  soft: {
    period: 3.2,
    phrase: (ac, out, t) => {
      [440, 554, 659].forEach((f, i) => {
        tone(ac, out, { freq: f, at: t + i * 0.25, dur: 2.6, gain: 0.11, attack: 0.7 });
      });
    },
  },
  chime: {
    period: 3,
    phrase: (ac, out, t) => {
      [1319, 1047, 784].forEach((f, i) => bell(ac, out, f, t + i * 0.45, 2));
    },
  },
  classic: {
    period: 1.1,
    phrase: (ac, out, t) => {
      for (let i = 0; i < 4; i++) {
        tone(ac, out, { freq: 1000, at: t + i * 0.13, dur: 0.09, type: 'square', gain: 0.16, hold: true });
      }
    },
  },
  digital: {
    period: 1,
    phrase: (ac, out, t) => {
      for (const at of [0, 0.12]) {
        tone(ac, out, { freq: 2048, at: t + at, dur: 0.07, type: 'square', gain: 0.12, hold: true });
      }
    },
  },
  retro: {
    period: 1.6,
    phrase: (ac, out, t) => {
      [523, 659, 784, 1047, 988, 784].forEach((f, i) => {
        tone(ac, out, { freq: f, at: t + i * 0.1, dur: 0.09, type: 'square', gain: 0.12, hold: true });
      });
    },
  },
  hard: {
    period: 0.8,
    phrase: (ac, out, t) => {
      // Two slightly detuned saws beat against each other for a harsh buzz.
      for (const f of [196, 207]) {
        tone(ac, out, { freq: f, at: t, dur: 0.5, type: 'sawtooth', gain: 0.14, hold: true });
      }
    },
  },
  suspense: {
    period: 2,
    phrase: (ac, out, t) => {
      tone(ac, out, { freq: 55, at: t, dur: 2, type: 'triangle', gain: 0.12, attack: 0.5 });
      for (const at of [0, 0.28]) {
        tone(ac, out, { freq: 110, endFreq: 45, at: t + at, dur: 0.25, gain: 0.5 });
      }
      // A minor second up high: the classic "something is wrong" interval.
      for (const f of [740, 784]) {
        tone(ac, out, { freq: f, at: t + 0.6, dur: 1.2, gain: 0.05, attack: 0.4 });
      }
    },
  },
  danger: {
    period: 1,
    phrase: (ac, out, t) => {
      tone(ac, out, { freq: 300, endFreq: 700, at: t, dur: 0.7, type: 'sawtooth', gain: 0.13, hold: true });
      tone(ac, out, { freq: 150, endFreq: 350, at: t, dur: 0.7, type: 'square', gain: 0.06, hold: true });
    },
  },
  siren: {
    period: 2,
    phrase: (ac, out, t) => {
      const osc = ac.createOscillator();
      const env = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.linearRampToValueAtTime(1300, t + 1);
      osc.frequency.linearRampToValueAtTime(650, t + 2);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      env.gain.setValueAtTime(0.22, t + 1.98);
      env.gain.linearRampToValueAtTime(0.0001, t + 2);
      osc.connect(env).connect(out);
      osc.start(t);
      osc.stop(t + 2.05);
    },
  },
};

/** Per-note gains above stay low so chords don't clip; this brings the mix up to alarm volume. */
const MAKEUP_GAIN = 3;

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Browsers only allow sound after a user gesture; call this from one so later alarms can play. */
export function unlockAudio() {
  audio();
}

/**
 * Plays a ringtone and returns a function that stops it. With `loop`, the phrase repeats
 * (kept ~1.5s ahead so background timer throttling doesn't leave gaps) and the volume
 * swells from soft to full over 20 seconds.
 */
export function playRingtone(id: RingtoneId, { loop = false } = {}): () => void {
  const ac = audio();
  const master = ac.createGain();
  // Brick-wall limiter: lets the makeup gain push tones loud without clipping.
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.1;
  master.connect(limiter).connect(ac.destination);

  const start = ac.currentTime + 0.05;
  master.gain.setValueAtTime(MAKEUP_GAIN * (loop ? 0.4 : 0.7), start);
  if (loop) master.gain.linearRampToValueAtTime(MAKEUP_GAIN, start + 20);

  const { period, phrase } = SYNTHS[id];
  let next = start;
  let timer = 0;
  const schedule = () => {
    while (next < ac.currentTime + 1.5) {
      phrase(ac, master, next);
      next += period;
    }
    timer = window.setTimeout(schedule, 250);
  };
  if (loop) schedule();
  else phrase(ac, master, start);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(timer);
    const now = ac.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.08);
    window.setTimeout(() => master.disconnect(), 200);
  };
}

let stopPreview: (() => void) | null = null;

/** Plays one phrase of a ringtone, cutting off any preview already playing. */
export function previewRingtone(id: RingtoneId) {
  stopPreview?.();
  stopPreview = playRingtone(id);
}

export function cancelPreview() {
  stopPreview?.();
  stopPreview = null;
}
