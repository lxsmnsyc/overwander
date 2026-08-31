/**
 * The auras a pokemon stands in, painted in code: the dark haze of a
 * shadow, and the soft light of one put right.
 *
 * One painter each for both places a pokemon is drawn: the battle
 * canvas calls them between a unit's ground shadow and its body, and
 * the DOM sprite runs them on a small canvas of its own. Both are
 * measured off the ground shadow's ellipse, so they sit exactly where
 * the shadow sits and grow with the pokemon the way the shadow does.
 *
 * Everything is a pure function of the clock and the seed — no random
 * source — so a battle replay paints the same aura every time.
 */

/** The auras a pokemon can stand in, for whoever picks one. */
export type AuraKind = 'shadow' | 'purified';

/** How long one wisp takes to rise and fade, in milliseconds. */
const PERIOD = 1400;

const WISPS = 6;

/** How high a wisp climbs, as a multiple of the ellipse's width. */
const RISE = 2.6;

/** The pool's reach past the ground shadow it sits over. */
const POOL = 1.6;

const POOL_INK = 'rgba(46, 22, 74, 0.34)';
const WISP_INK = [96, 58, 148] as const;

/**
 * A deterministic scatter in [0, 1): the classic sine-fract hash, which
 * is cheap, seedable and the same on every machine
 */
function drift(seed: number, wisp: number, part: number): number {
  const mixed = Math.sin(seed * 12.9898 + wisp * 78.233 + part * 37.719) * 43758.5453;

  return mixed - Math.floor(mixed);
}

/**
 * Paint the haze at a shadow point: `x`, `y` is the ellipse's centre
 * and `radiusX`/`radiusY` its radii, which is exactly what the ground
 * shadow is drawn from. `elapsed` is whatever clock the caller keeps
 */
export function paintShadowAura(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  elapsed: number,
  seed = 0,
): void {
  if (radiusX <= 0 || radiusY <= 0) {
    return;
  }
  context.save();

  // The pool: a dark stain over the ground shadow, breathing a little
  // so it reads as something alive rather than a tint
  const breath = 1 + 0.08 * Math.sin((elapsed / PERIOD) * 2 * Math.PI + seed);

  context.fillStyle = POOL_INK;
  context.beginPath();
  context.ellipse(x, y, radiusX * POOL * breath, radiusY * POOL * breath, 0, 0, Math.PI * 2);
  context.fill();

  // The wisps: each rises from its own spot on the pool's rim, drifts
  // as it climbs, and fades out near the top. Staggered starts keep
  // the column continuous rather than pulsing
  const [red, green, blue] = WISP_INK;

  for (let wisp = 0; wisp < WISPS; wisp += 1) {
    const phase = (elapsed / PERIOD + drift(seed, wisp, 0)) % 1;
    const angle = drift(seed, wisp, 1) * Math.PI * 2;
    const sway = Math.sin(phase * Math.PI * 2 + wisp) * radiusX * 0.3;
    const wx = x + Math.cos(angle) * radiusX * 0.7 + sway * phase;
    const wy = y + Math.sin(angle) * radiusY * 0.5 - phase * radiusX * RISE;
    // In fast, out slow: a wisp appears at the ground and dies in the
    // air rather than popping in halfway up
    const fade = Math.min(1, phase / 0.15) * (1 - phase) ** 1.5;
    const size = Math.max(0.5, radiusX * 0.34 * (1 - phase * 0.6));

    context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.5 * fade})`;
    context.beginPath();
    context.arc(wx, wy, size, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/** How long one mote takes to rise and go out, in milliseconds. */
const CALM = 2000;

const MOTES = 5;

const GLOW_INK = 'rgba(255, 241, 196, 0.28)';
const MOTE_INK = [255, 234, 158] as const;

/**
 * Paint the light a purified pokemon stands in: the shadow aura's
 * gentler opposite. The same measurements — the ellipse's centre and
 * radii — with a warm glow for the pool and small bright motes
 * drifting up where the haze had smoke
 */
export function paintPurifiedAura(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  elapsed: number,
  seed = 0,
): void {
  if (radiusX <= 0 || radiusY <= 0) {
    return;
  }
  context.save();

  const breath = 1 + 0.06 * Math.sin((elapsed / CALM) * 2 * Math.PI + seed);

  context.fillStyle = GLOW_INK;
  context.beginPath();
  context.ellipse(x, y, radiusX * POOL * breath, radiusY * POOL * breath, 0, 0, Math.PI * 2);
  context.fill();

  const [red, green, blue] = MOTE_INK;

  for (let mote = 0; mote < MOTES; mote += 1) {
    const phase = (elapsed / CALM + drift(seed, mote, 2)) % 1;
    const angle = drift(seed, mote, 3) * Math.PI * 2;
    const sway = Math.sin(phase * Math.PI * 2 + mote) * radiusX * 0.2;
    const mx = x + Math.cos(angle) * radiusX * 0.8 + sway * phase;
    const my = y + Math.sin(angle) * radiusY * 0.5 - phase * radiusX * RISE;
    // A mote twinkles on its way up, where a wisp only thins
    const twinkle = 0.75 + 0.25 * Math.sin(elapsed / 90 + mote * 2.1);
    const fade = Math.min(1, phase / 0.15) * (1 - phase) ** 1.5;
    const size = Math.max(0.4, radiusX * 0.16 * (1 - phase * 0.4));

    context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.7 * fade * twinkle})`;
    context.beginPath();
    context.arc(mx, my, size, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/**
 * How far past the pool an aura reaches, in the pool's own radii. The
 * wisps climb `RISE` and drift and swell on the way, which is what
 * decides how much bigger the picture is than the patch
 */
const AURA_ACROSS = 1.6;
const AURA_UP = RISE + 0.5;
const AURA_DOWN = 1.2;

/** The largest an aura's picture is painted, in either direction */
const AURA_LIMIT = 256;

/** An aura's picture, and where the pokemon stands inside it */
export interface AuraPicture {
  canvas: HTMLCanvasElement;
  originX: number;
  originY: number;
}

const painted = { canvas: null as HTMLCanvasElement | null, key: '' };

/**
 * The picture of one aura at this moment, painted at the size it will
 * be drawn so it is stamped one for one.
 *
 * One picture, repainted: a field draws these one at a time, and a
 * kept copy is wisps out of step with the fight they belong to
 */
export function paintAura(
  kind: 'shadow' | 'purified',
  radiusX: number,
  radiusY: number,
  elapsed: number,
  seed: number,
): AuraPicture | null {
  if (!(radiusX > 0) || !(radiusY > 0)) {
    return null;
  }
  const originX = Math.min(AURA_LIMIT / 2, Math.ceil(radiusX * AURA_ACROSS));
  const originY = Math.min(AURA_LIMIT, Math.ceil(radiusX * AURA_UP));
  const across = originX * 2;
  const down = originY + Math.ceil(radiusY * AURA_DOWN);
  const key = `${kind}:${Math.round(elapsed)}:${Math.round(seed)}:${across}:${down}`;

  if (painted.canvas != null && painted.key === key) {
    return { canvas: painted.canvas, originX, originY };
  }
  const canvas = painted.canvas ?? document.createElement('canvas');

  canvas.width = across;
  canvas.height = down;

  const context = canvas.getContext('2d');

  if (context == null) {
    return null;
  }
  context.clearRect(0, 0, across, down);
  if (kind === 'shadow') {
    paintShadowAura(context, originX, originY, radiusX, radiusY, elapsed, seed);
  } else {
    paintPurifiedAura(context, originX, originY, radiusX, radiusY, elapsed, seed);
  }
  painted.canvas = canvas;
  painted.key = key;
  return { canvas, originX, originY };
}
