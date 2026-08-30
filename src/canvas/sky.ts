import Weather from '../data/overworld/weather';

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
  [Weather.Aurora]: { colour: '#4dffc3', depth: 0.18, mode: 'lift' },
  [Weather.Rainbow]: { colour: '#ffe9a8', depth: 0.12, mode: 'lift' },
  [Weather.PollenDrift]: { colour: '#e8dd8a', depth: 0.14, mode: 'veil' },
  [Weather.MeteorShower]: { colour: '#3b3f6b', depth: 0.22, mode: 'darken' },
};

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
  [Weather.MeteorShower]: {
    density: 40,
    speed: 900,
    drift: 700,
    length: 44,
    thickness: 1.6,
    colour: '#ffe9c0e0',
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
 * How far past the screen the fall is spread.
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

function paintFall(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  fall: Fall,
  clock: number,
): void {
  const seconds = clock / 1000;
  const across = width + MARGIN * 2;
  const down = height + MARGIN;
  const count = Math.round((fall.density * across * down) / 1_000_000);

  // A round drop is a segment going nowhere under a round cap, which
  // is a circle of the cap's own width — so the cap carries the
  // diameter where an arc carried the radius
  const dots = fall.length <= 0;

  context.strokeStyle = fall.colour;
  context.lineWidth = dots ? fall.thickness * 2 : fall.thickness;
  // Round only where the cap *is* the drop. On a line it rounds two
  // ends nobody can resolve at a pixel wide, and a round cap is a
  // circle to work out at each end of every drop in the sky
  context.lineCap = dots ? 'round' : 'butt';
  context.beginPath();

  const noise = scatterOf(count);
  // Lifted out of the loop: both are the same for every drop, and a
  // fall this wide is a hot enough loop to care
  const fallen = seconds * fall.speed;
  const blown = seconds * fall.drift;
  // Along the way it is actually travelling, so a drop blown sideways
  // leans the way the wind is blowing it
  const lean = fall.drift / fall.speed;

  for (let at = 0; at < count; at++) {
    const of = at * SALTS;
    // Its own pace, so the fall reads as many things falling rather
    // than one sheet sliding
    const pace = 0.75 + noise[of + 2] * 0.5;
    const y = ((noise[of] * down + fallen * pace) % down) - MARGIN;
    const x = ((noise[of + 1] * across + blown * pace) % across) - MARGIN + noise[of + 3];

    if (dots) {
      // A hair rather than nothing at all: a subpath of zero length is
      // meant to paint its cap and does, but a hair is the same circle
      // and asks nobody to be sure
      context.moveTo(x, y);
      context.lineTo(x + 0.01, y);
      continue;
    }
    context.moveTo(x, y);
    context.lineTo(x - fall.length * lean, y - fall.length);
  }
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
): void {
  const cloth = clothOf(context, fall);

  if (cloth == null) {
    // No second canvas to be had, which is a browser that will not
    // give one up rather than a state worth handling: the sky falls
    // back to being drawn a drop at a time
    paintFall(context, width, height, fall, clock);
    return;
  }

  const seconds = clock / 1000;

  for (let layer = 0; layer < LAYERS; layer++) {
    const pace = PACES[layer];

    // The cloth is moved rather than the screen, so the fill stays put
    // and nothing has to be saved and restored around it
    cloth[layer].setTransform(
      new DOMMatrix().translate(
        (seconds * fall.drift * pace) % TILE,
        (seconds * fall.speed * pace) % TILE,
      ),
    );
    context.fillStyle = cloth[layer];
    context.fillRect(0, 0, width, height);
  }
}

/**
 * The bands of an aurora, which is the one sky that is a picture rather
 * than a wash: three slow curtains, each drifting at its own pace
 */
function paintAurora(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  clock: number,
): void {
  const seconds = clock / 1000;

  context.globalCompositeOperation = 'screen';
  for (let band = 0; band < 3; band++) {
    const shift = Math.sin(seconds * 0.12 + band) * 0.5 + 0.5;
    const top = height * (0.02 + band * 0.06);
    const curtain = context.createLinearGradient(0, top, 0, top + height * 0.42);

    curtain.addColorStop(0, band === 1 ? '#7de2ff00' : '#7dffb800');
    curtain.addColorStop(0.35 + shift * 0.1, band === 1 ? '#7de2ff3a' : '#7dffb83a');
    curtain.addColorStop(1, '#7de2ff00');
    context.fillStyle = curtain;
    context.fillRect(0, top, width, height * 0.42);
  }
}

/** The arc of a rainbow, low and to one side, drawn once and still */
function paintRainbow(context: CanvasRenderingContext2D, width: number, height: number): void {
  const bands = ['#ff5d5d', '#ffa94d', '#ffe66d', '#6ee7a0', '#5db8ff', '#9b8cff'];
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
): void {
  // A canvas with no size is a canvas mid-layout — a board hidden
  // behind a dialog measures zero until the dialog is gone — and
  // painting into one is at best nothing drawn
  if (weather === Weather.Clear || strength <= 0 || !(width > 0) || !(height > 0)) {
    return;
  }
  const wash = WASHES[weather];
  const fall = FALLS[weather];

  context.save();
  if (wash != null) {
    context.globalCompositeOperation = MODES[wash.mode];
    context.globalAlpha = wash.depth * strength;
    context.fillStyle = wash.colour;
    context.fillRect(0, 0, width, height);
  }
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = strength;
  if (weather === Weather.Aurora) {
    paintAurora(context, width, height, clock);
  }
  if (weather === Weather.Rainbow) {
    paintRainbow(context, width, height);
  }
  context.globalCompositeOperation = 'source-over';
  if (fall != null) {
    if (fall.tiled === true) {
      paintTiledFall(context, width, height, fall, clock);
    } else {
      paintFall(context, width, height, fall, clock);
    }
  }
  context.restore();
}
