import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The game's sound effects, synthesized in the style of a 16-bit
 * console: filtered brass and strings, bells, timpani, stereo, and the
 * echo those consoles laid under everything. Then put through what a
 * Nintendo DS did to a sound: stored at 22.05 kHz as 4-bit IMA-ADPCM,
 * stepped up to 32.768 kHz by a mixer that does not interpolate, and
 * played out at 10 bits. Encoded as Ogg Vorbis at that rate.
 *
 * ```bash
 * FFMPEG=/path/to/ffmpeg node scripts/sound-effects.ts
 * ```
 *
 * Needs an ffmpeg with libvorbis, found on the PATH unless `FFMPEG` names one.
 */

const RATE = 44_100;

/** The rate a DS game kept a sound at, before its mixer played it */
const STORED_RATE = 22_050;

/** The DS's output: 32.768 kHz, 10 bits */
const OUTPUT_RATE = 32_768;
const OUTPUT_STEP = 2 ** (16 - 10);

const DESTINATION = 'public/sounds/effects';

type Instrument =
  | 'brass'
  | 'strings'
  | 'bell'
  | 'harp'
  | 'bass'
  | 'timpani'
  | 'cymbal'
  | 'knock'
  | 'rattle'
  | 'whoosh'
  | 'pop'
  | 'beam'
  | 'rise'
  | 'coin'
  | 'bubble'
  | 'hum'
  | 'snare';

interface Note {
  /** Seconds from the start */
  at: number;
  /** Seconds held, before the release */
  hold: number;
  /** MIDI note number; ignored by the cymbal */
  pitch: number;
  instrument: Instrument;
  volume: number;
  /** -1 is hard left, 1 hard right */
  pan?: number;
}

interface Stereo {
  left: Float32Array;
  right: Float32Array;
}

function frequency(pitch: number): number {
  return 440 * 2 ** ((pitch - 69) / 12);
}

/** Smooths the jump in a saw, so a high note does not alias into a buzz */
function blep(phase: number, step: number): number {
  if (phase < step) {
    const t = phase / step;

    return t + t - t * t - 1;
  }
  if (phase > 1 - step) {
    const t = (phase - 1) / step;

    return t * t + t + t + 1;
  }
  return 0;
}

/** A saw oscillator holding its own phase, started where it is told so a render repeats */
function saw(start: number): (hz: number) => number {
  let phase = start;

  return (hz) => {
    const step = hz / RATE;

    phase = (phase + step) % 1;
    return 2 * phase - 1 - blep(phase, step);
  };
}

/** A resonant low-pass, the state-variable kind */
function lowpass(): (input: number, cutoff: number, resonance: number) => number {
  let low = 0;
  let band = 0;

  return (input, cutoff, resonance) => {
    const f = 2 * Math.sin((Math.PI * Math.min(cutoff, RATE / 6)) / RATE);

    low += f * band;
    band += f * (input - low - resonance * band);
    return low;
  };
}

/** A fixed-seed noise source, so a render is the same file every time */
function noise(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1_103_515_245 + 12_345) & 0x7fffffff;
    return (state / 0x7fffffff) * 2 - 1;
  };
}

/** Attack, decay to a sustain level, and release after the hold */
function adsr(
  time: number,
  hold: number,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
): number {
  let level: number;

  if (time < attack) {
    level = time / attack;
  } else if (time < attack + decay) {
    level = 1 - ((1 - sustain) * (time - attack)) / decay;
  } else {
    level = sustain;
  }
  if (time > hold) {
    level *= Math.max(0, 1 - (time - hold) / release);
  }
  return level;
}

/** How long each instrument rings past its hold */
const RELEASE: Record<Instrument, number> = {
  brass: 0.12,
  strings: 0.6,
  bell: 1.4,
  harp: 0.9,
  bass: 0.15,
  timpani: 0.9,
  cymbal: 1.6,
  knock: 0.12,
  rattle: 0.08,
  whoosh: 0.04,
  pop: 0.05,
  beam: 0.04,
  rise: 0.1,
  coin: 0.35,
  bubble: 0.04,
  hum: 0.2,
  snare: 0.15,
};

/** One instrument's note, as a function of seconds into it */
function voice(note: Note): (time: number) => number {
  const hz = frequency(note.pitch);
  const release = RELEASE[note.instrument];

  switch (note.instrument) {
    case 'brass': {
      const one = saw(0);
      const two = saw(0.37);
      const filter = lowpass();

      return (time) => {
        const envelope = adsr(time, note.hold, 0.02, 0.15, 0.8, release);
        // The filter opens as the note is blown, which is what makes it brass
        const bite = adsr(time, note.hold, 0.04, 0.25, 0.45, release);
        const vibrato = 1 + 0.004 * Math.min(1, time / 0.3) * Math.sin(2 * Math.PI * 5.2 * time);
        const raw = 0.5 * (one(hz * vibrato) + two(hz * vibrato * 1.004));

        return filter(raw, hz * (1.5 + 7 * bite), 0.6) * envelope;
      };
    }
    case 'strings': {
      const oscillators = [saw(0), saw(0.31), saw(0.67)];
      const detune = [0.994, 1, 1.006];
      const filter = lowpass();

      return (time) => {
        const envelope = adsr(time, note.hold, 0.25, 0.2, 0.9, release);
        let raw = 0;

        for (const [index, oscillator] of oscillators.entries()) {
          raw += oscillator(hz * detune[index]);
        }
        return filter(raw / 3, hz * 4, 1.2) * envelope;
      };
    }
    case 'bell': {
      // Two operators at an inharmonic ratio, which is what makes it a bell
      return (time) => {
        const index = 3 * Math.exp(-time * 6);
        const modulator = Math.sin(2 * Math.PI * hz * 3.5 * time) * index;

        return Math.sin(2 * Math.PI * hz * time + modulator) * Math.exp(-time * 2.6);
      };
    }
    case 'harp': {
      return (time) => {
        const modulator = Math.sin(2 * Math.PI * hz * 2 * time) * 1.2 * Math.exp(-time * 8);

        return Math.sin(2 * Math.PI * hz * time + modulator) * Math.exp(-time * 4);
      };
    }
    case 'bass': {
      const one = saw(0);
      const filter = lowpass();

      return (time) => {
        const envelope = adsr(time, note.hold, 0.005, 0.2, 0.7, release);
        const tone = 0.6 * Math.sin(2 * Math.PI * hz * time) + 0.4 * one(hz);

        return filter(tone, hz * 3, 0.4) * envelope;
      };
    }
    case 'timpani': {
      const hiss = noise(7);
      let phase = 0;

      return (time) => {
        // The skin is struck sharp and settles onto its pitch
        phase += (hz * (1 + 0.4 * Math.exp(-time * 30))) / RATE;

        const thud = Math.sin(2 * Math.PI * phase) * Math.exp(-time * 3.5);
        const skin = hiss() * Math.exp(-time * 40) * 0.5;

        return thud + skin;
      };
    }
    case 'knock': {
      // A ball's shell striking the ground: a click, then the hollow of it ringing
      const hiss = noise(note.pitch * 13);
      let last = 0;

      return (time) => {
        const now = hiss();
        const click = (now - last) * Math.exp(-time * 900);

        last = now;

        const hollow = Math.sin(2 * Math.PI * hz * time) * Math.exp(-time * 45);
        const shell = Math.sin(2 * Math.PI * hz * 2.76 * time) * Math.exp(-time * 90) * 0.4;

        return click * 0.6 + hollow + shell;
      };
    }
    case 'rattle': {
      // Whatever is inside it knocking about as it tips
      const hiss = noise(note.pitch * 29);
      const filter = lowpass();

      return (time) => {
        const swell = Math.sin(Math.PI * Math.min(1, time / Math.max(0.01, note.hold)));

        return filter(hiss(), hz, 2.2) * swell * (time > note.hold ? 0 : 1);
      };
    }
    case 'whoosh': {
      // Air past the ball: noise through a filter that climbs as it flies
      const hiss = noise(note.pitch * 41);
      const filter = lowpass();

      return (time) => {
        const through = Math.min(1, time / Math.max(0.01, note.hold));
        const swell = Math.sin(Math.PI * through);

        return filter(hiss(), hz * (0.4 + 2.6 * through), 1.4) * swell;
      };
    }
    case 'pop': {
      // The ball springing open: a blip that jumps up an octave, and a click
      const hiss = noise(note.pitch * 53);

      return (time) => {
        const bend = hz * (1 + Math.min(1, time / 0.02));
        const blip = Math.sin(2 * Math.PI * bend * time) * Math.exp(-time * 30);

        return blip + hiss() * Math.exp(-time * 400) * 0.5;
      };
    }
    case 'beam': {
      // The pokemon drawn in: a bright tone falling two octaves, with a shimmer on it
      let phase = 0;

      return (time) => {
        const through = Math.min(1, time / Math.max(0.01, note.hold));
        const pitch = hz * 2 ** (-2 * through);

        phase += pitch / RATE;

        const shimmer = 1 + 0.5 * Math.sin(2 * Math.PI * 38 * time);
        const tone = Math.sin(2 * Math.PI * phase + 0.8 * Math.sin(2 * Math.PI * phase * 3));

        return tone * shimmer * (1 - 0.6 * through);
      };
    }
    case 'rise': {
      // The beam run backwards: a shimmering tone climbing two octaves over the hold
      let phase = 0;

      return (time) => {
        const through = Math.min(1, time / Math.max(0.01, note.hold));
        const pitch = hz * 2 ** (2 * through * through);

        phase += pitch / RATE;

        const shimmer = 1 + 0.35 * Math.sin(2 * Math.PI * 9 * time);
        const tone = Math.sin(2 * Math.PI * phase + 0.6 * Math.sin(2 * Math.PI * phase * 2));
        const envelope = adsr(time, note.hold, 0.2, 0.1, 1, release);

        return tone * shimmer * envelope * (0.4 + 0.6 * through);
      };
    }
    case 'coin': {
      // A square wave, two saws half a cycle apart, ringing down like a struck coin
      const one = saw(0);
      const two = saw(0.5);
      const filter = lowpass();

      return (time) => {
        const square = 0.5 * (one(hz) - two(hz));

        return filter(square, hz * 5, 0.3) * Math.exp(-time * 7);
      };
    }
    case 'bubble': {
      // A drop of lather: a sine flicking upward as it pops
      return (time) => {
        const bend = hz * (1 + 2.5 * Math.min(1, time / 0.045));

        return Math.sin(2 * Math.PI * bend * time) * Math.exp(-time * 35);
      };
    }
    case 'hum': {
      // A machine winding up: a buzzing saw climbing an octave, with a flutter in it
      const one = saw(0);
      const two = saw(0.21);
      const filter = lowpass();
      let phase = 0;

      return (time) => {
        const through = Math.min(1, time / Math.max(0.01, note.hold));
        const pitch = hz * 2 ** through;

        phase += pitch / RATE;

        const flutter = 1 - 0.3 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (6 + 14 * through) * time));
        const raw = 0.5 * (one(pitch) + two(pitch * 1.01));
        const envelope = adsr(time, note.hold, 0.15, 0.1, 1, release);

        return filter(raw, pitch * (2 + 4 * through), 0.8) * flutter * envelope;
      };
    }
    case 'snare': {
      // A crack of noise over a short drum tone, the march's backbone
      const hiss = noise(note.pitch * 61 + 3);
      let last = 0;

      return (time) => {
        const now = hiss();
        const rattle = (now - last * 0.5) * Math.exp(-time * 28);

        last = now;
        return rattle * 0.7 + Math.sin(2 * Math.PI * 185 * time) * Math.exp(-time * 35) * 0.5;
      };
    }
    // The cymbal
    default: {
      const hiss = noise(11);
      let last = 0;

      return (time) => {
        const now = hiss();
        // Only the sizzle: the difference of two samples drops the body
        const bright = now - last;

        last = now;
        return bright * 0.5 * Math.exp(-time * 2.2);
      };
    }
  }
}

function play(into: Stereo, note: Note): void {
  const sample = voice(note);
  const start = Math.floor(note.at * RATE);
  const length = Math.floor((note.hold + RELEASE[note.instrument]) * RATE);
  const angle = (((note.pan ?? 0) + 1) * Math.PI) / 4;
  const left = note.volume * Math.cos(angle);
  const right = note.volume * Math.sin(angle);

  for (let at = 0; at < length && start + at < into.left.length; at++) {
    const value = sample(at / RATE);

    into.left[start + at] += value * left;
    into.right[start + at] += value * right;
  }
}

/** How much of the echo is heard, and how much of it comes round again */
interface Echo {
  wet: number;
  feedback: number;
}

/** The fanfares' hall */
const HALL: Echo = { wet: 0.32, feedback: 0.38 };

/**
 * The echo a 16-bit console mixed under its music: a feedback delay,
 * darker on every repeat, the two sides a few milliseconds apart
 */
function echo(mix: Stereo, { wet, feedback }: Echo): void {
  const delays = [Math.floor(0.19 * RATE), Math.floor(0.23 * RATE)];

  for (const [side, channel] of [mix.left, mix.right].entries()) {
    const line = new Float32Array(channel.length);
    const delay = delays[side];
    let dark = 0;

    for (let at = 0; at < channel.length; at++) {
      const back = at >= delay ? line[at - delay] : 0;

      dark += 0.35 * (back - dark);
      line[at] = channel[at] + dark * feedback;
      channel[at] += dark * wet;
    }
  }
}

/**
 * The ball clicks shut and it is yours: a harp run up the chord, a
 * brass call over the strings, timpani into the last chord, and bells
 * ringing out over it
 */
function catchSuccess(): Note[] {
  const notes: Note[] = [];

  // The run, C major from the middle of the keyboard to the top
  for (const [index, pitch] of [60, 64, 67, 72, 76, 79, 84, 88].entries()) {
    notes.push({
      at: index * 0.055,
      hold: 0.05,
      pitch,
      instrument: 'harp',
      volume: 0.28,
      pan: -0.6 + index * 0.15,
    });
  }

  // Ta-ta-ta TAAA, ta, ta-ta, TAAAA
  const call: [at: number, hold: number, lead: number, under: number][] = [
    [0.5, 0.07, 67, 64],
    [0.6, 0.07, 67, 64],
    [0.7, 0.07, 67, 64],
    [0.8, 0.26, 72, 67],
    [1.1, 0.16, 76, 72],
    [1.3, 0.07, 74, 71],
    [1.4, 0.07, 76, 72],
    [1.5, 1.6, 79, 76],
  ];

  for (const [at, hold, lead, under] of call) {
    notes.push({ at, hold, pitch: lead, instrument: 'brass', volume: 0.3, pan: 0.15 });
    notes.push({ at, hold, pitch: under, instrument: 'brass', volume: 0.2, pan: -0.25 });
  }

  // The strings swell under the call and land on the chord with it
  for (const [at, hold, pitches] of [
    [0.8, 0.45, [60, 64, 67]],
    [1.25, 0.2, [59, 62, 67]],
    [1.5, 1.7, [60, 64, 67, 72]],
  ] as const) {
    for (const [index, pitch] of pitches.entries()) {
      notes.push({
        at,
        hold,
        pitch,
        instrument: 'strings',
        volume: 0.12,
        pan: -0.5 + index * 0.33,
      });
    }
  }

  for (const [at, hold, pitch] of [
    [0.8, 0.26, 36],
    [1.1, 0.16, 40],
    [1.3, 0.16, 43],
    [1.5, 1.4, 36],
  ] as const) {
    notes.push({ at, hold, pitch, instrument: 'bass', volume: 0.35 });
  }

  // A roll into the chord, then the hit and the crash on it
  for (const at of [1.3, 1.35, 1.4, 1.45]) {
    notes.push({ at, hold: 0, pitch: 43, instrument: 'timpani', volume: 0.25, pan: -0.2 });
  }
  notes.push({ at: 0.8, hold: 0, pitch: 36, instrument: 'timpani', volume: 0.45, pan: -0.2 });
  notes.push({ at: 1.5, hold: 0, pitch: 36, instrument: 'timpani', volume: 0.55, pan: -0.2 });
  notes.push({ at: 1.5, hold: 0, pitch: 0, instrument: 'cymbal', volume: 0.35, pan: 0.4 });

  // The bells, ringing out over the chord and falling away
  const bells = [84, 88, 91, 96, 91, 88, 96, 100];

  for (const [index, pitch] of bells.entries()) {
    notes.push({
      at: 1.7 + index * 0.16,
      hold: 0,
      pitch,
      instrument: 'bell',
      volume: 0.16 * (1 - index / (bells.length + 2)),
      pan: index % 2 === 0 ? 0.55 : -0.55,
    });
  }
  return notes;
}

/**
 * One rock of a thrown ball, played once per shake. A shake is 600 ms
 * in the safari (BALL_SHAKE and BALL_REST), tipping left at 100 ms and
 * right at 300 ms, so the sound is over before the next one starts
 */
function ballShake(): Note[] {
  return [
    { at: 0, hold: 0.09, pitch: 88, instrument: 'rattle', volume: 0.6, pan: -0.35 },
    { at: 0.1, hold: 0, pitch: 69, instrument: 'knock', volume: 0.9, pan: -0.45 },
    { at: 0.2, hold: 0.09, pitch: 88, instrument: 'rattle', volume: 0.6, pan: 0.35 },
    { at: 0.3, hold: 0, pitch: 67, instrument: 'knock', volume: 0.95, pan: 0.45 },
    // Settling back upright, a softer tap
    { at: 0.4, hold: 0, pitch: 72, instrument: 'knock', volume: 0.35 },
  ];
}

/**
 * The ball leaving the hand. In the safari it lands 260 ms after the
 * throw (BALL_LAND) and the first shake starts there, so the throw is
 * over by then: the flight, the ball springing open on the pokemon,
 * and the pokemon drawn in as it lands
 */
function ballThrow(): Note[] {
  return [
    { at: 0, hold: 0.17, pitch: 84, instrument: 'whoosh', volume: 0.8, pan: -0.15 },
    { at: 0.15, hold: 0, pitch: 79, instrument: 'pop', volume: 0.7, pan: 0.1 },
    { at: 0.16, hold: 0.08, pitch: 96, instrument: 'beam', volume: 0.35, pan: 0.1 },
    // A dull thud as it lands, well under the first shake's knock that follows it
    { at: 0.24, hold: 0, pitch: 50, instrument: 'knock', volume: 0.18 },
  ];
}

/** A small room: a shake heard many times a session wants little tail */
const ROOM: Echo = { wet: 0.12, feedback: 0.15 };

/** Between the two, for the moments that want some space but not a hall */
const CHAMBER: Echo = { wet: 0.22, feedback: 0.28 };

/** A run of notes, one instrument, evenly spaced and spread across the stereo field */
function run(
  pitches: readonly number[],
  at: number,
  step: number,
  instrument: Instrument,
  volume: number,
  hold = 0.05,
): Note[] {
  const notes: Note[] = [];

  for (const [index, pitch] of pitches.entries()) {
    notes.push({
      at: at + index * step,
      hold,
      pitch,
      instrument,
      volume,
      pan: pitches.length < 2 ? 0 : -0.6 + (1.2 * index) / (pitches.length - 1),
    });
  }
  return notes;
}

/** A chord on one instrument, its voices spread across the stereo field */
function chord(
  pitches: readonly number[],
  at: number,
  hold: number,
  instrument: Instrument,
  volume: number,
): Note[] {
  return run(pitches, at, 0, instrument, volume, hold);
}

/**
 * It changes: a pad and a climbing tone under a harp that runs faster
 * and faster, a flash, and the new shape sung by the strings a step
 * higher than the build began
 */
function evolution(): Note[] {
  const notes: Note[] = [
    ...chord([48, 55, 60, 64], 0, 2.5, 'strings', 0.1),
    { at: 0, hold: 2.5, pitch: 60, instrument: 'rise', volume: 0.12 },
  ];
  const climb = [60, 64, 67, 72, 76, 79, 84, 88, 91, 96];
  let plucked = 0.1;
  let gap = 0.24;

  // Faster and faster, round and round the chord
  for (let index = 0; plucked < 2.5; index++) {
    notes.push({
      at: plucked,
      hold: 0.04,
      pitch: climb[index % climb.length],
      instrument: 'harp',
      volume: 0.18,
      pan: index % 2 === 0 ? -0.4 : 0.4,
    });
    plucked += gap;
    gap = Math.max(0.045, gap * 0.86);
  }

  // The flash
  notes.push({ at: 2.55, hold: 0, pitch: 38, instrument: 'timpani', volume: 0.5 });
  notes.push({ at: 2.55, hold: 0, pitch: 0, instrument: 'cymbal', volume: 0.4, pan: 0.3 });
  notes.push({ at: 2.55, hold: 0, pitch: 86, instrument: 'pop', volume: 0.3 });

  // A new key, D major, and a melody that soars instead of a call
  for (const [at, hold, pitch] of [
    [2.65, 0.25, 74],
    [2.95, 0.12, 78],
    [3.1, 0.12, 81],
    [3.25, 1.3, 86],
  ] as const) {
    notes.push({ at, hold, pitch, instrument: 'strings', volume: 0.3, pan: 0.1 });
    notes.push({ at, hold, pitch: pitch - 12, instrument: 'strings', volume: 0.2, pan: -0.3 });
  }
  notes.push(...chord([62, 66, 69], 2.65, 1.9, 'strings', 0.1));
  notes.push({ at: 2.65, hold: 1.8, pitch: 38, instrument: 'bass', volume: 0.3 });
  notes.push(...run([98, 102, 105, 110], 3.3, 0.25, 'bell', 0.1, 0));
  return notes;
}

/** Tap, tap, crack: the shell giving way, and a small jingle for what came out */
function eggHatch(): Note[] {
  const notes: Note[] = [];

  for (const [at, pitch, volume, pan] of [
    [0, 79, 0.35, -0.3],
    [0.5, 81, 0.45, 0.3],
    [0.9, 84, 0.6, 0],
  ] as const) {
    notes.push({ at, hold: 0, pitch, instrument: 'knock', volume, pan });
    notes.push({ at, hold: 0.08, pitch: 91, instrument: 'rattle', volume: 0.3, pan: -pan });
  }
  notes.push({ at: 1.3, hold: 0, pitch: 84, instrument: 'pop', volume: 0.5 });
  notes.push(...run([65, 69, 72, 77, 81, 84], 1.35, 0.05, 'harp', 0.25));

  // Da-da-da-DAA in F
  for (const [at, hold, pitch] of [
    [1.75, 0.1, 77],
    [1.9, 0.1, 81],
    [2.05, 0.1, 84],
    [2.2, 0.8, 89],
  ] as const) {
    notes.push({ at, hold, pitch, instrument: 'bell', volume: 0.22, pan: 0.1 });
    notes.push({ at, hold, pitch: pitch - 12, instrument: 'harp', volume: 0.18, pan: -0.2 });
  }
  notes.push(...chord([53, 57, 60, 65], 2.2, 0.8, 'strings', 0.1));
  notes.push({ at: 2.2, hold: 0.7, pitch: 41, instrument: 'bass', volume: 0.3 });
  return notes;
}

/**
 * A mark or a badge won off somebody who matters: a march in F, dotted
 * and brassy over a snare, closing on four hard chords
 */
function trainerBeaten(): Note[] {
  const notes: Note[] = [];
  const beat = 0.24;

  // Da-dum da-dum DA-DA-DUM
  for (const [beats, hold, lead, under] of [
    [0, 0.13, 65, 60],
    [0.75, 0.05, 65, 60],
    [1, 0.13, 69, 65],
    [1.75, 0.05, 69, 65],
    [2, 0.2, 72, 69],
    [3, 0.2, 77, 72],
    [4, 0.35, 76, 72],
  ] as const) {
    const at = beats * beat;

    notes.push({ at, hold, pitch: lead, instrument: 'brass', volume: 0.3, pan: 0.15 });
    notes.push({ at, hold, pitch: under, instrument: 'brass', volume: 0.2, pan: -0.25 });
  }
  for (const beats of [0, 1, 2, 2.5, 3, 3.5]) {
    notes.push({ at: beats * beat, hold: 0, pitch: 1, instrument: 'snare', volume: 0.3, pan: 0.2 });
  }
  for (const [beats, pitch] of [
    [0, 41],
    [1, 45],
    [2, 48],
    [3, 41],
    [4, 48],
  ] as const) {
    notes.push({ at: beats * beat, hold: beat * 0.8, pitch, instrument: 'bass', volume: 0.35 });
  }

  // The cadence, struck: IV, V, and home twice
  const cadence = 5.5 * beat;

  for (const [index, pitches] of [
    [58, 62, 65, 70],
    [60, 64, 67, 72],
    [53, 57, 60, 65],
  ].entries()) {
    const at = cadence + index * 0.3;
    const last = index === 2;

    notes.push(...chord(pitches, at, last ? 1.3 : 0.12, 'brass', 0.14));
    notes.push({ at, hold: 0, pitch: 0, instrument: 'snare', volume: 0.35 });
    notes.push({
      at,
      hold: last ? 1.2 : 0.12,
      pitch: pitches[0] - 12,
      instrument: 'bass',
      volume: 0.35,
    });
  }
  notes.push({
    at: cadence + 0.6,
    hold: 0,
    pitch: 0,
    instrument: 'cymbal',
    volume: 0.35,
    pan: 0.4,
  });
  notes.push({ at: cadence + 0.6, hold: 0, pitch: 41, instrument: 'timpani', volume: 0.45 });
  return notes;
}

/** A species written into the dex: three rising chimes and a glint over them */
function dexEntry(): Note[] {
  return [
    ...run([88, 91, 96], 0, 0.09, 'bell', 0.28, 0),
    ...run([76, 79, 84], 0, 0.09, 'harp', 0.2),
    { at: 0.3, hold: 0, pitch: 103, instrument: 'bell', volume: 0.12, pan: 0.4 },
  ];
}

/** A quest's last step taken: a skipping tune in G, harp and bells over a plucked bass */
function questComplete(): Note[] {
  const notes: Note[] = [];
  const beat = 0.14;

  // Six to the bar, long-short, long-short
  for (const [beats, hold, pitch] of [
    [0, 0.2, 79],
    [2, 0.06, 81],
    [3, 0.2, 83],
    [5, 0.06, 79],
    [6, 0.2, 84],
    [8, 0.06, 83],
    [9, 0.2, 81],
    [11, 0.06, 78],
    [12, 0.9, 79],
  ] as const) {
    notes.push({ at: beats * beat, hold, pitch, instrument: 'bell', volume: 0.2, pan: 0.25 });
    notes.push({
      at: beats * beat,
      hold,
      pitch: pitch - 12,
      instrument: 'harp',
      volume: 0.2,
      pan: -0.25,
    });
  }
  for (const [beats, pitch] of [
    [0, 43],
    [3, 50],
    [6, 48],
    [9, 50],
    [12, 43],
  ] as const) {
    notes.push({ at: beats * beat, hold: 0.08, pitch, instrument: 'harp', volume: 0.3, pan: -0.1 });
  }
  notes.push(...chord([67, 71, 74, 79], 12 * beat, 0.9, 'strings', 0.09));
  notes.push({
    at: 12 * beat + 0.3,
    hold: 0,
    pitch: 103,
    instrument: 'bell',
    volume: 0.1,
    pan: 0.5,
  });
  return notes;
}

/** Through the stones: a climbing warble in an unsettled chord, and out the other side */
function portalCross(): Note[] {
  return [
    { at: 0, hold: 1.2, pitch: 60, instrument: 'whoosh', volume: 0.35, pan: -0.3 },
    { at: 0.1, hold: 1.2, pitch: 67, instrument: 'rise', volume: 0.16, pan: 0.2 },
    { at: 0.2, hold: 1.1, pitch: 63, instrument: 'rise', volume: 0.1, pan: -0.2 },
    ...chord([54, 60, 63, 66], 0, 1.2, 'strings', 0.08),
    { at: 1.32, hold: 0, pitch: 84, instrument: 'pop', volume: 0.35 },
    ...run([84, 91, 96], 1.34, 0.05, 'bell', 0.14, 0),
  ];
}

/** The machine bringing a fossil back: it winds up, beeps, and what stood there is alive */
function fossilRevive(): Note[] {
  return [
    { at: 0, hold: 1.5, pitch: 36, instrument: 'hum', volume: 0.3 },
    { at: 0.3, hold: 1.2, pitch: 60, instrument: 'rise', volume: 0.1 },
    ...run([84, 84, 91], 0.6, 0.35, 'coin', 0.12, 0.03),
    { at: 1.65, hold: 0, pitch: 88, instrument: 'pop', volume: 0.45 },
    { at: 1.65, hold: 0, pitch: 36, instrument: 'timpani', volume: 0.35 },
    ...run([60, 64, 67, 72, 76, 79], 1.7, 0.05, 'harp', 0.22),
    ...run([91, 96], 2.05, 0.15, 'bell', 0.18, 0),
    ...chord([60, 64, 67, 72], 2.05, 0.7, 'strings', 0.1),
  ];
}

/** Honey worked into the bark: bubbles, then a sweet little chime */
function honeyLather(): Note[] {
  const notes: Note[] = [];
  const pitches = [72, 76, 70, 79, 74, 81, 77, 84];

  for (const [index, pitch] of pitches.entries()) {
    notes.push({
      at: index * 0.085 + (index % 3) * 0.012,
      hold: 0,
      pitch,
      instrument: 'bubble',
      volume: 0.25,
      pan: index % 2 === 0 ? -0.45 : 0.45,
    });
  }
  notes.push(...run([84, 88], 0.78, 0.1, 'bell', 0.08, 0));
  return notes;
}

/** Money handed over the counter: two coins settling */
function shopBuy(): Note[] {
  return [
    { at: 0, hold: 0.03, pitch: 83, instrument: 'coin', volume: 0.3, pan: -0.2 },
    { at: 0.07, hold: 0.03, pitch: 88, instrument: 'coin', volume: 0.3, pan: 0.2 },
  ];
}

/** Money coming back across it: the coins the other way up, and a third for the gain */
function shopSell(): Note[] {
  return [
    { at: 0, hold: 0.03, pitch: 88, instrument: 'coin', volume: 0.28, pan: 0.2 },
    { at: 0.07, hold: 0.03, pitch: 83, instrument: 'coin', volume: 0.28, pan: -0.2 },
    { at: 0.16, hold: 0.03, pitch: 95, instrument: 'coin', volume: 0.3 },
  ];
}

/** The ball springing open again: the pop, the pokemon flashing back out, and a shrug */
function catchFailed(): Note[] {
  return [
    { at: 0, hold: 0, pitch: 79, instrument: 'pop', volume: 0.45 },
    { at: 0.02, hold: 0.25, pitch: 72, instrument: 'rise', volume: 0.14 },
    { at: 0, hold: 0.3, pitch: 76, instrument: 'whoosh', volume: 0.25, pan: 0.2 },
    // Da-dum, down a tone and into the minor
    { at: 0.4, hold: 0.12, pitch: 67, instrument: 'harp', volume: 0.3, pan: -0.2 },
    { at: 0.58, hold: 0.3, pitch: 63, instrument: 'harp', volume: 0.3, pan: 0.2 },
    { at: 0.58, hold: 0.3, pitch: 51, instrument: 'bass', volume: 0.25 },
  ];
}

/** Stronger: a quick climb and a ding on top, with a stab of brass under it */
function levelUp(): Note[] {
  return [
    ...run([60, 64, 67, 72, 76, 79], 0, 0.045, 'harp', 0.24),
    { at: 0.3, hold: 0.35, pitch: 84, instrument: 'brass', volume: 0.22, pan: 0.15 },
    { at: 0.3, hold: 0.35, pitch: 79, instrument: 'brass', volume: 0.15, pan: -0.2 },
    { at: 0.3, hold: 0, pitch: 96, instrument: 'bell', volume: 0.2 },
    { at: 0.3, hold: 0.4, pitch: 48, instrument: 'bass', volume: 0.25 },
    { at: 0.5, hold: 0, pitch: 103, instrument: 'bell', volume: 0.1, pan: 0.4 },
  ];
}

/**
 * What a pokemon picks up: a move is the figure C E G C alone, and an
 * ability sets it over the strings. A signature is its own figure
 */
const LEARNED = [72, 76, 79, 84];

function moveLearned(): Note[] {
  return [
    ...run(LEARNED, 0, 0.08, 'bell', 0.22, 0),
    ...run(
      LEARNED.map((pitch) => pitch - 12),
      0,
      0.08,
      'harp',
      0.16,
    ),
  ];
}

function abilityLearned(): Note[] {
  return [
    { at: 0, hold: 0.5, pitch: 60, instrument: 'rise', volume: 0.1 },
    ...run(LEARNED, 0.25, 0.1, 'bell', 0.22, 0),
    ...run(
      LEARNED.map((pitch) => pitch - 12),
      0.25,
      0.1,
      'harp',
      0.18,
    ),
    ...chord([60, 64, 67, 72], 0.55, 1.0, 'strings', 0.11),
    { at: 0.55, hold: 0.9, pitch: 48, instrument: 'bass', volume: 0.25 },
    ...run([91, 96, 100], 0.8, 0.14, 'bell', 0.1, 0),
  ];
}

/**
 * Something only its own line can do: not a fanfare but a secret, a
 * figure in D lydian turning over itself off the beat, bells over harp
 * over a slow pad and a shimmer
 */
function signatureLearned(): Note[] {
  const notes: Note[] = [
    { at: 0, hold: 1.6, pitch: 62, instrument: 'rise', volume: 0.12 },
    ...chord([50, 57, 62, 68], 0, 3.0, 'strings', 0.09),
  ];

  // Up, back, and up past where it started
  for (const [at, pitch] of [
    [0.3, 74],
    [0.48, 78],
    [0.6, 81],
    [0.84, 80],
    [0.96, 78],
    [1.2, 81],
    [1.38, 85],
    [1.5, 86],
  ] as const) {
    notes.push({ at, hold: 0, pitch: pitch + 12, instrument: 'bell', volume: 0.2, pan: 0.3 });
    notes.push({ at: at + 0.02, hold: 0.05, pitch, instrument: 'harp', volume: 0.18, pan: -0.3 });
  }
  notes.push(...chord([74, 78, 81, 85], 1.5, 1.4, 'strings', 0.08));
  notes.push({ at: 1.5, hold: 1.4, pitch: 38, instrument: 'bass', volume: 0.22 });
  notes.push(...run([110, 105, 102, 98], 1.8, 0.3, 'bell', 0.08, 0));
  return notes;
}

/**
 * What a pokemon or a player comes by, in three sizes sharing one
 * figure, G C E G: a slot to carry something is the figure plucked, a
 * prized item rings it, and a mythical one passes it back and forth
 */
const FOUND = [67, 72, 76, 79];

function itemSlot(): Note[] {
  return [
    { at: 0, hold: 0, pitch: 79, instrument: 'pop', volume: 0.54 },
    ...run(FOUND, 0.08, 0.07, 'harp', 0.4),
    { at: 0.36, hold: 0, pitch: 91, instrument: 'coin', volume: 0.25 },
  ];
}

function prizedItem(): Note[] {
  return [
    ...run(
      FOUND.map((pitch) => pitch + 12),
      0,
      0.11,
      'bell',
      0.22,
      0,
    ),
    ...run(FOUND, 0, 0.11, 'harp', 0.28),
    ...chord([60, 64, 67, 72], 0.44, 1.2, 'strings', 0.15),
    { at: 0.44, hold: 1.1, pitch: 48, instrument: 'bass', volume: 0.39 },
    { at: 0.44, hold: 0, pitch: 36, instrument: 'timpani', volume: 0.42 },
    ...run([96, 100, 103], 0.7, 0.16, 'bell', 0.14, 0),
  ];
}

/**
 * A mythical find: a sweep up the harp, the item figure passed between
 * bells and harp across the stereo, a trill, and one deep timpani
 */
function specialItem(): Note[] {
  const notes: Note[] = [
    ...run([55, 60, 64, 67, 72, 76, 79, 84, 88, 91], 0, 0.035, 'harp', 0.22),
    { at: 0.35, hold: 0, pitch: 31, instrument: 'timpani', volume: 0.5 },
    { at: 0.35, hold: 2.2, pitch: 67, instrument: 'rise', volume: 0.08 },
    ...chord([55, 62, 67, 71], 0.35, 2.4, 'strings', 0.1),
    { at: 0.35, hold: 2.3, pitch: 31, instrument: 'bass', volume: 0.3 },
  ];

  // Called on the left, answered on the right
  for (const [index, pitch] of FOUND.entries()) {
    const at = 0.55 + index * 0.32;

    notes.push({ at, hold: 0, pitch: pitch + 24, instrument: 'bell', volume: 0.24, pan: -0.55 });
    notes.push({
      at: at + 0.16,
      hold: 0.06,
      pitch: pitch + 12,
      instrument: 'harp',
      volume: 0.22,
      pan: 0.55,
    });
  }

  // And the trill it ends on, quickening
  const trill = 0.55 + FOUND.length * 0.32;

  for (let index = 0; index < 10; index++) {
    notes.push({
      at: trill + index * 0.07,
      hold: 0,
      pitch: index % 2 === 0 ? 103 : 105,
      instrument: 'bell',
      volume: 0.13 * (1 - index / 14),
      pan: index % 2 === 0 ? -0.3 : 0.3,
    });
  }
  notes.push({ at: trill + 0.72, hold: 0, pitch: 103, instrument: 'bell', volume: 0.16 });
  return notes;
}

/** Something foul lifting off it: a breath of air, a climbing shimmer, and bells falling clean */
function purified(): Note[] {
  return [
    { at: 0, hold: 0.9, pitch: 72, instrument: 'whoosh', volume: 0.25, pan: -0.3 },
    { at: 0.1, hold: 1.2, pitch: 55, instrument: 'rise', volume: 0.12 },
    // A major seventh chord, which is what sounds clean rather than triumphant
    ...chord([60, 64, 67, 71], 0.2, 2.2, 'strings', 0.1),
    ...run([108, 103, 100, 96, 91, 88, 84], 1.2, 0.14, 'bell', 0.14, 0),
    ...run([72, 76, 79, 83, 84], 1.3, 0.12, 'harp', 0.14),
    { at: 1.2, hold: 1.8, pitch: 48, instrument: 'bass', volume: 0.22 },
  ];
}

/**
 * Something enormous has turned up in the chunk, timed to the herald
 * drawn over it (HERALD_BURST_LIFE, 2.6 s): light gathers for 1.09 s,
 * flashes, and a ring rolls out until it is gone. The legendary and
 * the mythical share one call, C up to G and one step on: the
 * legendary's steps down into the minor in the brass, and the
 * mythical's steps up into bright bells
 */
const HERALD_FLASH = 1.09;

function legendaryAppears(): Note[] {
  const notes: Note[] = [];

  // The roll builds while the light is drawn in
  for (let index = 0; index < 18; index++) {
    notes.push({
      at: index * 0.06,
      hold: 0,
      pitch: 36,
      instrument: 'timpani',
      volume: 0.07 + index * 0.012,
      pan: -0.2,
    });
  }
  notes.push({ at: 0, hold: HERALD_FLASH, pitch: 36, instrument: 'hum', volume: 0.08 });

  // The flash
  notes.push({
    at: HERALD_FLASH,
    hold: 0,
    pitch: 36,
    instrument: 'timpani',
    volume: 0.6,
    pan: -0.2,
  });
  notes.push({ at: HERALD_FLASH, hold: 0, pitch: 0, instrument: 'cymbal', volume: 0.35, pan: 0.4 });

  // The call rides out with the ring
  for (const [at, hold, lead, under] of [
    [HERALD_FLASH, 0.35, 60, 55],
    [HERALD_FLASH + 0.42, 0.35, 67, 60],
    [HERALD_FLASH + 0.84, 0.9, 68, 63],
  ] as const) {
    notes.push({ at, hold, pitch: lead, instrument: 'brass', volume: 0.3, pan: 0.15 });
    notes.push({ at, hold, pitch: under, instrument: 'brass', volume: 0.2, pan: -0.25 });
  }
  notes.push(...chord([48, 55, 60, 63], HERALD_FLASH, 1.6, 'strings', 0.1));
  notes.push({ at: HERALD_FLASH, hold: 1.5, pitch: 24, instrument: 'bass', volume: 0.4 });
  notes.push({
    at: HERALD_FLASH + 0.84,
    hold: 0,
    pitch: 32,
    instrument: 'timpani',
    volume: 0.4,
    pan: -0.2,
  });
  return notes;
}

function mythicalAppears(): Note[] {
  return [
    // The shimmer climbs while the light is drawn in
    { at: 0, hold: HERALD_FLASH, pitch: 67, instrument: 'rise', volume: 0.24 },
    ...chord([60, 67, 74], 0, HERALD_FLASH, 'strings', 0.08),
    // The flash, struck on a bell
    { at: HERALD_FLASH, hold: 0, pitch: 96, instrument: 'bell', volume: 0.4 },
    { at: HERALD_FLASH, hold: 0, pitch: 84, instrument: 'pop', volume: 0.25 },
    ...chord([60, 67, 74, 78], HERALD_FLASH, 1.6, 'strings', 0.14),
    // The call, bright, riding out with the ring
    ...run([72, 79, 81], HERALD_FLASH + 0.15, 0.4, 'bell', 0.45, 0),
    ...run([84, 91, 93], HERALD_FLASH + 0.15, 0.4, 'harp', 0.28),
    ...run([100, 102, 103, 105, 107], HERALD_FLASH + 1.0, 0.1, 'bell', 0.16, 0),
    { at: HERALD_FLASH, hold: 1.5, pitch: 36, instrument: 'bass', volume: 0.4 },
  ];
}

/** Something handed over and something received: two passes crossing, and agreed */
function tradeComplete(): Note[] {
  return [
    { at: 0, hold: 0.5, pitch: 79, instrument: 'whoosh', volume: 0.35, pan: -0.6 },
    { at: 0.25, hold: 0.5, pitch: 72, instrument: 'whoosh', volume: 0.35, pan: 0.6 },
    { at: 0.1, hold: 0.5, pitch: 72, instrument: 'rise', volume: 0.1, pan: -0.4 },
    { at: 0.35, hold: 0.45, pitch: 67, instrument: 'rise', volume: 0.1, pan: 0.4 },
    ...run([72, 76, 79, 84], 0.85, 0.07, 'harp', 0.22),
    ...chord([72, 76, 79], 1.15, 0.6, 'bell', 0.14),
    ...chord([60, 64, 67], 1.15, 0.6, 'strings', 0.1),
  ];
}

/**
 * A shiny seen for the first time, timed to the sparkle drawn on it
 * (SPARKLE_LIFE, 1.4 s): a burst of ring and rays at once, then nine
 * glints staggered from 144 ms over the next 696 ms, each one a bell
 */
const SPARKLE_GLINTS = 9;

function shinySparkle(): Note[] {
  const notes: Note[] = [
    // The burst: a struck chord high up, and a flick of shimmer climbing out of it
    ...chord([88, 92, 95, 100], 0, 0, 'bell', 0.14),
    { at: 0, hold: 0.18, pitch: 84, instrument: 'rise', volume: 0.14 },
    { at: 0, hold: 0, pitch: 91, instrument: 'pop', volume: 0.2 },
  ];
  // E major pentatonic, jumping about rather than climbing, so it glitters
  const glints = [100, 104, 97, 107, 102, 109, 104, 112, 107];

  for (let index = 0; index < SPARKLE_GLINTS; index++) {
    notes.push({
      at: 0.144 + (index * 0.696) / SPARKLE_GLINTS,
      hold: 0,
      pitch: glints[index],
      instrument: 'bell',
      volume: 0.2 * (1 - index / (SPARKLE_GLINTS * 2)),
      pan: index % 2 === 0 ? -0.5 + index * 0.05 : 0.5 - index * 0.05,
    });
  }
  return notes;
}

/**
 * The count in, timed to the battle view's (COUNTDOWN, COUNTDOWN_TICK):
 * three, two and one a second apart, a roll into the start, and the
 * fight opening on a brass hit exactly three seconds in
 */
const COUNT_TICK = 1;

function battleStart(): Note[] {
  const notes: Note[] = [];

  // Each count a step higher, so the last one leans into the start
  for (const [index, pitch] of [67, 69, 71].entries()) {
    const at = index * COUNT_TICK;

    notes.push({ at, hold: 0.12, pitch, instrument: 'brass', volume: 0.26 });
    notes.push({
      at,
      hold: 0.12,
      pitch: pitch - 12,
      instrument: 'brass',
      volume: 0.18,
      pan: -0.25,
    });
    notes.push({ at, hold: 0, pitch: pitch + 12, instrument: 'bell', volume: 0.16, pan: 0.3 });
    notes.push({ at, hold: 0, pitch: 43, instrument: 'timpani', volume: 0.35, pan: -0.2 });
  }

  // The snare rolls in over the last half second
  for (let index = 0; index < 8; index++) {
    notes.push({
      at: 2.5 + index * 0.0625,
      hold: 0,
      pitch: 2,
      instrument: 'snare',
      volume: 0.08 + index * 0.025,
      pan: 0.2,
    });
  }

  // And the fight starts on the octave above the first count
  const go = 3 * COUNT_TICK;

  notes.push(...chord([72, 76, 79, 84], go, 0.55, 'brass', 0.16));
  notes.push({ at: go, hold: 0.5, pitch: 36, instrument: 'bass', volume: 0.35 });
  notes.push({ at: go, hold: 0, pitch: 36, instrument: 'timpani', volume: 0.55, pan: -0.2 });
  notes.push({ at: go, hold: 0, pitch: 0, instrument: 'cymbal', volume: 0.35, pan: 0.4 });
  notes.push({ at: go, hold: 0, pitch: 0, instrument: 'snare', volume: 0.3 });
  return notes;
}

/**
 * A battle's end, in three moods that share nothing but the band. Won
 * climbs to B flat and takes the long way home through G flat and A
 * flat, which is what makes it sound like a victory rather than a prize
 */
function battleWon(): Note[] {
  const notes: Note[] = [...run([70, 74, 77], 0, 0.1, 'harp', 0.22)];

  for (const [at, hold, lead, pitches, root] of [
    [0.3, 0.3, 82, [70, 74, 77], 46],
    [0.75, 0.22, 78, [66, 70, 73], 42],
    [1.05, 0.22, 80, [68, 72, 75], 44],
    [1.35, 1.4, 82, [70, 74, 77, 82], 34],
  ] as const) {
    notes.push({ at, hold, pitch: lead, instrument: 'brass', volume: 0.3, pan: 0.15 });
    notes.push(...chord(pitches, at, hold, 'strings', 0.1));
    notes.push({ at, hold, pitch: root, instrument: 'bass', volume: 0.35 });
    notes.push({ at, hold: 0, pitch: root - 12, instrument: 'timpani', volume: 0.4, pan: -0.2 });
  }
  notes.push({ at: 0, hold: 0.3, pitch: 70, instrument: 'brass', volume: 0.18, pan: -0.25 });
  notes.push({ at: 1.35, hold: 1.4, pitch: 77, instrument: 'brass', volume: 0.2, pan: -0.25 });
  notes.push({ at: 1.35, hold: 0, pitch: 0, instrument: 'cymbal', volume: 0.35, pan: 0.4 });
  notes.push(...run([94, 98, 101, 106], 1.6, 0.14, 'bell', 0.12, 0));
  return notes;
}

/**
 * Lost: A minor, slow, the strings stepping down from E to A over a
 * falling bass, and one soft drum where it comes to rest
 */
function battleLost(): Note[] {
  const notes: Note[] = [];

  for (const [at, hold, lead, pitches, root] of [
    [0, 0.35, 76, [57, 60, 64], 45],
    [0.45, 0.35, 74, [57, 60, 64], 45],
    [0.9, 0.35, 72, [53, 57, 60], 41],
    [1.35, 0.35, 71, [52, 56, 59], 40],
    [1.8, 1.3, 69, [45, 57, 60, 64], 33],
  ] as const) {
    notes.push({ at, hold, pitch: lead, instrument: 'strings', volume: 0.3, pan: 0.15 });
    notes.push({
      at: at + 0.02,
      hold: 0.05,
      pitch: lead - 12,
      instrument: 'harp',
      volume: 0.19,
      pan: -0.3,
    });
    notes.push(...chord(pitches, at, hold + 0.05, 'strings', 0.09));
    notes.push({ at, hold, pitch: root, instrument: 'bass', volume: 0.3 });
  }
  notes.push({ at: 1.8, hold: 0, pitch: 33, instrument: 'timpani', volume: 0.3, pan: -0.2 });
  return notes;
}

/**
 * A draw: both sides falling at once, two equal drums one after the
 * other across the stereo, and a figure that goes up and comes back
 * without ever landing, hung on a suspended chord
 */
function battleDraw(): Note[] {
  return [
    { at: 0, hold: 0, pitch: 38, instrument: 'timpani', volume: 0.4, pan: -0.6 },
    { at: 0.22, hold: 0, pitch: 38, instrument: 'timpani', volume: 0.4, pan: 0.6 },
    ...run([74, 76, 79, 81], 0.45, 0.14, 'harp', 0.22),
    ...run([81, 79, 76], 1.05, 0.2, 'bell', 0.16, 0),
    // D with G and A over it and no F sharp: neither major nor minor
    ...chord([50, 62, 67, 69], 0.45, 2, 'strings', 0.09),
    { at: 0.45, hold: 1.9, pitch: 38, instrument: 'bass', volume: 0.26 },
    { at: 1.65, hold: 0, pitch: 88, instrument: 'bell', volume: 0.08, pan: 0.4 },
  ];
}

interface Effect {
  seconds: number;
  notes: () => Note[];
  echo: Echo;
  /**
   * Effects heard one after another share one level, so each keeps its
   * loudness against the others rather than every file peaking alike
   */
  group?: string;
}

const EFFECTS: Record<string, Effect> = {
  catch_success: { seconds: 4, notes: catchSuccess, echo: HALL },
  evolution: { seconds: 5, notes: evolution, echo: HALL },
  egg_hatch: { seconds: 3.5, notes: eggHatch, echo: HALL },
  trainer_beaten: { seconds: 4, notes: trainerBeaten, echo: HALL },
  quest_complete: { seconds: 3, notes: questComplete, echo: HALL },
  dex_entry: { seconds: 1.3, notes: dexEntry, echo: ROOM },
  portal_cross: { seconds: 2.5, notes: portalCross, echo: CHAMBER },
  fossil_revive: { seconds: 3.2, notes: fossilRevive, echo: CHAMBER },
  honey_lather: { seconds: 1.8, notes: honeyLather, echo: ROOM },
  shop_buy: { seconds: 0.6, notes: shopBuy, echo: ROOM, group: 'shop' },
  shop_sell: { seconds: 0.6, notes: shopSell, echo: ROOM, group: 'shop' },
  trade_complete: { seconds: 2.2, notes: tradeComplete, echo: CHAMBER },
  catch_failed: { seconds: 1.4, notes: catchFailed, echo: ROOM },
  level_up: { seconds: 1.6, notes: levelUp, echo: CHAMBER },
  move_learned: { seconds: 1.4, notes: moveLearned, echo: CHAMBER, group: 'learned' },
  ability_learned: { seconds: 2.4, notes: abilityLearned, echo: CHAMBER, group: 'learned' },
  signature_learned: { seconds: 4, notes: signatureLearned, echo: HALL, group: 'learned' },
  item_slot: { seconds: 1.2, notes: itemSlot, echo: ROOM, group: 'found' },
  prized_item: { seconds: 2.5, notes: prizedItem, echo: CHAMBER, group: 'found' },
  special_item: { seconds: 4, notes: specialItem, echo: HALL, group: 'found' },
  purified: { seconds: 3.6, notes: purified, echo: HALL },
  legendary_appears: { seconds: 3.2, notes: legendaryAppears, echo: HALL, group: 'appears' },
  mythical_appears: { seconds: 3.2, notes: mythicalAppears, echo: HALL, group: 'appears' },
  ball_throw: { seconds: 0.36, notes: ballThrow, echo: ROOM, group: 'throw' },
  ball_shake: { seconds: 0.56, notes: ballShake, echo: ROOM, group: 'throw' },
  shiny_sparkle: { seconds: 1.8, notes: shinySparkle, echo: CHAMBER },
  battle_start: { seconds: 4.2, notes: battleStart, echo: ROOM },
  battle_won: { seconds: 3.6, notes: battleWon, echo: HALL, group: 'outcome' },
  battle_lost: { seconds: 3.6, notes: battleLost, echo: HALL, group: 'outcome' },
  battle_draw: { seconds: 3.2, notes: battleDraw, echo: HALL, group: 'outcome' },
};

/** Every note laid down and echoed, not yet levelled */
function mixdown(effect: Effect): Stereo {
  const length = Math.floor(effect.seconds * RATE);
  const mix: Stereo = { left: new Float32Array(length), right: new Float32Array(length) };

  for (const note of effect.notes()) {
    play(mix, note);
  }
  echo(mix, effect.echo);
  return mix;
}

function peakOf(mix: Stereo): number {
  let peak = 0;

  for (let at = 0; at < mix.left.length; at++) {
    peak = Math.max(peak, Math.abs(mix.left[at]), Math.abs(mix.right[at]));
  }
  return peak;
}

/** Levelled by the given peak and faded at the very end, as 16-bit stereo */
function render(mix: Stereo, peak: number): Int16Array {
  const length = mix.left.length;
  const gain = peak === 0 ? 0 : 0.9 / peak;
  const fade = Math.floor(Math.min(0.3, length / RATE / 8) * RATE);
  const out = new Int16Array(length * 2);

  for (let at = 0; at < length; at++) {
    const tail = Math.min(1, (length - at) / fade);

    out[at * 2] = Math.round(mix.left[at] * gain * tail * 32_767);
    out[at * 2 + 1] = Math.round(mix.right[at] * gain * tail * 32_767);
  }
  return out;
}

function wav(samples: Int16Array, rate: number): Buffer {
  const data = Buffer.from(samples.buffer);
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';

// ffmpeg's own Vorbis encoder is experimental and audibly worse, so a build without libvorbis is refused
if (!execFileSync(ffmpeg, ['-hide_banner', '-encoders']).toString().includes('libvorbis')) {
  throw new Error(`${ffmpeg} has no libvorbis encoder; point FFMPEG at a build that does`);
}
const scratch = mkdtempSync(join(tmpdir(), 'sound-effects-'));

mkdirSync(DESTINATION, { recursive: true });
const mixes = new Map<string, Stereo>();
const peaks = new Map<string, number>();

for (const [name, effect] of Object.entries(EFFECTS)) {
  const mix = mixdown(effect);
  const key = effect.group ?? name;

  mixes.set(name, mix);
  peaks.set(key, Math.max(peaks.get(key) ?? 0, peakOf(mix)));
}

/**
 * The DS mixer's output: each output sample takes the stored sample it
 * falls on, with no interpolation between them, rounded to 10 bits
 */
function played(kept: Int16Array): Int16Array {
  const frames = kept.length / 2;
  const length = Math.floor((frames * OUTPUT_RATE) / STORED_RATE);
  const out = new Int16Array(length * 2);

  for (let at = 0; at < length; at++) {
    const from = Math.min(frames - 1, Math.floor((at * STORED_RATE) / OUTPUT_RATE));

    for (const side of [0, 1]) {
      const value = Math.round(kept[from * 2 + side] / OUTPUT_STEP) * OUTPUT_STEP;

      out[at * 2 + side] = Math.max(-32_768, Math.min(32_768 - OUTPUT_STEP, value));
    }
  }
  return out;
}

/** Stored as the DS kept it, then read back: ffmpeg does the resampling and the ADPCM round trip */
function stored(source: string, name: string): Int16Array {
  const adpcm = join(scratch, `${name}.adpcm.wav`);
  const raw = join(scratch, `${name}.raw`);
  const quiet = ['-y', '-loglevel', 'error'];

  execFileSync(ffmpeg, [
    ...quiet,
    '-i',
    source,
    '-ar',
    `${STORED_RATE}`,
    '-c:a',
    'adpcm_ima_wav',
    adpcm,
  ]);
  execFileSync(ffmpeg, [...quiet, '-i', adpcm, '-f', 's16le', '-c:a', 'pcm_s16le', raw]);

  const bytes = readFileSync(raw);

  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
}

for (const [name, effect] of Object.entries(EFFECTS)) {
  const source = join(scratch, `${name}.wav`);
  const output = join(scratch, `${name}.ds.wav`);
  const target = join(DESTINATION, `${name}.ogg`);
  const mix = mixes.get(name);

  if (mix == null) {
    continue;
  }
  writeFileSync(source, wav(render(mix, peaks.get(effect.group ?? name) ?? 0), RATE));
  writeFileSync(output, wav(played(stored(source, name)), OUTPUT_RATE));
  execFileSync(ffmpeg, [
    '-y',
    '-loglevel',
    'error',
    '-i',
    output,
    '-c:a',
    'libvorbis',
    '-q:a',
    '6',
    target,
  ]);
  console.log(`${target}  ${effect.seconds}s`);
}
rmSync(scratch, { recursive: true, force: true });
