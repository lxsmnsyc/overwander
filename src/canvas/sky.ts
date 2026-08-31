import Weather from '../data/overworld/weather';
import type QuadBatch from './gl/quad-batch';
import type { QuadBlend, QuadPoint } from './gl/quad-batch';
import { PICTURE_SPAN, projectAir } from './board';

/**
 * The sky over the board, drawn rather than packed.
 *
 * Weather is a wash of colour and a great many small moving things, and
 * both are cheaper to draw than to store: a sheet of rain would be one
 * download and one loop for every kind of falling thing, where the
 * arithmetic below is a few lines each and scales itself to whatever
 * the window is.
 *
 * It is laid over the finished board, under nothing, so it covers the
 * ground and the people on it the way weather does.
 *
 * Everything below is sized for one reference screen and scaled to the
 * window, so a sky costs what it costs whatever the window is: see
 * `REFERENCE`.
 */

/**
 * How a sky's colour is laid over the board.
 *
 * The three are not decoration: a wash multiplied can only ever darken
 * what it is over, so a pale one laid that way does nothing at all,
 * which is what mist did before it was given a mode of its own
 */
type WashMode =
  /** Rain and cloud, which take light away */
  | 'darken'
  /** Fog and driven snow, which flatten what is behind them */
  | 'veil'
  /** An aurora, which adds light rather than taking any */
  | 'lift';

const MODES: Record<WashMode, GlobalCompositeOperation> = {
  darken: 'multiply',
  veil: 'source-over',
  lift: 'screen',
};

/** The same three, as the batch names them */
const BLENDS: Record<WashMode, QuadBlend> = {
  darken: 'multiply',
  veil: 'over',
  lift: 'screen',
};

/** The wash a sky lays over the board, if it lays one. */
interface Wash {
  colour: string;
  /** How much of it, at the sky's strongest */
  depth: number;
  mode: WashMode;
}

const WASHES: Partial<Record<Weather, Wash>> = {
  [Weather.Cloudy]: { colour: '#8a93a8', depth: 0.16, mode: 'darken' },
  [Weather.Overcast]: { colour: '#6f7789', depth: 0.24, mode: 'darken' },
  [Weather.Drizzle]: { colour: '#6d7d95', depth: 0.2, mode: 'darken' },
  [Weather.Rain]: { colour: '#5d6f8c', depth: 0.28, mode: 'darken' },
  [Weather.Downpour]: { colour: '#485874', depth: 0.4, mode: 'darken' },
  [Weather.Thunderstorm]: { colour: '#3f4a63', depth: 0.44, mode: 'darken' },
  [Weather.Mist]: { colour: '#c3ccd6', depth: 0.26, mode: 'veil' },
  [Weather.Fog]: { colour: '#cdd4dc', depth: 0.34, mode: 'veil' },
  [Weather.Haze]: { colour: '#d8c9a8', depth: 0.24, mode: 'veil' },
  [Weather.Frost]: { colour: '#bcd2e4', depth: 0.16, mode: 'veil' },
  [Weather.Snow]: { colour: '#c9d8e6', depth: 0.2, mode: 'veil' },
  [Weather.Blizzard]: { colour: '#dae5ef', depth: 0.3, mode: 'veil' },
  [Weather.Hail]: { colour: '#9fb3c6', depth: 0.26, mode: 'veil' },
  [Weather.Sandstorm]: { colour: '#c9a86a', depth: 0.28, mode: 'veil' },
  [Weather.DustHaze]: { colour: '#c8ab7c', depth: 0.26, mode: 'veil' },
  [Weather.Heatwave]: { colour: '#ffb15e', depth: 0.16, mode: 'veil' },
  [Weather.FallingAsh]: { colour: '#6b6560', depth: 0.3, mode: 'darken' },
  [Weather.Aurora]: { colour: '#2bff9e', depth: 0.1, mode: 'lift' },
  [Weather.Rainbow]: { colour: '#ffe9a8', depth: 0.12, mode: 'lift' },
  [Weather.PollenDrift]: { colour: '#e8dd8a', depth: 0.14, mode: 'veil' },
  [Weather.MeteorShower]: { colour: '#3b3f6b', depth: 0.22, mode: 'darken' },
  // Dead-still air, flattened: what is seen through a mirage is the
  // same country with the distance taken out of it
  [Weather.FataMorgana]: { colour: '#e9dcc2', depth: 0.18, mode: 'veil' },
  // A rainbow with the colour gone stands in fog, so it stands in
  // fog's own wash
  [Weather.Fogbow]: { colour: '#ccd4dc', depth: 0.3, mode: 'veil' },
};

/**
 * A number between 0 and 1 that is always the same for the same seed.
 *
 * The sky is derived rather than stored, and a meteor is no different:
 * every watcher of the same second sees the same one cross. It is the
 * one-argument cousin of `scatter` below, which salts an index instead
 */
function seeded(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43_758.545;

  return value - Math.floor(value);
}

/**
 * A shower of shooting stars: a few crossing at a time, each drawn
 * from its head backwards so it reads as something written rather
 * than something falling.
 *
 * It is not a fall. A fall is the same drop over and over at the same
 * speed, which is why a sparse one read as thin rain: what a meteor
 * does is arrive, streak, and go out, and the tail behind the head is
 * the part that says so
 */
interface Shower {
  /** How many are crossing at once, on the reference screen */
  count: number;
  /** How long one takes to cross, in seconds */
  life: number;
  /** How far one travels, as a share of the picture's diagonal */
  reach: number;
  /** How long the tail is, as a share of that travel */
  tail: number;
  /** How many pieces the tail is drawn in, each fainter than the last */
  pieces: number;
  colour: string;
  thickness: number;
}

const SHOWERS: Partial<Record<Weather, Shower>> = {
  [Weather.MeteorShower]: {
    count: 3,
    life: 1.6,
    reach: 0.55,
    tail: 0.34,
    pieces: 14,
    colour: '#fff1cf',
    thickness: 2.2,
  },
};

/**
 * Where one meteor is this moment, or null while it is between
 * crossings.
 *
 * The head is where it has reached; the tail runs back along the way
 * it came, and is short while it is still setting out so the streak
 * is drawn in rather than arriving whole
 */
function meteorAt(
  shower: Shower,
  which: number,
  width: number,
  height: number,
  seconds: number,
): { head: QuadPoint; back: QuadPoint; light: number } | null {
  const slot = seconds / shower.life + which * 0.61;
  const cycle = Math.floor(slot);
  const through = slot - cycle;
  const seed = which * 977 + cycle;
  // Not every slot flies: a sky where one crosses on a beat is a
  // metronome rather than a shower
  if (seeded(seed + 5) < 0.35) {
    return null;
  }

  const span = Math.hypot(width, height) * shower.reach;
  // Down and across, always the same way: a shower radiates from one
  // point in the sky, so they run parallel to each other
  const angle = Math.PI * 0.28 + (seeded(seed + 1) - 0.5) * 0.22;
  const step = { x: Math.cos(angle) * span, y: Math.sin(angle) * span };
  const from = {
    x: width * (seeded(seed + 2) * 1.3 - 0.45),
    y: height * (seeded(seed + 3) * 0.5 - 0.25),
  };
  const head = { x: from.x + step.x * through, y: from.y + step.y * through };
  const behind = Math.min(shower.tail, through);

  return {
    head,
    back: { x: head.x - step.x * behind, y: head.y - step.y * behind },
    // Lit as it arrives and gone before it lands, so nothing ends
    // abruptly in the middle of the picture
    light: Math.min(1, through * 14) * Math.min(1, (1 - through) * 3.2),
  };
}

/**
 * A point the dark is kept off, and how far.
 *
 * Noon gone dark is not a wash: a wash over everything hides the
 * things a player is standing there to find. What it is instead is a
 * dark room with lamps in it, and what carries a lamp is whatever the
 * board would have been drawing anyway: a landmark, a pokemon
 * standing on a cell
 */
export interface Lamp {
  x: number;
  y: number;
  /** How far the light reaches, in drawn pixels */
  reach: number;
}

/** A sky that puts the lights out, and how far out. */
interface Lamplit {
  colour: string;
  /** How dark it gets where nothing is lit */
  depth: number;
}

const LAMPLIT: Partial<Record<Weather, Lamplit>> = {
  // Pitch black, and black rather than the blue it used to be: a dark
  // day is the one sky whose whole point is that the board is gone
  // except where something is lit, and a night-blue veil at seven
  // eighths left the country legible through it
  [Weather.DarkDay]: { colour: '#000000', depth: 1 },
};

/**
 * How wide the dark is kept, whatever the window is. A lamp is a soft
 * edge and nothing else, so it survives being drawn small and
 * stretched: a mask the size of the page would be a page repainted
 * every frame
 */
const MASK_WIDE = 320;

let mask: HTMLCanvasElement | null = null;

/**
 * The dark, with a hole burnt in it wherever a lamp stands.
 *
 * Cut rather than drawn: the lamps are taken out of a full sheet with
 * `destination-out`, so two lamps standing close together share one
 * pool of light instead of stacking two into a bright spot
 */
function lampMask(
  width: number,
  height: number,
  dark: Lamplit,
  lamps: Lamp[],
  strength: number,
): HTMLCanvasElement | null {
  const held = mask ?? document.createElement('canvas');
  const scale = MASK_WIDE / width;
  const down = Math.max(1, Math.round(height * scale));

  held.width = MASK_WIDE;
  held.height = down;

  const into = held.getContext('2d');

  if (into == null) {
    return null;
  }
  into.clearRect(0, 0, MASK_WIDE, down);
  into.globalAlpha = dark.depth * strength;
  into.fillStyle = dark.colour;
  into.fillRect(0, 0, MASK_WIDE, down);
  into.globalAlpha = 1;
  into.globalCompositeOperation = 'destination-out';
  for (const lamp of lamps) {
    const reach = lamp.reach * scale;

    if (!(reach > 0)) {
      continue;
    }
    const glow = into.createRadialGradient(
      lamp.x * scale,
      lamp.y * scale,
      0,
      lamp.x * scale,
      lamp.y * scale,
      reach,
    );

    // Nearly clear at the lamp and gone by its edge, so what it lights
    // has no rim around it
    glow.addColorStop(0, '#000000f2');
    glow.addColorStop(0.55, '#000000a8');
    glow.addColorStop(1, '#00000000');
    into.fillStyle = glow;
    into.fillRect(lamp.x * scale - reach, lamp.y * scale - reach, reach * 2, reach * 2);
  }
  into.globalCompositeOperation = 'source-over';
  mask = held;
  return held;
}

/** A sky that lights up, and how often. */
interface Flash {
  /** How long between strikes, in seconds */
  every: number;
  /** How long one lasts */
  hold: number;
  colour: string;
  /** How much of it at the brightest */
  depth: number;
}

const FLASHES: Partial<Record<Weather, Flash>> = {
  [Weather.Thunderstorm]: { every: 4.5, hold: 0.65, colour: '#e8f0ff', depth: 0.5 },
};

/** How bright the sky is at this moment, if lightning is striking */
function flashAt(weather: Weather, seconds: number): number {
  const flash = FLASHES[weather];

  if (flash == null) {
    return 0;
  }
  const slot = seconds / flash.every;
  const cycle = Math.floor(slot);
  const through = (slot - cycle - seeded(cycle) * 0.7) / (flash.hold / flash.every);

  if (through < 0 || through > 1) {
    return 0;
  }
  // Two peaks and a dip: one stroke is a lamp being switched on, and
  // lightning is a stroke and its return
  const first = Math.exp(-(((through - 0.06) / 0.05) ** 2));
  const second = 0.6 * Math.exp(-(((through - 0.3) / 0.1) ** 2));

  // Some strikes are further off than others
  return Math.min(1, first + second) * (0.45 + 0.55 * seeded(cycle + 61));
}

/** What is falling, and how it falls. */
interface Fall {
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
const SALTS = 5;

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

function scatterOf(count: number): Float32Array {
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

/**
 * How far past the screen the fall is spread, on the reference screen.
 *
 * Only far enough to hide a drop's own trail: the positions wrap, so
 * nothing has to be drawn off the edge in order to arrive from it. The
 * longest trail any sky draws is a breeze's, at about eighty pixels.
 *
 * It is not free room. The count is a density over the whole stripe,
 * so a margin twice as wide is nearly twice as many drops, and every
 * one of the extra ones is drawn where nobody can see it
 */
const MARGIN = 128;

/**
 * The screen every fall is described for.
 *
 * A density is drops per square pixel, so left alone a fall costs what
 * the window is worth: the same blizzard is 1,900 flakes on a laptop
 * and 22,000 on a 4K monitor, each of them a ninth the size of the
 * board they are falling on. Both are wrong. The board is fitted to
 * the window, so a bigger window is the same board drawn larger, and
 * the sky over it should be the same sky drawn larger too
 */
const REFERENCE = 960 * 540;

/**
 * How much of a fall's own density is actually drawn.
 *
 * The tables describe a sky flat against the glass, where every drop
 * costs the same and none of them overlap. Standing in the world they
 * pile up down the near half of the volume and read far heavier than
 * the same number ever did on the lens, so the whole set is drawn back
 * to this. It is a number rather than eleven smaller ones because it
 * is one decision, and the tables still read as each sky's own
 */
const SKY_DENSITY = 0.4;

/**
 * How much larger than the reference this window is, along one side.
 *
 * Clamped at both ends: below it a drop thins to a hairline nobody can
 * see, and above it the count is allowed to grow again rather than a
 * raindrop being drawn four pixels wide
 */
const ZOOM_RANGE = [0.75, 2.5];

function zoomFor(width: number, height: number): number {
  const raw = Math.sqrt((width * height) / REFERENCE);

  return Math.min(ZOOM_RANGE[1], Math.max(ZOOM_RANGE[0], raw));
}

/**
 * Where every drop of a fall is this moment, handed one at a time to
 * whoever is drawing them. `tip` is where the drop ends, which is
 * where it started for a fall of round drops.
 *
 * A function of its own so the stroked pass and the batched one ask
 * the same arithmetic the same question. Two copies of this would be
 * two skies that drift apart by a pixel with nobody able to say which
 */
function eachDrop(
  width: number,
  height: number,
  fall: Fall,
  clock: number,
  zoom: number,
  visit: (x: number, y: number, tipX: number, tipY: number) => void,
): void {
  const seconds = clock / 1000;
  const margin = MARGIN * zoom;
  const across = width + margin * 2;
  const down = height + margin;
  // Counted on the reference screen rather than this one, so the sky
  // costs the same whatever the window is: the drops are made larger
  // instead of more numerous
  const count = Math.round(
    (fall.density * SKY_DENSITY * across * down) / (zoom * zoom) / 1_000_000,
  );
  const length = fall.length * zoom;

  // A round drop is a segment going nowhere under a round cap, which
  // is a circle of the cap's own width — so the cap carries the
  // diameter where an arc carried the radius
  const noise = scatterOf(count);
  // Lifted out of the loop: both are the same for every drop, and a
  // fall this wide is a hot enough loop to care
  const fallen = seconds * fall.speed * zoom;
  const blown = seconds * fall.drift * zoom;
  // Along the way it is actually travelling, so a drop blown sideways
  // leans the way the wind is blowing it
  const lean = fall.drift / fall.speed;

  for (let at = 0; at < count; at++) {
    const of = at * SALTS;
    // Its own pace, so the fall reads as many things falling rather
    // than one sheet sliding
    const pace = 0.75 + noise[of + 2] * 0.5;
    const y = ((noise[of] * down + fallen * pace) % down) - margin;
    const x = ((noise[of + 1] * across + blown * pace) % across) - margin + noise[of + 3] * zoom;

    visit(x, y, x - length * lean, y - length);
  }
}

/**
 * Where the board is on screen, and which way round it is.
 *
 * The picture's box is what `fitPicture` already answers with, and the
 * yaw is the camera the player has walked round. Handed in, the sky is
 * drawn as weather standing in the world; left out, it is drawn flat
 * against the glass the way it always was — which is what the weather
 * demo, having no board to stand in, still wants
 */
export interface SkyCamera {
  yaw: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * How wide the volume of weather is and how high it reaches, in board
 * widths. It has to be a good deal larger than the board: the volume
 * is fixed in the world, so it must cover the frame whichever way the
 * camera is facing
 */
const VOLUME_SPAN = 4.6;
const VOLUME_HEAD = 1.5;

/**
 * How many more drops go in it than a flat sky asks for. Most of the
 * volume is off screen at any one moment, and the ones that are not
 * are thinned again by depth, so the count has to start higher to
 * arrive at the same weather
 */
const VOLUME_FILL = 4.3;

/**
 * The depth at which every drop is kept, and how gently the rest leave.
 *
 * A slab of world at arm's length projects onto more screen than the
 * same slab at the horizon, so a density even in the world piles up
 * into a mat along the far edge. Keeping a share proportional to the
 * scale squared evens it out — and the ones it drops were costing full
 * price to draw a third of a pixel. The band is what stops a drop
 * blinking as the camera turns it past the line
 */
const NEAR = 1.6;
const THIN_BAND = 0.18;

/**
 * How much longer a streak is drawn than its own length.
 *
 * A streak that is mostly vertical keeps only `cos(pitch)` of itself
 * seen from up here, so a fall drawn true to scale reads lighter than
 * the flat version of the same sky
 */
const STREAK = 1.5;

/** Where one drop is in the world, and which way it is travelling */
export interface WorldDrop {
  u: number;
  v: number;
  h: number;
  /** The other end of its streak, back along the way it came */
  tailU: number;
  tailH: number;
}

/**
 * Where one drop of a fall stands in the world at this moment.
 *
 * Exported for the one property worth guarding: **it takes no yaw**.
 * A drop's place is `seconds * speed` rather than a step added each
 * frame, so anything that moves with the camera and gets into this
 * arithmetic rewrites the whole history of the fall every frame — and
 * the board's fit, which swells and shrinks four times a turn, is
 * exactly such a thing. `perBoard` is how many pixels a board width is
 * worth, taken from the picture's own width, which the yaw never
 * touches
 */
export function worldDropAt(
  fall: Fall,
  index: number,
  seconds: number,
  perBoard: number,
): WorldDrop {
  const noise = scatterOf(index + 1);
  const of = index * SALTS;
  const pace = 0.75 + noise[of + 2] * 0.5;
  const speed = fall.speed / perBoard;
  const drift = fall.drift / perBoard;
  const length = (fall.length / perBoard) * STREAK;
  /**
   * The way it is actually travelling, as a unit vector. The flat sky
   * leans a streak by `drift / speed` and gets away with it because
   * the streak is a handful of pixels either way; in the world that
   * ratio is the whole length, and a breeze at sixty parts sideways to
   * five down drew a streak eleven board widths long
   */
  const along = Math.hypot(drift, speed) || 1;
  const edge = (VOLUME_SPAN - 1) / 2;
  const h = VOLUME_HEAD - ((noise[of] * VOLUME_HEAD + seconds * speed * pace) % VOLUME_HEAD);

  return {
    u: ((noise[of + 1] * VOLUME_SPAN + seconds * drift * pace) % VOLUME_SPAN) - edge,
    v: noise[of + 3] * VOLUME_SPAN - edge,
    h,
    tailU:
      ((noise[of + 1] * VOLUME_SPAN + seconds * drift * pace) % VOLUME_SPAN) -
      edge -
      (drift / along) * length,
    tailH: h + (speed / along) * length,
  };
}

/**
 * Whether a drop this far off is drawn at all, and how strongly.
 *
 * A slab of world at arm's length projects onto more screen than the
 * same slab at the horizon, so a density even in the world piles up
 * into a mat along the far edge. Keeping a share proportional to the
 * scale squared evens it out, and the ones it drops were costing full
 * price to draw a third of a pixel. `queued` is the drop's own place
 * in the queue, so the same drops thin out frame after frame rather
 * than the whole field flickering
 */
export function thinningAt(scale: number, queued: number): number {
  const room = Math.min(1, (scale / NEAR) * (scale / NEAR));

  return Math.min(1, (room - queued) / THIN_BAND);
}

/**
 * Where every drop of a fall is this moment, as a thing standing in
 * the world rather than on the glass.
 *
 * A drop is `(u, v, h)` in board widths and its place is a pure
 * function of its own number and the clock, exactly as the flat one
 * is. What it must never be a function of is the board's fit: that
 * swells and shrinks four times a turn, and since a drop's place is
 * `seconds * speed` rather than a step added each frame, a speed that
 * moved with the camera would rewrite the whole history of the fall
 * every frame. Pixels become board widths through the picture's own
 * width, which the yaw cannot touch
 */
function eachWorldDrop(
  width: number,
  height: number,
  camera: SkyCamera,
  fall: Fall,
  clock: number,
  zoom: number,
  visit: (x: number, y: number, tipX: number, tipY: number, scale: number, weight: number) => void,
): void {
  const seconds = clock / 1000;
  const margin = MARGIN * zoom;
  const across = width + margin * 2;
  const down = height + margin;
  const count = Math.round(
    (fall.density * SKY_DENSITY * VOLUME_FILL * across * down) / (zoom * zoom) / 1_000_000,
  );
  const noise = scatterOf(count);

  // How many pixels one board width is worth. Free of the fit, and so
  // free of the yaw
  const perBoard = camera.width / PICTURE_SPAN;
  const radius = VOLUME_SPAN / 2;

  for (let at = 0; at < count; at++) {
    const drop = worldDropAt(fall, at, seconds, perBoard);

    // A square of world turned under the camera puts its corners in
    // frame and takes them out again four times a turn, which reads as
    // the weather thickening and thinning. A disc has no corners
    if ((drop.u - 0.5) * (drop.u - 0.5) + (drop.v - 0.5) * (drop.v - 0.5) > radius * radius) {
      continue;
    }

    const head = projectAir({ u: drop.u, v: drop.v }, drop.h, camera.yaw);

    if (head.scale <= 0.02) {
      continue;
    }

    const weight = thinningAt(head.scale, noise[at * SALTS + 4]);

    if (weight <= 0) {
      continue;
    }

    const x = camera.x + head.x * camera.width;
    const y = camera.y + head.y * camera.height;

    if (x < -margin || x > width + margin || y < -margin || y > height + margin) {
      continue;
    }

    const tail = projectAir({ u: drop.tailU, v: drop.v }, drop.tailH, camera.yaw);

    visit(
      x,
      y,
      camera.x + tail.x * camera.width,
      camera.y + tail.y * camera.height,
      head.scale,
      weight,
    );
  }
}

function paintFall(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  fall: Fall,
  clock: number,
  zoom: number,
  camera?: SkyCamera,
): void {
  const dots = fall.length <= 0;
  const thickness = (dots ? fall.thickness * 2 : fall.thickness) * zoom;

  context.strokeStyle = fall.colour;
  // Round only where the cap *is* the drop. On a line it rounds two
  // ends nobody can resolve at a pixel wide, and a round cap is a
  // circle to work out at each end of every drop in the sky
  context.lineCap = dots ? 'round' : 'butt';

  if (camera == null) {
    context.lineWidth = thickness;
    context.beginPath();
    eachDrop(width, height, fall, clock, zoom, (x, y, tipX, tipY) => {
      context.moveTo(x, y);
      // A hair rather than nothing at all: a subpath of zero length is
      // meant to paint its cap and does, but a hair is the same circle
      // and asks nobody to be sure
      context.lineTo(dots ? x + 0.01 : tipX, dots ? y : tipY);
    });
    context.stroke();
    return;
  }

  /**
   * A drop in the world is drawn at the size of the ground under it,
   * so the pen changes per drop and the whole fall cannot be one path.
   * Both are rounded into steps and the path is broken only when the
   * step changes, which puts the sky back into a few dozen strokes
   * rather than one per drop
   */
  let pen = -1;
  let ink = -1;

  context.beginPath();
  eachWorldDrop(width, height, camera, fall, clock, zoom, (x, y, tipX, tipY, scale, weight) => {
    const wide = Math.round(Math.max(0.4, thickness * scale) * 4) / 4;
    const alpha = Math.round(weight * 8) / 8;

    if (wide !== pen || alpha !== ink) {
      context.stroke();
      context.beginPath();
      context.lineWidth = wide;
      context.globalAlpha = Math.max(0.05, alpha);
      pen = wide;
      ink = alpha;
    }
    context.moveTo(x, y);
    context.lineTo(dots ? x + 0.01 : tipX, dots ? y : tipY);
  });
  context.stroke();
  context.globalAlpha = 1;
}

/**
 * A curtain sky: an aurora, or the shimmer over dead-still air.
 *
 * It is drawn as ribs rather than as one band across the picture,
 * which is the whole difference between an aurora and a green smear.
 * A real curtain is folded, so each rib hangs to its own depth and
 * lights to its own brightness, and the fold walks along the sky.
 */
interface CurtainStop {
  /** How far down the band it sits, 0 to 1 */
  at: number;
  colour: string;
  /** How much of it there is, 0 to 1 */
  alpha: number;
}

interface Curtain {
  /** How many bands hang, each behind the last */
  bands: number;
  /** Where the first hangs, and how far below it the next does */
  top: number;
  gap: number;
  /** How far a band reaches down the picture */
  deep: number;
  /** How fast a fold walks along the sky */
  pace: number;
  /** How many folds there are across it */
  ribs: number;
  /**
   * How uneven the folds are, 0 for a even comb of them and 1 for a
   * sky where some rays are half the brightness of their neighbours
   */
  grain: number;
  /**
   * How much wider a fold is drawn than its share of the picture.
   * Screened over each other they blend; drawn edge to edge they read
   * as the row of rectangles they are
   */
  spread: number;
  /** How much a fold's foot rises and falls, as a share of its depth */
  sway: number;
  /** The light down one band, top to bottom */
  stops: CurtainStop[];
}

/**
 * How tall a curtain's gradient is kept, as a strip one pixel across
 * and stretched over the picture. A gradient is one dimension, and
 * this is that dimension
 */
const CURTAIN_STEPS = 64;

const CURTAINS: Partial<Record<Weather, Curtain>> = {
  /**
   * Green low and violet at the crown, which is the order the real
   * thing burns in: oxygen down where the air is thick, nitrogen above
   * it. The body is brightest near the foot rather than in the middle,
   * so the bottom edge reads as an edge instead of a fade
   */
  [Weather.Aurora]: {
    bands: 3,
    top: 0.02,
    gap: 0.07,
    deep: 0.44,
    pace: 0.5,
    ribs: 40,
    sway: 0.22,
    grain: 0.45,
    spread: 2.6,
    stops: [
      { at: 0, colour: '#b06cff', alpha: 0 },
      { at: 0.16, colour: '#b06cff', alpha: 0.1 },
      { at: 0.4, colour: '#3dff9e', alpha: 0.16 },
      { at: 0.78, colour: '#3dff9e', alpha: 0.3 },
      { at: 1, colour: '#3dff9e', alpha: 0 },
    ],
  },
};

/**
 * Where one rib of one band hangs this frame, and how brightly.
 *
 * Both come off the same travelling wave, so a fold that is deeper is
 * also brighter: that is what a curtain does, and it is what keeps
 * ribs from reading as a row of rectangles
 */
function ribAt(
  curtain: Curtain,
  band: number,
  rib: number,
  seconds: number,
): { foot: number; light: number } {
  const phase = seconds * curtain.pace + rib * 0.36 + band * 1.3;
  const wave = Math.sin(phase);
  // A second wave that does not divide into the first, so the rays
  // come out uneven: an even comb of them reads as a fence
  const grain = Math.sin(rib * 2.399 + band * 1.7) * 0.5 + 0.5;

  return {
    foot: 1 + wave * curtain.sway,
    light:
      (0.45 + 0.55 * (Math.sin(phase * 1.7 + band) * 0.5 + 0.5)) *
      (1 - curtain.grain + curtain.grain * grain),
  };
}

/**
 * A curtain sky, drawn rib by rib. The gradient down a band is a strip
 * one pixel across, stretched over each rib, so the ribs of one band
 * share one picture
 */
function paintCurtain(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  curtain: Curtain,
  clock: number,
): void {
  const seconds = clock / 1000;
  const across = width / curtain.ribs;
  const held = context.globalAlpha;

  context.globalCompositeOperation = 'screen';
  for (let band = 0; band < curtain.bands; band++) {
    const shift = Math.sin(seconds * 0.12 + band) * 0.5 + 0.5;
    const strip = curtainStrip(band, shift, curtain);

    if (strip == null) {
      continue;
    }

    const top = height * (curtain.top + band * curtain.gap);
    const deep = height * curtain.deep;

    for (let rib = 0; rib < curtain.ribs; rib++) {
      const { foot, light } = ribAt(curtain, band, rib, seconds);

      context.globalAlpha = held * light;
      // A hair wider than its share, so two ribs meet rather than
      // leaving a seam of ground between them
      context.drawImage(strip, 0, 0, 1, CURTAIN_STEPS, rib * across, top, across + 1, deep * foot);
    }
  }
  context.globalAlpha = held;
}

/**
 * A shower, drawn head first. Each tail is a run of pieces rather than
 * one line, because what fades along its length is the whole point and
 * a stroke has one colour from end to end
 */
function paintShower(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  shower: Shower,
  clock: number,
  camera?: SkyCamera,
): void {
  const seconds = clock / 1000;
  const zoom = zoomFor(width, height);
  const held = context.globalAlpha;

  context.globalCompositeOperation = 'screen';
  context.lineCap = 'round';
  context.strokeStyle = shower.colour;
  for (let which = 0; which < shower.count; which++) {
    const flying =
      camera == null
        ? meteorAt(shower, which, width, height, seconds)
        : worldMeteorAt(shower, which, seconds, camera);

    if (flying == null) {
      continue;
    }
    for (let piece = 0; piece < shower.pieces; piece++) {
      const near = piece / shower.pieces;
      const far = (piece + 1) / shower.pieces;
      const fade = (1 - near) ** 1.6;

      context.globalAlpha = held * flying.light * fade;
      context.lineWidth = shower.thickness * zoom * (0.35 + 0.65 * (1 - near));
      context.beginPath();
      context.moveTo(
        flying.head.x + (flying.back.x - flying.head.x) * near,
        flying.head.y + (flying.back.y - flying.head.y) * near,
      );
      context.lineTo(
        flying.head.x + (flying.back.x - flying.head.x) * far,
        flying.head.y + (flying.back.y - flying.head.y) * far,
      );
      context.stroke();
    }
  }
  context.globalAlpha = held;
  context.lineWidth = 1;
}

/**
 * The far sky, built as things standing in the world.
 *
 * None of these want depth the way a raindrop does — an aurora has no
 * drops to space out — but all of them want a *place*. Drawn at fixed
 * screen coordinates they follow the player round, which is a worse
 * failure than the rain's: a rainbow is a direction, and one that sits
 * in the same corner whichever way you face tells you nothing.
 *
 * The one constraint the geometry has to respect is that this camera
 * looks **down**. At sixty degrees the horizon sits near the top of
 * the frame and the projection diverges just past it, so there is
 * barely any sky in the picture. Everything here hangs low and close,
 * draped over the board rather than standing behind it.
 */

/**
 * How deep a world point is once the camera has been walked round: 0
 * at the board's far edge and 1 at the near one, and past either end
 * beyond it
 */
function turned(u: number, v: number, yaw: number): number {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);

  return (u - 0.5) * sin + (v - 0.5) * cos + 0.5;
}

/** A world point in the canvas' own pixels */
function airOn(camera: SkyCamera, u: number, v: number, h: number): QuadPoint & { scale: number } {
  const point = projectAir({ u, v }, h, camera.yaw);

  return {
    x: camera.x + point.x * camera.width,
    y: camera.y + point.y * camera.height,
    scale: point.scale,
  };
}

/**
 * The ring a curtain hangs on: a circle **inside** the board's own
 * footprint, hanging above the ground the player walks on.
 *
 * It has to be there and nowhere else. The board's far edge is already
 * at the very top of the picture, so a ring set outside it is off the
 * frame at ground level before any height is added at all — this
 * camera looks down, and the sky it leaves is a band a few dozen
 * pixels deep. Drawn over the board there is room, and the ring's far
 * half runs off the top while its near half hangs where it can be
 * seen, which is what turning the camera walks the player through
 */
const RING = { radius: 0.5, foot: 0.32, head: 1.05, spread: 1.06 };

/** One fold of a curtain, laid out ready for either painter */
interface Fold {
  corners: QuadPoint[];
  light: number;
  band: number;
  scale: number;
}

/**
 * Every fold of a curtain, back to front.
 *
 * The head is held level and the foot sways, which is the way the flat
 * curtain does it: swaying the head instead gives a boiling top edge,
 * because the folds of a band no longer agree about where the band
 * begins
 */
function foldsOf(curtain: Curtain, camera: SkyCamera, clock: number): Fold[] {
  const seconds = clock / 1000;
  const folds: Fold[] = [];
  // The whole circle, so some of it is over the board whichever way
  // the camera is facing
  const step = (Math.PI * 2) / curtain.ribs;

  for (let band = 0; band < curtain.bands; band++) {
    const out = RING.radius + band * RING.radius * curtain.gap;

    for (let rib = 0; rib < curtain.ribs; rib++) {
      const { foot, light } = ribAt(curtain, band, rib, seconds);
      const one = step * rib;
      // A hair wider than its share, so two folds meet rather than
      // leaving a seam of sky between them
      const two = one + step * RING.spread;
      // The head is held level and the foot sways. Swaying the head
      // instead gives a boiling top edge, because the folds of a band
      // stop agreeing about where the band begins
      const low = RING.foot * foot;

      const oneU = 0.5 + Math.cos(one) * out;
      const oneV = 0.5 + Math.sin(one) * out;
      const twoU = 0.5 + Math.cos(two) * out;
      const twoV = 0.5 + Math.sin(two) * out;
      const near = airOn(camera, oneU, oneV, low);

      if (near.scale <= 0.05) {
        continue;
      }
      /**
       * Bright over the far ground and gone by the time it has come
       * round in front. The ring is closed so that something is always
       * over the horizon whichever way the player faces; without this
       * the half of it standing between the player and the board reads
       * as a hoop around the chunk rather than a curtain over it
       */
      const round = turned(oneU, oneV, camera.yaw);
      const facing = Math.min(1, Math.max(0, (0.85 - round) / 0.45));

      if (facing <= 0) {
        continue;
      }
      folds.push({
        corners: [
          airOn(camera, oneU, oneV, RING.head),
          airOn(camera, twoU, twoV, RING.head),
          airOn(camera, twoU, twoV, low),
          near,
        ],
        light: light * facing,
        band,
        scale: near.scale,
      });
    }
  }
  // Behind first, so a near fold is drawn over the far one it hides
  folds.sort((one, other) => one.scale - other.scale);
  return folds;
}

function paintCurtainOver(
  context: CanvasRenderingContext2D,
  curtain: Curtain,
  camera: SkyCamera,
  clock: number,
): void {
  const held = context.globalAlpha;

  context.globalCompositeOperation = 'screen';
  for (const fold of foldsOf(curtain, camera, clock)) {
    /**
     * Built from this fold's own top and bottom rather than once for
     * the whole band. The folds are drawn in depth order and stand at
     * different heights, so a gradient built for one of them and used
     * for the next is a picture that jumps every time the sort shuffles
     */
    const strip = context.createLinearGradient(0, fold.corners[0].y, 0, fold.corners[3].y);

    for (const stop of curtain.stops) {
      strip.addColorStop(
        stop.at,
        `${stop.colour}${Math.round(stop.alpha * 0xff)
          .toString(16)
          .padStart(2, '0')}`,
      );
    }
    context.globalAlpha = held * fold.light;
    context.fillStyle = strip;
    context.beginPath();
    context.moveTo(fold.corners[0].x, fold.corners[0].y);
    for (const corner of fold.corners.slice(1)) {
      context.lineTo(corner.x, corner.y);
    }
    context.closePath();
    context.fill();
  }
  context.globalAlpha = held;
}

function batchCurtainOver(
  batch: QuadBatch,
  curtain: Curtain,
  camera: SkyCamera,
  clock: number,
  strength: number,
): void {
  const seconds = clock / 1000;

  for (const fold of foldsOf(curtain, camera, clock)) {
    const strip = curtainStrip(
      fold.band,
      Math.sin(seconds * 0.12 + fold.band) * 0.5 + 0.5,
      curtain,
    );

    if (strip == null) {
      continue;
    }
    batch.invalidate(strip);
    batch.quad(
      strip,
      { x: 0, y: 0, width: 1, height: CURTAIN_STEPS },
      fold.corners,
      strength * fold.light,
      undefined,
      'smooth',
      'screen',
    );
  }
}

/**
 * A meteor given a bearing: it enters the world somewhere off the far
 * side and crosses the board along a heading, rather than crossing the
 * frame along a screen diagonal. Turn the camera and the shower runs
 * the other way, which is the whole point of it having a direction
 */
const METEOR = { high: 0.95, low: 0.25, out: 2.4 };

function worldMeteorAt(
  shower: Shower,
  which: number,
  seconds: number,
  camera: SkyCamera,
): { head: QuadPoint; back: QuadPoint; light: number } | null {
  const slot = seconds / shower.life + which * 0.61;
  const cycle = Math.floor(slot);
  const through = slot - cycle;
  const seed = which * 977 + cycle;

  // Not every slot flies: a sky where one crosses on a beat is a
  // metronome rather than a shower
  if (seeded(seed + 5) < 0.35) {
    return null;
  }

  // They radiate from one quarter of the sky, so they run parallel
  const bearing = Math.PI * 1.15 + (seeded(seed + 1) - 0.5) * 0.5;
  const from = {
    u: 0.5 + Math.cos(bearing) * -METEOR.out + (seeded(seed + 2) - 0.5) * 2.2,
    v: 0.5 + Math.sin(bearing) * -METEOR.out + (seeded(seed + 3) - 0.5) * 1.4,
  };
  const step = { u: Math.cos(bearing) * METEOR.out * 2, v: Math.sin(bearing) * METEOR.out * 2 };
  const at = (share: number): QuadPoint =>
    airOn(
      camera,
      from.u + step.u * share,
      from.v + step.v * share,
      METEOR.high - (METEOR.high - METEOR.low) * share,
    );
  const behind = Math.min(shower.tail, through);

  return {
    head: at(through),
    back: at(through - behind),
    // Lit as it arrives and gone before it lands, so nothing ends
    // abruptly in the middle of the picture
    light: Math.min(1, through * 14) * Math.min(1, (1 - through) * 3.2),
  };
}

/**
 * One round drop, drawn once and stamped wherever a fall wants one.
 *
 * Big enough that a flake on a large board is still a circle, small
 * enough to cost nothing: it is the only texture the sky uses
 */
const DROP_SIZE = 32;

/** How much of the sheet the circle fills, leaving room for its edge */
const DROP_RADIUS = DROP_SIZE / 2 - 1;

let drop: HTMLCanvasElement | null = null;

function roundDrop(): HTMLCanvasElement | null {
  if (drop != null) {
    return drop;
  }
  const made = document.createElement('canvas');

  made.width = DROP_SIZE;
  made.height = DROP_SIZE;

  const into = made.getContext('2d');

  if (into == null) {
    return null;
  }
  // White, so the drop's own colour is what tints it
  into.fillStyle = '#ffffff';
  into.beginPath();
  into.arc(DROP_SIZE / 2, DROP_SIZE / 2, DROP_RADIUS, 0, Math.PI * 2);
  into.fill();
  drop = made;
  return made;
}

const curtains: (HTMLCanvasElement | null)[] = [];

/**
 * One band's light, repainted where it stands this frame. Its stops
 * drift, so it is drawn again every frame: a strip this size costs a
 * quarter of a kilobyte to hand over
 */
function curtainStrip(band: number, shift: number, curtain: Curtain): HTMLCanvasElement | null {
  const held = curtains[band] ?? document.createElement('canvas');

  held.width = 1;
  held.height = CURTAIN_STEPS;

  const into = held.getContext('2d');

  if (into == null) {
    return null;
  }
  const light = into.createLinearGradient(0, 0, 0, CURTAIN_STEPS);

  for (const stop of curtain.stops) {
    // The middle of the band breathes up and down it, which is what
    // keeps a curtain from being a picture that happens to move
    const at = stop.at <= 0 || stop.at >= 1 ? stop.at : Math.min(0.98, stop.at + shift * 0.08);

    light.addColorStop(
      at,
      `${stop.colour}${Math.round(stop.alpha * 0xff)
        .toString(16)
        .padStart(2, '0')}`,
    );
  }
  into.clearRect(0, 0, 1, CURTAIN_STEPS);
  into.fillStyle = light;
  into.fillRect(0, 0, 1, CURTAIN_STEPS);
  curtains[band] = held;
  return held;
}

/**
 * A sheen: light split across the air, laid over the whole picture.
 *
 * A bow is not geometry here. The real one hangs at infinity and
 * cannot be walked around, and built as an arch over the chunk it
 * read as a hoop standing in the field. What one is to the eye is
 * colour in the air, so it is drawn as colour in the air: bands that
 * walk the picture, bend on the way, and slide as the camera turns.
 *
 * The field is arithmetic per pixel, which is a shader in everything
 * but where it runs. It is worked out into a small canvas and
 * stretched over the board, so it costs the same at any window size
 * and lands in both the 2D pass and the batch.
 */
interface Sheen {
  /** How much of it, at the sky's strongest */
  depth: number;
  /** How many bands lie across the picture */
  across: number;
  /** And how many down it, which is what leans them */
  down: number;
  /** How fast the bands walk, in bands a second */
  pace: number;
  /** How far a band bends on its way down */
  wobble: number;
  /** 0 for the tint alone, 1 for the full spectrum */
  colour: number;
  /** What the colourless part of it is drawn in */
  tint: string;
  /**
   * How many swells of light there are for one band of colour. Under
   * one, so a swell carries the spectrum through it rather than
   * lighting the same hue every time: tied to the colour's own wave
   * the whole picture comes out one hue, which is a smear rather than
   * a bow
   */
  swell: number;
  /** How hard a swell's edge is: 1 is a breath, 3 is a rib */
  edge: number;
  /** How much it fades toward the bottom, where the ground is nearest */
  crown: number;
  mode: WashMode;
}

const SHEENS: Partial<Record<Weather, Sheen>> = {
  /**
   * The spectrum, leaning across the picture the way a bow's own
   * bands do, and slow: a rainbow that shimmers quickly is an oil
   * slick
   */
  [Weather.Rainbow]: {
    depth: 0.36,
    across: 3.2,
    down: 1.6,
    pace: 0.05,
    wobble: 0.2,
    colour: 1,
    tint: '#ffffff',
    swell: 0.42,
    edge: 1.3,
    crown: 0.75,
    mode: 'lift',
  },
  /**
   * The same field with the colour drained. The drops a fogbow stands
   * in are too small to split the light, so it comes out white and
   * broad, with barely a blush left at its edges
   */
  [Weather.Fogbow]: {
    depth: 0.28,
    across: 2.4,
    down: 1.2,
    pace: 0.04,
    wobble: 0.16,
    colour: 0.12,
    tint: '#eef2fa',
    swell: 0.42,
    edge: 1.7,
    crown: 0.9,
    mode: 'lift',
  },
  /**
   * Not a bow: a mirage is layered air, so its bands lie flat and
   * stack, and they bend far more than they walk. What it should look
   * like is the country coming apart in strata, which is what heat
   * over a road does
   */
  [Weather.FataMorgana]: {
    depth: 0.22,
    across: 0.12,
    down: 7,
    pace: 0.09,
    wobble: 0.4,
    colour: 0.08,
    tint: '#f7e9cd',
    swell: 1,
    edge: 2.6,
    crown: 0.5,
    mode: 'veil',
  },
};

/** How fine the field is worked out before it is stretched over the picture */
const SHEEN_WIDE = 96;
const SHEEN_TALL = 64;

/** How far the field slides for a radian of camera, in bands */
const SHEEN_TURN = 0.5;

/** A `#rrggbb` tint as three numbers, so the field can mix with it */
function tintOf(colour: string): [number, number, number] {
  const value = Number.parseInt(colour.slice(1), 16);

  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

let sheenSheet: HTMLCanvasElement | null = null;

/**
 * The field, written a pixel at a time. Colour goes in the pixel and
 * the light goes in its alpha, so the sheet is stretched and blended
 * rather than read back
 */
function sheenField(sheen: Sheen, clock: number, yaw: number): HTMLCanvasElement | null {
  const made = sheenSheet ?? document.createElement('canvas');

  made.width = SHEEN_WIDE;
  made.height = SHEEN_TALL;
  sheenSheet = made;

  const into = made.getContext('2d');

  if (into == null) {
    return null;
  }
  const image = into.createImageData(SHEEN_WIDE, SHEEN_TALL);
  const seconds = clock / 1000;
  const slide = seconds * sheen.pace + yaw * SHEEN_TURN;
  const [tintRed, tintGreen, tintBlue] = tintOf(sheen.tint);
  const turn = Math.PI * 2;
  let at = 0;

  for (let y = 0; y < SHEEN_TALL; y++) {
    const down = y / (SHEEN_TALL - 1);
    const crown = (1 - down) ** sheen.crown;
    // The bend is the row's, not the pixel's: a band curves because
    // its own line moves as it goes down, not because the colour does
    const bend = Math.sin(down * 5.3 + seconds * sheen.pace * 2.1) * sheen.wobble;

    for (let x = 0; x < SHEEN_WIDE; x++) {
      const phase = (x / (SHEEN_WIDE - 1)) * sheen.across + down * sheen.down + slide + bend;
      const light = (0.5 + 0.5 * Math.sin(phase * sheen.swell * turn)) ** sheen.edge * crown;
      // The spectrum as three offset waves, which is a hue wheel with
      // none of the arithmetic of one
      const red = 0.5 + 0.5 * Math.cos(turn * phase);
      const green = 0.5 + 0.5 * Math.cos(turn * (phase - 1 / 3));
      const blue = 0.5 + 0.5 * Math.cos(turn * (phase - 2 / 3));

      image.data[at] = tintRed + (red * 0xff - tintRed) * sheen.colour;
      image.data[at + 1] = tintGreen + (green * 0xff - tintGreen) * sheen.colour;
      image.data[at + 2] = tintBlue + (blue * 0xff - tintBlue) * sheen.colour;
      image.data[at + 3] = light * 0xff;
      at += 4;
    }
  }
  into.putImageData(image, 0, 0);
  return made;
}

function paintSheen(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  sheen: Sheen,
  clock: number,
  yaw: number,
  strength: number,
): void {
  const field = sheenField(sheen, clock, yaw);

  if (field == null) {
    return;
  }
  context.globalCompositeOperation = MODES[sheen.mode];
  context.globalAlpha = sheen.depth * strength;
  context.drawImage(field, 0, 0, width, height);
  context.globalAlpha = strength;
  context.globalCompositeOperation = 'source-over';
}

function batchSheen(
  batch: QuadBatch,
  width: number,
  height: number,
  sheen: Sheen,
  clock: number,
  yaw: number,
  strength: number,
): void {
  const field = sheenField(sheen, clock, yaw);

  if (field == null) {
    return;
  }
  batch.invalidate(field);
  batch.quad(
    field,
    { x: 0, y: 0, width: SHEEN_WIDE, height: SHEEN_TALL },
    [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
    sheen.depth * strength,
    undefined,
    'smooth',
    BLENDS[sheen.mode],
  );
}

/**
 * The aurora, the bows and the mirage, written into a batch. All of
 * them are lifted rather than laid on, the way they are painted
 */
function batchLights(
  batch: QuadBatch,
  width: number,
  height: number,
  weather: Weather,
  clock: number,
  strength: number,
  camera?: SkyCamera,
): void {
  const curtain = CURTAINS[weather];
  const sheen = SHEENS[weather];

  if (curtain != null && camera != null) {
    batchCurtainOver(batch, curtain, camera, clock, strength);
  } else if (curtain != null) {
    const seconds = clock / 1000;
    const across = width / curtain.ribs;

    for (let band = 0; band < curtain.bands; band++) {
      const shift = Math.sin(seconds * 0.12 + band) * 0.5 + 0.5;
      const strip = curtainStrip(band, shift, curtain);

      if (strip == null) {
        continue;
      }
      const top = height * (curtain.top + band * curtain.gap);
      const deep = height * curtain.deep;

      batch.invalidate(strip);
      for (let rib = 0; rib < curtain.ribs; rib++) {
        const { foot, light } = ribAt(curtain, band, rib, seconds);
        const wide = across * curtain.spread;
        const left = rib * across - (wide - across) / 2;
        const bottom = top + deep * foot;

        batch.quad(
          strip,
          { x: 0, y: 0, width: 1, height: CURTAIN_STEPS },
          [
            { x: left, y: top },
            { x: left + wide, y: top },
            { x: left + wide, y: bottom },
            { x: left, y: bottom },
          ],
          strength * light,
          undefined,
          'smooth',
          'screen',
        );
      }
    }
  }
  const shower = SHOWERS[weather];

  if (shower != null) {
    const seconds = clock / 1000;
    const zoom = zoomFor(width, height);

    for (let which = 0; which < shower.count; which++) {
      const flying =
        camera == null
          ? meteorAt(shower, which, width, height, seconds)
          : worldMeteorAt(shower, which, seconds, camera);

      if (flying == null) {
        continue;
      }
      for (let piece = 0; piece < shower.pieces; piece++) {
        const near = piece / shower.pieces;
        const far = (piece + 1) / shower.pieces;
        const along = (share: number): QuadPoint => ({
          x: flying.head.x + (flying.back.x - flying.head.x) * share,
          y: flying.head.y + (flying.back.y - flying.head.y) * share,
        });

        batch.line(
          shower.colour,
          along(near),
          along(far),
          shower.thickness * zoom * (0.35 + 0.65 * (1 - near)),
          strength * flying.light * (1 - near) ** 1.6,
          'screen',
        );
      }
    }
  }
  if (sheen != null) {
    batchSheen(batch, width, height, sheen, clock, camera?.yaw ?? 0, strength);
  }
}

/**
 * The wash a sky lays over the picture, written into a batch. Answers
 * whether it wrote one
 */
export function batchWash(
  batch: QuadBatch,
  width: number,
  height: number,
  weather: Weather,
  clock: number,
  strength = 1,
  lamps: Lamp[] = [],
  camera?: SkyCamera,
): boolean {
  if (weather === Weather.Clear || strength <= 0 || !(width > 0) || !(height > 0)) {
    return false;
  }
  const wash = WASHES[weather];
  const dark = LAMPLIT[weather];

  if (dark != null) {
    const cut = lampMask(width, height, dark, lamps, strength);

    if (cut != null) {
      batch.invalidate(cut);
      batch.quad(
        cut,
        { x: 0, y: 0, width: cut.width, height: cut.height },
        [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
        1,
        undefined,
        'smooth',
        'over',
      );
    }
  }
  if (wash != null) {
    batch.solid(
      wash.colour,
      [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ],
      wash.depth * strength,
      BLENDS[wash.mode],
    );
  }
  const flash = FLASHES[weather];
  const lit = flashAt(weather, clock / 1000);

  if (flash != null && lit > 0) {
    batch.solid(
      flash.colour,
      [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ],
      flash.depth * lit * strength,
      'screen',
    );
  }
  batchLights(batch, width, height, weather, clock, strength, camera);
  return true;
}

/**
 * The fall, written into a batch instead of stroked.
 *
 * Every sky is drawn drop by drop here: a batch does not charge for a
 * stroke the way a tessellated path does, and every drop keeps the
 * pace of its own that two scrolling sheets could only pretend at.
 *
 * Answers whether it drew anything, so a caller knows not to stroke it
 */
export function batchSky(
  batch: QuadBatch,
  width: number,
  height: number,
  weather: Weather,
  clock: number,
  strength = 1,
  camera?: SkyCamera,
): boolean {
  const fall = FALL_TABLE[weather];

  if (fall == null || strength <= 0 || !(width > 0) || !(height > 0)) {
    return false;
  }
  const zoom = zoomFor(width, height);
  const dots = fall.length <= 0;
  const thickness = fall.thickness * zoom;
  const stamp = dots ? roundDrop() : null;

  if (dots && stamp == null) {
    return false;
  }
  // The stroked pass draws a round drop as a cap, whose width is the
  // whole diameter rather than the radius, so the square is that wide
  // too, grown by however much of the sheet the circle left over
  const spread = DROP_SIZE / 2 / DROP_RADIUS;
  const source = { x: 0, y: 0, width: DROP_SIZE, height: DROP_SIZE };

  /** One drop, at whatever size and strength its depth has left it */
  const put = (
    x: number,
    y: number,
    tipX: number,
    tipY: number,
    wide: number,
    alpha: number,
  ): void => {
    if (stamp == null) {
      batch.line(fall.colour, { x, y }, { x: tipX, y: tipY }, wide, alpha);
      return;
    }

    const across = wide * spread;

    batch.quad(
      stamp,
      source,
      [
        { x: x - across, y: y - across },
        { x: x + across, y: y - across },
        { x: x + across, y: y + across },
        { x: x - across, y: y + across },
      ],
      alpha,
      fall.colour,
      'smooth',
    );
  };

  if (camera == null) {
    eachDrop(width, height, fall, clock, zoom, (x, y, tipX, tipY) => {
      put(x, y, tipX, tipY, thickness, strength);
    });
    return true;
  }

  eachWorldDrop(width, height, camera, fall, clock, zoom, (x, y, tipX, tipY, scale, weight) => {
    put(x, y, tipX, tipY, Math.max(0.4, thickness * scale), strength * weight);
  });
  return true;
}

/**
 * Lay the weather over the board.
 *
 * `strength` is how much of it to draw, so a sky can be faded in as a
 * chunk is walked into rather than switched on
 */
export default function paintSky(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  weather: Weather,
  clock: number,
  strength = 1,
  lamps: Lamp[] = [],
  camera?: SkyCamera,
): void {
  // A canvas with no size is a canvas mid-layout — a board hidden
  // behind a dialog measures zero until the dialog is gone — and
  // painting into one is at best nothing drawn
  if (weather === Weather.Clear || strength <= 0 || !(width > 0) || !(height > 0)) {
    return;
  }
  const wash = WASHES[weather];
  const fall = FALL_TABLE[weather];
  const dark = LAMPLIT[weather];

  context.save();
  if (wash != null) {
    context.globalCompositeOperation = MODES[wash.mode];
    context.globalAlpha = wash.depth * strength;
    context.fillStyle = wash.colour;
    context.fillRect(0, 0, width, height);
  }
  if (dark != null) {
    const cut = lampMask(width, height, dark, lamps, strength);

    if (cut != null) {
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.drawImage(cut, 0, 0, width, height);
    }
  }
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = strength;
  const curtain = CURTAINS[weather];
  const sheen = SHEENS[weather];
  const shower = SHOWERS[weather];
  const lit = flashAt(weather, clock / 1000);

  if (curtain != null) {
    if (camera == null) {
      paintCurtain(context, width, height, curtain, clock);
    } else {
      paintCurtainOver(context, curtain, camera, clock);
    }
  }
  if (sheen != null) {
    paintSheen(context, width, height, sheen, clock, camera?.yaw ?? 0, strength);
  }
  if (shower != null) {
    paintShower(context, width, height, shower, clock, camera);
  }
  // Lightning behind the rain rather than over it, which is where it
  // is: what a strike lights is the sky, and the fall is between the
  // player and that
  if (lit > 0) {
    const flash = FLASHES[weather];

    if (flash != null) {
      context.globalCompositeOperation = 'screen';
      context.globalAlpha = flash.depth * lit * strength;
      context.fillStyle = flash.colour;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = strength;
    }
  }
  context.globalCompositeOperation = 'source-over';
  if (fall != null) {
    const zoom = zoomFor(width, height);

    paintFall(context, width, height, fall, clock, zoom, camera);
  }
  context.restore();
}
