import Weather from '../../data/overworld/weather';

/** What falls, how much of it there is, and where each piece sits */
export interface Fall {
  /** How many are in the air at once, per million square pixels */
  density: number;
  /** How far one travels down the screen in a second, in pixels */
  speed: number;
  /** How far it is blown sideways over that same second */
  drift: number;
  /** How long one is, in pixels. A round flake is drawn at length 0 */
  length: number;
  thickness: number;
  colour: string;
}

/**
 * Exported under a name of its own for the tests, which need a real
 * fall to hand `worldDropAt` and should not invent one: a made-up
 * speed and drift would not catch a streak drawn eleven board widths
 * long, and a breeze is exactly the shape that did
 */
export const FALL_TABLE: Partial<Record<Weather, Fall>> = {
  // Nothing falls on a breeze, so what is drawn is what it carries:
  // a few specks crossing the board sideways. Without it the one
  // stirred sky in the game looks exactly like a clear one
  [Weather.Breezy]: {
    density: 260,
    speed: 40,
    drift: 460,
    length: 7,
    thickness: 1,
    colour: '#f4efe0a0',
  },
  [Weather.Drizzle]: {
    density: 900,
    speed: 620,
    drift: 90,
    length: 6,
    thickness: 1,
    colour: '#b9cde68c',
  },
  [Weather.Rain]: {
    density: 2200,
    speed: 900,
    drift: 140,
    length: 9,
    thickness: 1,
    colour: '#c2d6f2a8',
  },
  [Weather.Downpour]: {
    density: 4200,
    speed: 1150,
    drift: 200,
    length: 13,
    thickness: 1.2,
    colour: '#cfe0f7bb',
  },
  [Weather.Thunderstorm]: {
    density: 3600,
    speed: 1100,
    drift: 260,
    length: 12,
    thickness: 1.2,
    colour: '#ccdcf7bb',
  },
  [Weather.Snow]: {
    density: 1300,
    speed: 90,
    drift: 60,
    length: 0,
    thickness: 2,
    colour: '#ffffffd8',
  },
  [Weather.Blizzard]: {
    density: 2400,
    speed: 260,
    drift: 420,
    length: 0,
    thickness: 2.2,
    colour: '#ffffffe0',
  },
  [Weather.Hail]: {
    density: 1500,
    speed: 780,
    drift: 60,
    length: 0,
    thickness: 2.4,
    colour: '#e8f4ffe0',
  },
  [Weather.Sandstorm]: {
    density: 2000,
    speed: 120,
    drift: 900,
    length: 9,
    thickness: 1.4,
    colour: '#e0c184c0',
  },
  [Weather.FallingAsh]: {
    density: 1100,
    speed: 130,
    drift: 80,
    length: 0,
    thickness: 2,
    colour: '#4a4642c0',
  },
  [Weather.PollenDrift]: {
    density: 900,
    speed: 60,
    drift: 150,
    length: 0,
    thickness: 2,
    colour: '#fff2a8c0',
  },
};

/**
 * Where one of them is at this moment.
 *
 * There is no list of drops and nothing is stepped forward a frame at a
 * time: each is a pure function of its own number and the clock, so the
 * fall costs nothing to keep and cannot drift out of step with itself.
 * The scatter is a cheap hash of the index rather than a stored random,
 * for the same reason
 */
function scatter(index: number, salt: number): number {
  const mixed = Math.sin(index * 12.9898 + salt * 78.233) * 43_758.545;

  return mixed - Math.floor(mixed);
}

/**
 * How many of them one drop needs: where it starts, how it falls, and
 * where it stands in the queue when the far field is thinned
 */
export const SALTS = 5;

/**
 * The scatter of every drop, worked out once.
 *
 * A drop's four numbers depend on its index alone, so they are the
 * same on every frame of the fall's life — and the fall is redrawn
 * sixty times a second. A thunderstorm is fourteen thousand drops on
 * a 1080p board, which is fifty-six thousand sines a frame recomputing
 * constants; kept here it is none.
 *
 * Grown rather than sized up front, since how many drops there are
 * depends on the sky and the size of the window
 */
let scattered = new Float32Array(0);

export function scatterOf(count: number): Float32Array {
  if (scattered.length >= count * SALTS) {
    return scattered;
  }
  const grown = new Float32Array(count * SALTS);

  for (let at = 0; at < count; at++) {
    for (let salt = 0; salt < SALTS; salt++) {
      grown[at * SALTS + salt] = scatter(at, salt + 1);
    }
  }
  scattered = grown;
  return grown;
}

/**
 * The heaviest skies are drawn back from what they would really do:
 * a sandstorm that hid the board would hide the pokemon standing on
 * it, and the board is the thing being played
 */
