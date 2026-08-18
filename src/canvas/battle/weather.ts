import { Weathers } from '../../data/ids/status';
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
  return ((clock / span + noise(1, index)) % 1 + 1) % 1;
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
    const along = ((clock / 600 + noise(5, grain)) % 1 + 1) % 1;

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
