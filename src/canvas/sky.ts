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
 * How wide a stripe of the world the fall is spread over. Wider than
 * the screen, since a drop blown sideways has to come from somewhere
 * off the edge
 */
const MARGIN = 400;

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

  context.strokeStyle = fall.colour;
  context.fillStyle = fall.colour;
  context.lineWidth = fall.thickness;
  context.lineCap = 'round';
  context.beginPath();

  const noise = scatterOf(count);
  // Lifted out of the loop: both are the same for every drop, and a
  // fall this wide is a hot enough loop to care
  const fallen = seconds * fall.speed;
  const blown = seconds * fall.drift;

  for (let at = 0; at < count; at++) {
    const of = at * SALTS;
    // Its own pace, so the fall reads as many things falling rather
    // than one sheet sliding
    const pace = 0.75 + noise[of + 2] * 0.5;
    const y = ((noise[of] * down + fallen * pace) % down) - MARGIN;
    const x = ((noise[of + 1] * across + blown * pace) % across) - MARGIN + noise[of + 3];

    if (fall.length <= 0) {
      context.moveTo(x + fall.thickness, y);
      context.arc(x, y, fall.thickness, 0, Math.PI * 2);
      continue;
    }
    // Along the way it is actually travelling, so a drop blown
    // sideways leans the way the wind is blowing it
    const lean = fall.drift / fall.speed;

    context.moveTo(x, y);
    context.lineTo(x - fall.length * lean, y - fall.length);
  }
  if (fall.length <= 0) {
    context.fill();
  } else {
    context.stroke();
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

  context.globalCompositeOperation = 'screen';
  context.lineWidth = radius * 0.028;
  for (let band = 0; band < bands.length; band++) {
    context.strokeStyle = `${bands[band]}44`;
    context.beginPath();
    context.arc(
      width * 0.7,
      height * 1.05,
      radius - band * context.lineWidth,
      Math.PI,
      Math.PI * 2,
    );
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
  if (weather === Weather.Clear || strength <= 0) {
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
    paintFall(context, width, height, fall, clock);
  }
  context.restore();
}
