import { Weathers } from '../../data/ids/status';
import type QuadBatch from '../gl/quad-batch';
import type { QuadPoint } from '../gl/quad-batch';
import { fade, noise } from './moves/__paint';

/**
 * The sky, drawn over the whole field.
 *
 * Weather is the one thing in a fight that belongs to nobody. It is
 * set by a move or an ability, it lasts, and it quietly changes what
 * every move afterwards does — and until now the field said nothing
 * about it at all, so a Solar Beam that fired in one step and a
 * Thunder that stopped missing were both unexplained.
 *
 * It is drawn from the battle's own clock rather than the wall's, so a
 * fight that is paused has still weather, and a replay has the same
 * rain in the same places. Nothing here is a particle system: each
 * drop is a position worked out from its index and the time, which
 * costs nothing to keep and cannot drift
 */

/** How many of whatever is falling. */
const DROPS = 90;

/** How long one drop takes to cross the field, in milliseconds. */
const FALL = 900;

export interface Sky {
  width: number;
  height: number;
}

/**
 * Where the drop with this index is at this moment, as a share of its
 * fall from 0 to 1. They are spread across the whole of it, so the
 * field is never momentarily empty
 */
function falling(index: number, clock: number, span: number): number {
  return (((clock / span + noise(1, index)) % 1) + 1) % 1;
}

function rain(context: CanvasRenderingContext2D, sky: Sky, clock: number, heavy: boolean): void {
  const drops = heavy ? DROPS * 1.6 : DROPS;

  context.strokeStyle = fade('#2980ef', heavy ? 0.5 : 0.35);
  context.lineWidth = 1;
  context.beginPath();
  for (let drop = 0; drop < drops; drop += 1) {
    const along = falling(drop, clock, FALL);
    const x = noise(2, drop) * sky.width + along * sky.width * 0.1;
    const y = along * sky.height;

    context.moveTo(x, y);
    context.lineTo(x - sky.width * 0.02, y + sky.height * 0.08);
  }
  context.stroke();
}

function snow(context: CanvasRenderingContext2D, sky: Sky, clock: number, icy: boolean): void {
  context.fillStyle = fade(icy ? '#3dcef3' : '#e6ecf5', 0.65);
  for (let flake = 0; flake < DROPS; flake += 1) {
    const along = falling(flake, clock, FALL * 2.2);
    const drift = Math.sin(clock / 700 + flake) * sky.width * 0.02;
    const size = icy ? 1.6 : 1.2 + noise(3, flake);

    context.beginPath();
    context.ellipse(
      noise(4, flake) * sky.width + drift,
      along * sky.height,
      size,
      size,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}

function sand(context: CanvasRenderingContext2D, sky: Sky, clock: number): void {
  context.fillStyle = fade('#c4a24c', 0.4);
  context.fillRect(0, 0, sky.width, sky.height);
  context.fillStyle = fade('#915121', 0.55);
  for (let grain = 0; grain < DROPS * 2; grain += 1) {
    // Sideways rather than down: what makes a sandstorm read as one is
    // that everything in it is going the same way, fast
    const along = (((clock / 600 + noise(5, grain)) % 1) + 1) % 1;

    context.fillRect(along * sky.width, noise(6, grain) * sky.height, 6, 1);
  }
}

function sun(context: CanvasRenderingContext2D, sky: Sky, clock: number, harsh: boolean): void {
  const pulse = 0.5 + Math.sin(clock / 1400) * 0.5;
  const glow = context.createRadialGradient(
    sky.width * 0.5,
    0,
    0,
    sky.width * 0.5,
    0,
    sky.height * 1.2,
  );

  glow.addColorStop(0, fade('#fac000', (harsh ? 0.3 : 0.18) + pulse * 0.06));
  glow.addColorStop(1, fade('#fac000', 0));
  context.fillStyle = glow;
  context.fillRect(0, 0, sky.width, sky.height);
}

function fog(context: CanvasRenderingContext2D, sky: Sky, clock: number): void {
  for (let band = 0; band < 4; band += 1) {
    const drift = ((clock / 4000 + band * 0.25) % 1) * sky.width;

    context.fillStyle = fade('#9aa0ad', 0.12);
    context.fillRect(drift - sky.width, sky.height * (0.3 + band * 0.15), sky.width * 2, 22);
  }
}

/**
 * Paint whatever is in the sky. Called with the field's own size and
 * the battle's clock; `None` draws nothing at all rather than a clear
 * sky, since a clear sky is what the field already is
 */
export default function paintWeather(
  context: CanvasRenderingContext2D,
  weather: Weathers,
  sky: Sky,
  clock: number,
): void {
  context.save();
  switch (weather) {
    case Weathers.Rain:
      rain(context, sky, clock, false);
      break;
    case Weathers.HeavyRain:
      rain(context, sky, clock, true);
      break;
    case Weathers.Hail:
      snow(context, sky, clock, true);
      break;
    case Weathers.Snow:
      snow(context, sky, clock, false);
      break;
    case Weathers.Sandstorm:
      sand(context, sky, clock);
      break;
    case Weathers.Sunny:
      sun(context, sky, clock, false);
      break;
    case Weathers.ExtremeSunny:
      sun(context, sky, clock, true);
      break;
    case Weathers.Fog:
      fog(context, sky, clock);
      break;
    // A clear sky is what the field already is, and nothing in the
    // game turns the wind on yet
    case Weathers.None:
    case Weathers.StrongWinds:
      break;
  }
  context.restore();
}

/** How large the two baked shapes are kept, in their own pixels */
const STAMP = 64;

const stamps = new Map<'disc' | 'glow', HTMLCanvasElement>();

/**
 * A white shape to be tinted: a filled circle for a flake, and a
 * radial fading to nothing for the sun's glow. Both are drawn once
 */
function stamp(kind: 'disc' | 'glow'): HTMLCanvasElement | null {
  const held = stamps.get(kind);

  if (held != null) {
    return held;
  }
  const made = document.createElement('canvas');

  made.width = STAMP;
  made.height = STAMP;

  const into = made.getContext('2d');

  if (into == null) {
    return null;
  }
  const half = STAMP / 2;

  if (kind === 'disc') {
    into.fillStyle = '#ffffff';
    into.beginPath();
    into.arc(half, half, half - 1, 0, Math.PI * 2);
    into.fill();
  } else {
    const glow = into.createRadialGradient(half, half, 0, half, half, half);

    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(1, '#ffffff00');
    into.fillStyle = glow;
    into.fillRect(0, 0, STAMP, STAMP);
  }
  stamps.set(kind, made);
  return made;
}

/** The four corners of a box, for the batch */
function box(x: number, y: number, across: number, down: number): QuadPoint[] {
  return [
    { x, y },
    { x: x + across, y },
    { x: x + across, y: y + down },
    { x, y: y + down },
  ];
}

/** One tinted stamp, centred on a point */
function blot(
  batch: QuadBatch,
  kind: 'disc' | 'glow',
  x: number,
  y: number,
  radius: number,
  colour: string,
): void {
  const sheet = stamp(kind);

  if (sheet == null) {
    return;
  }
  batch.quad(
    sheet,
    { x: 0, y: 0, width: STAMP, height: STAMP },
    box(x - radius, y - radius, radius * 2, radius * 2),
    1,
    colour,
    'smooth',
  );
}

/**
 * The same sky, written into a batch rather than painted. Answers
 * whether it wrote anything
 */
export function batchWeather(
  batch: QuadBatch,
  weather: Weathers,
  sky: Sky,
  clock: number,
): boolean {
  const heavy = weather === Weathers.HeavyRain;

  if (weather === Weathers.Rain || heavy) {
    const drops = heavy ? DROPS * 1.6 : DROPS;
    const colour = fade('#2980ef', heavy ? 0.5 : 0.35);

    for (let drop = 0; drop < drops; drop += 1) {
      const along = falling(drop, clock, FALL);
      const x = noise(2, drop) * sky.width + along * sky.width * 0.1;
      const y = along * sky.height;

      batch.line(colour, { x, y }, { x: x - sky.width * 0.02, y: y + sky.height * 0.08 }, 1);
    }
    return true;
  }

  const icy = weather === Weathers.Hail;

  if (weather === Weathers.Snow || icy) {
    const colour = fade(icy ? '#3dcef3' : '#e6ecf5', 0.65);

    for (let flake = 0; flake < DROPS; flake += 1) {
      const along = falling(flake, clock, FALL * 2.2);
      const drift = Math.sin(clock / 700 + flake) * sky.width * 0.02;
      const size = icy ? 1.6 : 1.2 + noise(3, flake);

      blot(batch, 'disc', noise(4, flake) * sky.width + drift, along * sky.height, size, colour);
    }
    return true;
  }

  if (weather === Weathers.Sandstorm) {
    batch.solid(fade('#c4a24c', 0.4), box(0, 0, sky.width, sky.height));

    const colour = fade('#915121', 0.55);

    for (let grain = 0; grain < DROPS * 2; grain += 1) {
      const along = (((clock / 600 + noise(5, grain)) % 1) + 1) % 1;

      batch.solid(colour, box(along * sky.width, noise(6, grain) * sky.height, 6, 1));
    }
    return true;
  }

  const harsh = weather === Weathers.ExtremeSunny;

  if (weather === Weathers.Sunny || harsh) {
    const pulse = 0.5 + Math.sin(clock / 1400) * 0.5;
    // The painted glow is a radial from the top middle of the field
    // reaching a little past its bottom, which is the stamp centred on
    // that point at that radius
    const reach = sky.height * 1.2;

    blot(
      batch,
      'glow',
      sky.width * 0.5,
      0,
      reach,
      fade('#fac000', (harsh ? 0.3 : 0.18) + pulse * 0.06),
    );
    return true;
  }

  if (weather === Weathers.Fog) {
    const colour = fade('#9aa0ad', 0.12);

    for (let band = 0; band < 4; band += 1) {
      const drift = ((clock / 4000 + band * 0.25) % 1) * sky.width;

      batch.solid(
        colour,
        box(drift - sky.width, sky.height * (0.3 + band * 0.15), sky.width * 2, 22),
      );
    }
    return true;
  }
  // A clear sky is what the field already is, and nothing in the game
  // turns the wind on yet
  return false;
}
