/**
 * The auras a pokemon stands in, painted in code: the dark flame of a
 * shadow, and the light of one put right.
 *
 * One painter each for both places a pokemon is drawn: the battle
 * canvas calls them between a unit's ground shadow and its body, and
 * the DOM sprite runs them on a small canvas of its own. Both are
 * measured off the ground shadow's ellipse, so they sit exactly where
 * the shadow sits and grow with the pokemon the way the shadow does.
 *
 * Every part is drawn twice over, a dark body and a bright edge, so an
 * aura reads on a light page and a dark one alike.
 *
 * Everything is a pure function of the clock and the seed, with no
 * random source, so a battle replay paints the same aura every time.
 */

/** The auras a pokemon can stand in, for whoever picks one. */
export type AuraKind = 'shadow' | 'purified';

/** How high the tallest part of an aura climbs, as a multiple of the ellipse's width. */
const RISE = 2.8;

/**
 * A deterministic scatter in [0, 1): the classic sine-fract hash, which
 * is cheap, seedable and the same on every machine
 */
function drift(seed: number, index: number, part: number): number {
  const mixed = Math.sin(seed * 12.9898 + index * 78.233 + part * 37.719) * 43758.5453;

  return mixed - Math.floor(mixed);
}

/** Rises in fast and dies out slow, over a phase from 0 to 1 */
function lifeOf(phase: number): number {
  return Math.min(1, phase / 0.15) * (1 - phase) ** 1.5;
}

/** A soft round glow, since a canvas blur costs more than the whole aura */
function glow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  inner: string,
  outer: string,
): void {
  const fill = context.createRadialGradient(x, y, 0, x, y, radius);

  fill.addColorStop(0, inner);
  fill.addColorStop(1, outer);
  context.fillStyle = fill;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

/** How long a shadow flame takes to flicker through, in milliseconds */
const FLICKER = 900;

/** How long an ember takes to rise and go out */
const EMBER_RISE = 1600;

const FLAMES = 12;
const EMBERS = 10;

/**
 * One tongue of flame standing on the ground at `x`, `y`: a teardrop
 * leaning with `lean`, its tip `tall` above its base
 */
function traceTongue(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  wide: number,
  tall: number,
  lean: number,
): void {
  const tipX = x + lean;
  const tipY = y - tall;

  context.beginPath();
  context.moveTo(x - wide, y);
  context.bezierCurveTo(
    x - wide * 1.1,
    y - tall * 0.45,
    tipX - wide * 0.35,
    tipY + tall * 0.3,
    tipX,
    tipY,
  );
  context.bezierCurveTo(
    tipX + wide * 0.35,
    tipY + tall * 0.3,
    x + wide * 1.1,
    y - tall * 0.45,
    x + wide,
    y,
  );
  context.quadraticCurveTo(x, y + wide * 0.5, x - wide, y);
  context.closePath();
}

/**
 * Paint the dark flame at a shadow point: `x`, `y` is the ellipse's
 * centre and `radiusX`/`radiusY` its radii, which is exactly what the
 * ground shadow is drawn from. `elapsed` is whatever clock the caller keeps
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

  const beat = Math.sin((elapsed / FLICKER) * Math.PI * 2 * 0.5 + seed);

  // The pool: a black-violet stain the flames stand in
  context.save();
  context.translate(x, y);
  context.scale(1, radiusY / radiusX);
  glow(context, 0, 0, radiusX * 1.5, 'rgba(18, 4, 34, 0.7)', 'rgba(18, 4, 34, 0)');
  context.restore();

  // The rim: a dark ring for a light page, and a violet burn over it
  // for a dark one
  const ring = { x: radiusX * 1.12, y: radiusY * 1.12 };

  context.lineWidth = Math.max(1, radiusY * 0.34);
  context.strokeStyle = 'rgba(30, 8, 52, 0.55)';
  context.beginPath();
  context.ellipse(x, y, ring.x, ring.y, 0, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = Math.max(0.75, radiusY * 0.16);
  context.strokeStyle = `rgba(190, 96, 255, ${0.55 + 0.25 * beat})`;
  context.beginPath();
  context.ellipse(x, y, ring.x, ring.y, 0, 0, Math.PI * 2);
  context.stroke();

  // The flames, far side first so the near ones stand in front of them
  const tongues: { angle: number; index: number }[] = [];

  for (let index = 0; index < FLAMES; index += 1) {
    tongues.push({
      angle: (index / FLAMES) * Math.PI * 2 + drift(seed, index, 4) * 0.5,
      index,
    });
  }
  tongues.sort((one, other) => Math.sin(one.angle) - Math.sin(other.angle));

  for (const { angle, index } of tongues) {
    const out = 0.8 + drift(seed, index, 3) * 0.35;
    const baseX = x + Math.cos(angle) * ring.x * out;
    const baseY = y + Math.sin(angle) * ring.y * out;
    const time = elapsed / FLICKER + drift(seed, index, 5) * 10;
    // Two sines out of step, so no two flames flicker alike
    const flicker = 0.7 + 0.2 * Math.sin(time * 2.3) + 0.1 * Math.sin(time * 5.1 + index);
    // Tallest at the sides, where the body does not stand in front of them
    const side = Math.abs(Math.cos(angle));
    const tall = radiusX * (1.3 + side * 1.1 + drift(seed, index, 6) * 0.5) * flicker;
    const wide = radiusX * (0.24 + drift(seed, index, 7) * 0.1);
    const lean = Math.sin(time * 1.7 + index) * radiusX * 0.28;

    traceTongue(context, baseX, baseY, wide * 1.35, tall * 1.08, lean);
    context.fillStyle = 'rgba(26, 6, 46, 0.62)';
    context.fill();
    context.lineWidth = Math.max(0.5, radiusX * 0.05);
    context.strokeStyle = 'rgba(200, 120, 255, 0.45)';
    context.stroke();

    const core = context.createLinearGradient(baseX, baseY, baseX + lean, baseY - tall);

    core.addColorStop(0, 'rgba(120, 40, 200, 0.9)');
    core.addColorStop(0.55, 'rgba(206, 110, 255, 0.75)');
    core.addColorStop(1, 'rgba(255, 180, 255, 0)');
    traceTongue(context, baseX, baseY, wide * 0.7, tall * 0.85, lean * 0.9);
    context.fillStyle = core;
    context.fill();
  }

  // The embers: sparks thrown up out of the flame, each a dark speck
  // with a violet light in it
  for (let index = 0; index < EMBERS; index += 1) {
    const phase = (elapsed / EMBER_RISE + drift(seed, index, 8)) % 1;
    const angle = drift(seed, index, 9) * Math.PI * 2;
    const sway = Math.sin(phase * Math.PI * 3 + index) * radiusX * 0.25;
    const ex = x + Math.cos(angle) * radiusX * 1.25 + sway;
    const ey = y + Math.sin(angle) * radiusY * 0.6 - phase * radiusX * RISE;
    const life = lifeOf(phase);
    const size = Math.max(0.8, radiusX * 0.13 * (1 - phase * 0.5));

    context.fillStyle = `rgba(22, 4, 40, ${0.6 * life})`;
    context.beginPath();
    context.arc(ex, ey, size * 1.9, 0, Math.PI * 2);
    context.fill();
    glow(context, ex, ey, size * 1.6, `rgba(236, 190, 255, ${life})`, 'rgba(170, 80, 255, 0)');
  }
  context.restore();
}

/** How long the light takes to go once round the purified ring, in milliseconds */
const ORBIT = 2600;

/** How long a pillar of light takes to breathe in and out */
const BREATH = 2200;

/** How long a star takes to rise and go out */
const STAR_RISE = 2400;

const PILLARS = 6;
const STARS = 9;

/** A four-pointed star at `x`, `y`, `size` from its centre to a point */
function traceStar(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const waist = size * 0.22;

  context.beginPath();
  context.moveTo(x, y - size);
  context.quadraticCurveTo(x + waist, y - waist, x + size, y);
  context.quadraticCurveTo(x + waist, y + waist, x, y + size);
  context.quadraticCurveTo(x - waist, y + waist, x - size, y);
  context.quadraticCurveTo(x - waist, y - waist, x, y - size);
  context.closePath();
}

/**
 * Paint the light a purified pokemon stands in: the shadow aura's
 * gentler opposite, measured the same way. A golden ring with a light
 * going round it, pillars of light rising out of it and stars
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

  // The pool: warm light on the ground under it
  context.save();
  context.translate(x, y);
  context.scale(1, radiusY / radiusX);
  glow(context, 0, 0, radiusX * 1.5, 'rgba(255, 236, 170, 0.55)', 'rgba(255, 236, 170, 0)');
  context.restore();

  // The pillars, standing in the pool and breathing out of step
  for (let index = 0; index < PILLARS; index += 1) {
    const across = ((index + 0.5) / PILLARS - 0.5) * 2;
    const breath = 0.5 + 0.5 * Math.sin((elapsed / BREATH) * Math.PI * 2 + index * 1.9 + seed);
    const baseX = x + across * radiusX * 1.2;
    const baseY = y + Math.sin(index * 2.4) * radiusY * 0.4;
    // Tallest at the sides, where the body does not stand in front of them
    const tall = radiusX * (1.7 + 1.0 * Math.abs(across)) * (0.8 + 0.2 * breath);
    const wide = radiusX * (0.14 + 0.06 * breath);
    const beam = context.createLinearGradient(baseX, baseY, baseX, baseY - tall);

    beam.addColorStop(0, `rgba(255, 226, 130, ${0.45 + 0.35 * breath})`);
    beam.addColorStop(0.6, `rgba(255, 244, 200, ${0.2 + 0.2 * breath})`);
    beam.addColorStop(1, 'rgba(255, 244, 200, 0)');
    context.beginPath();
    context.moveTo(baseX - wide, baseY);
    context.lineTo(baseX - wide * 0.3, baseY - tall);
    context.lineTo(baseX + wide * 0.3, baseY - tall);
    context.lineTo(baseX + wide, baseY);
    context.closePath();
    context.fillStyle = beam;
    context.fill();

    // An amber edge fading up the beam, so a light page still sees it
    const edge = context.createLinearGradient(baseX, baseY, baseX, baseY - tall);

    edge.addColorStop(0, `rgba(190, 124, 24, ${0.45 + 0.2 * breath})`);
    edge.addColorStop(1, 'rgba(190, 124, 24, 0)');
    context.lineWidth = Math.max(0.5, radiusX * 0.035);
    context.strokeStyle = edge;
    context.stroke();
  }

  // The ring: an amber line a light page can see, gold over it, and a
  // brighter light travelling round
  const ring = { x: radiusX * 1.15, y: radiusY * 1.15 };

  context.lineWidth = Math.max(1, radiusY * 0.26);
  context.strokeStyle = 'rgba(176, 112, 20, 0.55)';
  context.beginPath();
  context.ellipse(x, y, ring.x, ring.y, 0, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = Math.max(0.75, radiusY * 0.13);
  context.strokeStyle = 'rgba(255, 214, 110, 0.9)';
  context.beginPath();
  context.ellipse(x, y, ring.x, ring.y, 0, 0, Math.PI * 2);
  context.stroke();

  const orbit = (elapsed / ORBIT + seed * 0.37) * Math.PI * 2;

  context.lineWidth = Math.max(1, radiusY * 0.2);
  context.lineCap = 'round';
  context.strokeStyle = 'rgba(255, 252, 232, 0.95)';
  context.beginPath();
  context.ellipse(x, y, ring.x, ring.y, 0, orbit, orbit + 0.9);
  context.stroke();
  context.beginPath();
  context.ellipse(x, y, ring.x, ring.y, 0, orbit + Math.PI, orbit + Math.PI + 0.9);
  context.stroke();

  // The stars: rising, turning a little and twinkling on the way up
  for (let index = 0; index < STARS; index += 1) {
    const phase = (elapsed / STAR_RISE + drift(seed, index, 2)) % 1;
    const angle = drift(seed, index, 3) * Math.PI * 2;
    const sway = Math.sin(phase * Math.PI * 2 + index) * radiusX * 0.2;
    const sx = x + Math.cos(angle) * radiusX * 1.3 + sway;
    const sy = y + Math.sin(angle) * radiusY * 0.5 - phase * radiusX * RISE;
    const twinkle = 0.65 + 0.35 * Math.sin(elapsed / 110 + index * 2.1);
    const life = lifeOf(phase) * twinkle;
    const size = Math.max(1, radiusX * (0.26 + drift(seed, index, 1) * 0.14) * (1 - phase * 0.3));

    glow(
      context,
      sx,
      sy,
      size * 1.4,
      `rgba(255, 240, 180, ${0.55 * life})`,
      'rgba(255, 240, 180, 0)',
    );
    traceStar(context, sx, sy, size);
    context.lineWidth = Math.max(0.5, size * 0.18);
    context.strokeStyle = `rgba(168, 104, 16, ${0.8 * life})`;
    context.stroke();
    context.fillStyle = `rgba(255, 250, 226, ${life})`;
    context.fill();
  }
  context.restore();
}

/**
 * How far past the pool an aura reaches, in the pool's own radii. The
 * tallest part climbs `RISE` and sways on the way, which is what
 * decides how much bigger the picture is than the patch
 */
const AURA_ACROSS = 2;
const AURA_UP = RISE + 0.7;
const AURA_DOWN = 1.7;

/** The largest an aura's picture is painted, in either direction */
const AURA_LIMIT = 256;

/** An aura's picture, and where the pokemon stands inside it */
export interface AuraPicture {
  canvas: HTMLCanvasElement;
  originX: number;
  originY: number;
}

/**
 * How many auras are kept at once. A field holds a handful, and one
 * that leaves is dropped by the oldest-first sweep below
 */
const AURA_KEPT = 12;

interface Painted {
  canvas: HTMLCanvasElement;
  key: string;
}

/** One picture per aura, held by the kind and seed that name it */
const painted = new Map<string, Painted>();

/**
 * The picture of one aura at this moment, painted at the size it will
 * be drawn so it is stamped one for one.
 *
 * A canvas each, not one shared: the batched pass hands the canvas
 * over as a texture and draws it later, so two auras sharing a canvas
 * would both come out as whichever was painted last
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
  const held = `${kind}:${Math.round(seed)}`;
  const key = `${Math.round(elapsed)}:${across}:${down}`;
  const kept = painted.get(held);

  if (kept?.key === key) {
    return { canvas: kept.canvas, originX, originY };
  }
  const canvas = kept?.canvas ?? document.createElement('canvas');

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
  // Re-inserted so the map orders by last use, which is what the
  // sweep reads
  painted.delete(held);
  painted.set(held, { canvas, key });
  if (painted.size > AURA_KEPT) {
    for (const stale of painted.keys()) {
      painted.delete(stale);
      if (painted.size <= AURA_KEPT) {
        break;
      }
    }
  }
  return { canvas, originX, originY };
}
