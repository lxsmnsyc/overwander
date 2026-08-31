import Weather from '../data/overworld/weather';
import type QuadBatch from './gl/quad-batch';
import type { QuadBlend, QuadPoint } from './gl/quad-batch';

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
  [Weather.DarkDay]: { colour: '#070b16', depth: 0.88 },
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
  /**
   * Whether it is drawn as scrolling tiles rather than drop by drop.
   *
   * Worth it only where there are enough drops to pay for two
   * full-screen fills: see `paintTiledFall`. A sparse sky, or one whose
   * drops are long enough streaks that a repeat would show, keeps its
   * own
   */
  tiled?: boolean;
}

const FALLS: Partial<Record<Weather, Fall>> = {
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
    tiled: true,
  },
  [Weather.Thunderstorm]: {
    density: 3600,
    speed: 1100,
    drift: 260,
    length: 12,
    thickness: 1.2,
    colour: '#ccdcf7bb',
    tiled: true,
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
    tiled: true,
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

/** How many of them one drop needs: where it starts, and how it falls */
const SALTS = 4;

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
  const count = Math.round((fall.density * across * down) / (zoom * zoom) / 1_000_000);
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

function paintFall(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  fall: Fall,
  clock: number,
  zoom: number,
): void {
  const dots = fall.length <= 0;

  context.strokeStyle = fall.colour;
  context.lineWidth = (dots ? fall.thickness * 2 : fall.thickness) * zoom;
  // Round only where the cap *is* the drop. On a line it rounds two
  // ends nobody can resolve at a pixel wide, and a round cap is a
  // circle to work out at each end of every drop in the sky
  context.lineCap = dots ? 'round' : 'butt';
  context.beginPath();
  eachDrop(width, height, fall, clock, zoom, (x, y, tipX, tipY) => {
    context.moveTo(x, y);
    // A hair rather than nothing at all: a subpath of zero length is
    // meant to paint its cap and does, but a hair is the same circle
    // and asks nobody to be sure
    context.lineTo(dots ? x + 0.01 : tipX, dots ? y : tipY);
  });
  context.stroke();
}

/**
 * A heavy fall, drawn as scrolling cloth instead of drop by drop.
 *
 * A drop costs about the same whether anyone can see it or not: what
 * a stroked segment is paid for is being tessellated and antialiased,
 * not the dozen pixels it lands on. A downpour is eleven thousand of
 * them a frame, and the whole sky it draws covers under a tenth of the
 * screen — so the bill is the count, and the count is what this gets
 * rid of.
 *
 * One tile of rain is drawn once and repeated forever by the browser.
 * Each frame moves the pattern and fills the screen, so a downpour and
 * a drizzle cost exactly the same: two fills.
 *
 * What it gives up is that every drop had its own pace. Two layers at
 * two paces is what stands in for it, which is the parallax the effect
 * was reaching for anyway
 */
const LAYERS = 2;

/**
 * How big one tile is. Large enough that the repeat is not read as a
 * grid, small enough to build quickly and stay in cache
 */
const TILE = 512;

/** The two paces, either side of the one pace a single sheet would have */
const PACES = [0.85, 1.15];

/** One built cloth per fall. The falls are module constants, so this is bounded */
const cloths = new Map<Fall, CanvasPattern[]>();

function clothOf(context: CanvasRenderingContext2D, fall: Fall): CanvasPattern[] | null {
  const known = cloths.get(fall);

  if (known != null) {
    return known;
  }

  // Each layer covers the whole screen, so each carries its share of
  // the density rather than all of it
  const per = Math.max(1, Math.round((fall.density / LAYERS) * ((TILE * TILE) / 1_000_000)));
  const noise = scatterOf(per * LAYERS);
  const dots = fall.length <= 0;
  const lean = fall.drift / fall.speed;
  const made: CanvasPattern[] = [];

  for (let layer = 0; layer < LAYERS; layer++) {
    const canvas = document.createElement('canvas');

    canvas.width = TILE;
    canvas.height = TILE;

    const into = canvas.getContext('2d');

    if (into == null) {
      return null;
    }
    into.strokeStyle = fall.colour;
    into.lineWidth = dots ? fall.thickness * 2 : fall.thickness;
    into.lineCap = dots ? 'round' : 'butt';
    into.beginPath();

    for (let at = 0; at < per; at++) {
      const of = (layer * per + at) * SALTS;
      const x = noise[of + 1] * TILE;
      const y = noise[of] * TILE;

      // Nine copies of each, so a drop hanging over an edge is already
      // drawn coming back in at the other one. Without it the seam is
      // a clean line of half-drops across the sky
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const from = x + dx * TILE;
          const down = y + dy * TILE;

          into.moveTo(from, down);
          if (dots) {
            into.lineTo(from + 0.01, down);
          } else {
            into.lineTo(from - fall.length * lean, down - fall.length);
          }
        }
      }
    }
    into.stroke();

    const cloth = context.createPattern(canvas, 'repeat');

    if (cloth == null) {
      return null;
    }
    made.push(cloth);
  }
  cloths.set(fall, made);
  return made;
}

function paintTiledFall(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  fall: Fall,
  clock: number,
  zoom: number,
): void {
  const cloth = clothOf(context, fall);

  if (cloth == null) {
    // No second canvas to be had, which is a browser that will not
    // give one up rather than a state worth handling: the sky falls
    // back to being drawn a drop at a time
    paintFall(context, width, height, fall, clock, zoom);
    return;
  }

  const seconds = clock / 1000;
  // The cloth is woven on the reference screen and stretched to this
  // one, so a larger window gets larger drops rather than a finer
  // weave, and the tile is built once whatever the window is
  const span = TILE * zoom;

  for (let layer = 0; layer < LAYERS; layer++) {
    const pace = PACES[layer];

    // The cloth is moved rather than the screen, so the fill stays put
    // and nothing has to be saved and restored around it
    cloth[layer].setTransform(
      new DOMMatrix()
        .translate(
          (seconds * fall.drift * pace * zoom) % span,
          (seconds * fall.speed * pace * zoom) % span,
        )
        .scale(zoom),
    );
    context.fillStyle = cloth[layer];
    context.fillRect(0, 0, width, height);
  }
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
  /**
   * A mirage is dead-still air, so nothing here folds: the ribs are
   * fine and barely move, and what they do is break the horizon into
   * strata the way heat over a road does
   */
  [Weather.FataMorgana]: {
    bands: 4,
    top: 0.44,
    gap: 0.035,
    deep: 0.08,
    pace: 0.22,
    ribs: 40,
    sway: 0.05,
    grain: 0.12,
    spread: 3.2,
    stops: [
      { at: 0, colour: '#fff3d8', alpha: 0 },
      { at: 0.5, colour: '#fff3d8', alpha: 0.22 },
      { at: 1, colour: '#fff3d8', alpha: 0 },
    ],
  },
};

/** The arc a sky hangs over the water, band by band, outermost first. */
const ARCS: Partial<Record<Weather, string[]>> = {
  [Weather.Rainbow]: ['#ff5d5d', '#ffa94d', '#ffe66d', '#6ee7a0', '#5db8ff', '#9b8cff'],
  /**
   * A fogbow is the same arc with the colour gone: the drops it stands
   * in are too small to split the light, so it comes out white and
   * broad, with barely a blush at either edge
   */
  [Weather.Fogbow]: [
    '#ffd9c9',
    '#f7f2ec',
    '#ffffff',
    '#ffffff',
    '#f2f4fa',
    '#e6ecf8',
    '#dbe6fb',
    '#cfdcf6',
  ],
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
): void {
  const seconds = clock / 1000;
  const zoom = zoomFor(width, height);
  const held = context.globalAlpha;

  context.globalCompositeOperation = 'screen';
  context.lineCap = 'round';
  context.strokeStyle = shower.colour;
  for (let which = 0; which < shower.count; which++) {
    const flying = meteorAt(shower, which, width, height, seconds);

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

/** The arc of a bow, low and to one side, drawn once and still */
function paintArc(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  bands: string[],
): void {
  const radius = Math.max(width, height) * 0.62;
  /**
   * How far in each band sits, kept as a number rather than read back
   * off the context. A width of zero is not a width the context
   * accepts: it keeps whatever it had, and the bands then walk inward
   * past nothing into a negative arc, which throws
   */
  const step = radius * 0.028;

  context.globalCompositeOperation = 'screen';
  context.lineWidth = step;
  for (let band = 0; band < bands.length; band++) {
    context.strokeStyle = `${bands[band]}44`;
    context.beginPath();
    context.arc(width * 0.7, height * 1.05, radius - band * step, Math.PI, Math.PI * 2);
    context.stroke();
  }
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
 * How many straight pieces a rainbow band is drawn in. The arc runs
 * half a turn across most of the picture, and this is where the join
 * between two pieces stops being visible
 */
const RAINBOW_STEPS = 48;

/**
 * The aurora and the rainbow, written into a batch. Both are lifted
 * rather than laid on, the way they are painted
 */
function batchLights(
  batch: QuadBatch,
  width: number,
  height: number,
  weather: Weather,
  clock: number,
  strength: number,
): void {
  const curtain = CURTAINS[weather];
  const arc = ARCS[weather];

  if (curtain != null) {
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
      const flying = meteorAt(shower, which, width, height, seconds);

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
  if (arc == null) {
    return;
  }
  // Straight pieces rather than a stroked arc: the batch has no
  // curves, and half a turn cut this fine is a curve at the width
  // these bands are drawn
  const radius = Math.max(width, height) * 0.62;
  const step = radius * 0.028;
  const middle = { x: width * 0.7, y: height * 1.05 };

  for (let band = 0; band < arc.length; band++) {
    const reach = radius - band * step;
    const along = (piece: number): { x: number; y: number } => {
      const angle = Math.PI + (Math.PI * piece) / RAINBOW_STEPS;

      return { x: middle.x + Math.cos(angle) * reach, y: middle.y + Math.sin(angle) * reach };
    };

    for (let piece = 0; piece < RAINBOW_STEPS; piece++) {
      batch.line(`${arc[band]}44`, along(piece), along(piece + 1), step, strength, 'screen');
    }
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
  batchLights(batch, width, height, weather, clock, strength);
  return true;
}

/**
 * The fall, written into a batch instead of stroked.
 *
 * Every sky is drawn drop by drop here, tiled or not: the tiling was
 * only ever a way of not paying for eleven thousand strokes, and a
 * batch does not charge for them. What it gives back is the pace each
 * drop had of its own, which two scrolling sheets could only pretend at.
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
): boolean {
  const fall = FALLS[weather];

  if (fall == null || strength <= 0 || !(width > 0) || !(height > 0)) {
    return false;
  }
  const zoom = zoomFor(width, height);
  const dots = fall.length <= 0;
  const thickness = fall.thickness * zoom;

  if (!dots) {
    eachDrop(width, height, fall, clock, zoom, (x, y, tipX, tipY) => {
      batch.line(fall.colour, { x, y }, { x: tipX, y: tipY }, thickness, strength);
    });
    return true;
  }

  const stamp = roundDrop();

  if (stamp == null) {
    return false;
  }
  // The stroked pass draws these as a round cap, whose width is the
  // whole diameter rather than the radius, so the square is that wide
  // too, grown by however much of the sheet the circle left over
  const across = thickness * (DROP_SIZE / 2 / DROP_RADIUS);
  const source = { x: 0, y: 0, width: DROP_SIZE, height: DROP_SIZE };

  eachDrop(width, height, fall, clock, zoom, (x, y) => {
    batch.quad(
      stamp,
      source,
      [
        { x: x - across, y: y - across },
        { x: x + across, y: y - across },
        { x: x + across, y: y + across },
        { x: x - across, y: y + across },
      ],
      strength,
      fall.colour,
      'smooth',
    );
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
): void {
  // A canvas with no size is a canvas mid-layout — a board hidden
  // behind a dialog measures zero until the dialog is gone — and
  // painting into one is at best nothing drawn
  if (weather === Weather.Clear || strength <= 0 || !(width > 0) || !(height > 0)) {
    return;
  }
  const wash = WASHES[weather];
  const fall = FALLS[weather];
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
  const arc = ARCS[weather];
  const shower = SHOWERS[weather];
  const lit = flashAt(weather, clock / 1000);

  if (curtain != null) {
    paintCurtain(context, width, height, curtain, clock);
  }
  if (arc != null) {
    paintArc(context, width, height, arc);
  }
  if (shower != null) {
    paintShower(context, width, height, shower, clock);
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

    if (fall.tiled === true) {
      paintTiledFall(context, width, height, fall, clock, zoom);
    } else {
      paintFall(context, width, height, fall, clock, zoom);
    }
  }
  context.restore();
}
