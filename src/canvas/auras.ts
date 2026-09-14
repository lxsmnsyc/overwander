/**
 * The auras a pokemon stands in, painted in code: the storm cloud of a
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
export const RISE = 2.8;

/**
 * A deterministic scatter in [0, 1): the classic sine-fract hash, which
 * is cheap, seedable and the same on every machine
 */
export function drift(seed: number, index: number, part: number): number {
  const mixed = Math.sin(seed * 12.9898 + index * 78.233 + part * 37.719) * 43758.5453;

  return mixed - Math.floor(mixed);
}

/** Rises in fast and dies out slow, over a phase from 0 to 1 */
export function lifeOf(phase: number): number {
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

const TAU = Math.PI * 2;

/** How long a puff of storm cloud takes to roll out from the feet and thin away, in milliseconds */
export const SWELL = 2600;

/** How often each plasma arc may strike, in milliseconds */
export const STRIKE = 900;

/** How long the plasma round the feet holds one shape before it crackles into the next */
export const CRACKLE = 70;

export const PUFFS = 18;
export const ARCS = 3;

/** The points round the crackling ring at the feet */
const RING_STEPS = 28;

/** How long an arc stays lit, as a share of its strike */
const ARC_LIT = 0.25;

/**
 * A place round a pokemon, measured off its ground shadow: `angle` round
 * it (0 across the picture, a quarter turn toward the viewer), `out` in
 * radii from its middle and `up` in radii above the ground
 */
export interface StormSpot {
  angle: number;
  out: number;
  up: number;
}

export interface StormPuff extends StormSpot {
  /** Its radius, in the shadow's radii. A puff fades by shrinking, so the cloud stays one solid mass */
  size: number;
}

export interface StormArc {
  path: StormSpot[];
  fork: StormSpot[];
  life: number;
}

/** A shadow aura at one moment, worked out once so the painted aura and the battle scene build the same storm */
export interface Storm {
  /** Far side first, so the near ones cover them */
  puffs: StormPuff[];
  arcs: StormArc[];
  /** The crackling plasma round the feet, closed */
  ring: StormSpot[];
  /** The ring swelling out along the ground */
  wave: { out: number; life: number };
  /** How lit the cloud is from inside by a striking arc, from 0 to 1 */
  flash: number;
}

/** A jagged run from `from` to `to`, loose in the middle and pinned at both ends */
function jagged(
  from: StormSpot,
  to: StormSpot,
  key: number,
  steps: number,
  loose: number,
): StormSpot[] {
  const path: StormSpot[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const along = step / steps;
    const wander = Math.sin(Math.PI * along) * loose;

    path.push({
      angle: from.angle + (to.angle - from.angle) * along,
      out: from.out + (to.out - from.out) * along + (drift(key, step, 13) - 0.5) * wander,
      up: from.up + (to.up - from.up) * along + (drift(key, step, 14) - 0.5) * wander,
    });
  }
  return path;
}

/** The shadow aura's storm at `elapsed` */
export function stormOf(elapsed: number, seed: number): Storm {
  const puffs: StormPuff[] = [];

  for (let index = 0; index < PUFFS; index += 1) {
    const phase = (elapsed / SWELL + drift(seed, index, 1)) % 1;
    const rolled = 1 - (1 - phase) ** 2;
    // Every third climbs beside the body, so the cloud stands up round it rather than only spreading
    const climbs = index % 3 === 0;
    const angle = (index / PUFFS) * TAU + drift(seed, index, 2) * 0.5 + phase * 0.4;
    // Tallest at the sides, where the body does not stand in front
    const side = Math.abs(Math.cos(angle));
    const grown = (0.34 + drift(seed, index, 3) * 0.16) * (0.6 + rolled * 0.8);

    puffs.push({
      angle,
      out: climbs ? 0.9 + rolled * 0.5 : 0.6 + rolled,
      // Resting on the ground at the least, and staying where it is as it shrinks away
      up: grown + rolled * (climbs ? 1 + side * 0.9 : 0.25),
      size: grown * Math.min(1, phase / 0.15, (1 - phase) / 0.3),
    });
  }
  puffs.sort((one, other) => Math.sin(one.angle) - Math.sin(other.angle));

  const arcs: StormArc[] = [];
  let flash = 0;

  for (let slot = 0; slot < ARCS; slot += 1) {
    const clock = elapsed / STRIKE + drift(seed, slot, 10) * 3;
    const strike = Math.floor(clock);
    const into = (clock - strike) / ARC_LIT;
    const key = seed + strike * 13 + slot * 7;

    // Some strikes are skipped, so the arcs never keep time
    if (into >= 1 || drift(key, slot, 11) < 0.25) {
      continue;
    }
    // Stutters as it dies, the way a spark does
    const life = (1 - into) * (Math.floor(into * 6) % 2 === 0 ? 1 : 0.55);
    // Off to one side, where the body does not hide it
    const angle = (drift(key, 0, 12) < 0.5 ? 0 : Math.PI) + (drift(key, 1, 12) - 0.5) * 1.2;
    const from = { angle, out: 1 + drift(key, 2, 12) * 0.4, up: 0.2 + drift(key, 3, 12) * 0.3 };
    const to = {
      angle: angle + (drift(key, 4, 12) - 0.5) * 0.8,
      out: 1.2 + drift(key, 5, 12) * 0.5,
      up: 1.2 + drift(key, 6, 12),
    };
    const path = jagged(from, to, key, 7, 0.45);
    const split = path[2 + Math.floor(drift(key, 7, 12) * 3)];
    const tip = {
      angle: split.angle,
      out: split.out + 0.35,
      up: split.up + (drift(key, 8, 12) - 0.3) * 0.6,
    };

    arcs.push({ path, fork: jagged(split, tip, key + 1, 3, 0.2), life });
    flash = Math.max(flash, life);
  }

  const ring: StormSpot[] = [];
  const tick = Math.floor(elapsed / CRACKLE);

  for (let step = 0; step <= RING_STEPS; step += 1) {
    // The last point is the first again, so the ring closes
    const at = step % RING_STEPS;

    ring.push({
      angle: (at / RING_STEPS) * TAU,
      out: 1.08 + (drift(seed + tick, at, 15) - 0.5) * 0.22,
      up: 0,
    });
  }
  const swell = (elapsed / SWELL + seed * 0.29) % 1;

  return {
    puffs,
    arcs,
    ring,
    wave: { out: 0.9 + swell * 1.1, life: Math.min(1, swell / 0.1) * (1 - swell) ** 2 },
    flash,
  };
}

/**
 * Paint the storm at a shadow point: `x`, `y` is the ellipse's centre
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
  const storm = stormOf(elapsed, seed);
  const place = (spot: StormSpot): [number, number] => [
    x + Math.cos(spot.angle) * radiusX * spot.out,
    y + Math.sin(spot.angle) * radiusY * spot.out - spot.up * radiusX,
  ];
  const trace = (path: StormSpot[]): void => {
    context.beginPath();
    for (const spot of path) {
      const [px, py] = place(spot);

      context.lineTo(px, py);
    }
  };

  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';

  // The pool: a black-violet stain the storm gathers in
  context.save();
  context.translate(x, y);
  context.scale(1, radiusY / radiusX);
  glow(context, 0, 0, radiusX * 1.5, 'rgba(18, 4, 34, 0.7)', 'rgba(18, 4, 34, 0)');
  context.restore();

  // Every line is drawn dark for a light page, then violet over it for a dark one
  const { wave } = storm;

  context.beginPath();
  context.ellipse(x, y, radiusX * wave.out, radiusY * wave.out, 0, 0, TAU);
  context.lineWidth = Math.max(1, radiusY * 0.28);
  context.strokeStyle = `rgba(30, 8, 52, ${0.5 * wave.life})`;
  context.stroke();
  context.lineWidth = Math.max(0.75, radiusY * 0.12);
  context.strokeStyle = `rgba(190, 96, 255, ${0.6 * wave.life})`;
  context.stroke();

  trace(storm.ring);
  context.lineWidth = Math.max(1, radiusY * 0.3);
  context.strokeStyle = 'rgba(30, 8, 52, 0.5)';
  context.stroke();
  context.lineWidth = Math.max(0.75, radiusY * 0.12);
  context.strokeStyle = `rgba(200, 120, 255, ${0.5 + 0.4 * storm.flash})`;
  context.stroke();

  // The cloud as one shape, so overlapping puffs never darken each other: a
  // violet mass, then a dark one a little lower, leaving the tops lit
  const cloud = (drop: number, shrink: number): void => {
    context.beginPath();
    for (const puff of storm.puffs) {
      const [px, py] = place(puff);
      const size = puff.size * radiusX;

      context.moveTo(px + size * shrink, py + size * drop);
      context.arc(px, py + size * drop, size * shrink, 0, TAU);
    }
  };
  const flash = storm.flash;

  cloud(0, 1);
  context.fillStyle = `rgba(${92 + 108 * flash}, ${46 + 104 * flash}, ${150 + 105 * flash}, 0.9)`;
  context.fill();
  cloud(0.22, 0.92);
  context.fillStyle = 'rgba(26, 8, 46, 0.94)';
  context.fill();

  for (const arc of storm.arcs) {
    const [mx, my] = place(arc.path[Math.floor(arc.path.length / 2)]);

    glow(
      context,
      mx,
      my,
      radiusX * 0.8,
      `rgba(180, 110, 255, ${0.3 * arc.life})`,
      'rgba(180, 110, 255, 0)',
    );
    for (const path of [arc.path, arc.fork]) {
      const thin = path === arc.fork ? 0.6 : 1;

      trace(path);
      context.lineWidth = Math.max(2, radiusX * 0.24 * thin);
      context.strokeStyle = `rgba(170, 80, 255, ${0.45 * arc.life})`;
      context.stroke();
      context.lineWidth = Math.max(1, radiusX * 0.08 * thin);
      context.strokeStyle = `rgba(245, 225, 255, ${arc.life})`;
      context.stroke();
    }
  }
  context.restore();
}

/** How long the light takes to go once round the purified ring, in milliseconds */
export const ORBIT = 2600;

/** How long a pillar of light takes to breathe in and out */
export const BREATH = 2200;

/** How long a star takes to rise and go out */
export const STAR_RISE = 2400;

export const PILLARS = 6;
export const STARS = 9;

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
const AURA_ACROSS = 2.4;
const AURA_UP = RISE + 0.7;
const AURA_DOWN = 2.2;

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
