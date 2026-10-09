import type { Point, Stage } from '../../stage';
import {
  beam,
  between,
  bolt,
  bubble,
  burst,
  decay,
  edge,
  fade,
  hoop,
  late,
  lighten,
  mix,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  shards,
  sickle,
  spread,
  star,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing } from './shapes';
import { showing } from './stats';

/**
 * The Max Moves: a red and magenta storm gathers over the target, the
 * type's energy slams down out of it, and each type leaves its own
 * weather behind. Every timing is a share of the whole span
 */

/** The share the Dynamax cloud has gathered by, and the share the blast hits the ground */
export const MAX_FORMS = 0.25;
export const MAX_SLAMS = 0.4;

/** How high over the target the cloud hangs, in sizes */
export const MAX_HEIGHT = 2.2;

/**
 * How much of the move's weight a size is drawn at. A Max Move has no
 * power of its own, so it always weighs as much as a knockout
 */
export const MAX_SIZE = 0.8;

/** Dynamax energy: the red, the magenta round it, and the dark of the cloud */
export const MAX_RED = '#ff2a5a';
export const MAX_MAGENTA = '#ff3cc8';
export const MAX_CLOUD = '#2a0a26';

/** Each type's after-effect, where the type's own colour is not enough */
export const MAX_SUN = '#ffd04a';
export const MAX_RAIN = '#9fd4ff';
export const MAX_HAIL = '#e8faff';
export const MAX_SAND = '#c8a86a';
export const MAX_SPARK = '#fff27a';
export const MAX_LEAF = '#7ee05a';
export const MAX_MIND = '#ff7ab8';
export const MAX_STAR = '#ffd6f6';
export const MAX_WHITE = '#f4f4ff';
export const MAX_DUSK = '#6a7090';
export const MAX_WING = '#d8f06a';
export const MAX_WISP = '#b47cff';
export const MAX_SHROUD = '#3a1a50';
export const MAX_WYRM = '#7c8cff';
export const MAX_VOID = '#120818';
export const MAX_FIST = '#ff9a3a';
export const MAX_STEEL = '#d8e8f4';
export const MAX_OOZE = '#b45ae8';
export const MAX_EARTH = '#a8703a';
export const MAX_WIND = '#d4f0ff';

/** How many rocks Max Rockfall drops, and the share of the fall each starts at */
export const ROCKFALL_DROPS = [0, 0.18, 0.36];

/** How many spikes Max Steelspike raises round the target */
export const STEELSPIKE_SPIKES = 7;

/** How many rings Max Airstream's tornado is stacked from */
export const AIRSTREAM_RINGS = 6;

const TAU = Math.PI * 2;

/** How far the cloud has come down, from 0 as it forms to 1 as it hits */
export function falling(share: number): number {
  return Math.max(0, Math.min(1, (share - MAX_FORMS) / (MAX_SLAMS - MAX_FORMS)));
}

/** How far through the after-effect it is, from 0 as the blast hits */
export function aftermath(share: number): number {
  return Math.max(0, (share - MAX_SLAMS) / (1 - MAX_SLAMS));
}

/** How much of the cloud is showing: gathering, held, and thinning out once the blast is down */
export function clouded(share: number): number {
  return Math.min(1, share / MAX_FORMS) * late(share, 0.62);
}

/** Where a Max Move happens: the target, the ground under it, the cloud over it, and a size */
interface Frame {
  at: Point;
  foot: Point;
  eye: Point;
  size: number;
  scale: number;
}

function frameOf(stage: Stage, weight: number): Frame {
  const at = landing(stage);
  const size = REACH * stage.scale * weight * MAX_SIZE;

  return {
    at,
    // The body's own foot, which the move's weight does not move
    foot: [at[0], at[1] + REACH * stage.scale * 0.9],
    eye: [at[0], at[1] - size * MAX_HEIGHT],
    size,
    scale: stage.scale,
  };
}

/** A soft filled oval, faded at its edge: cloud, mist, a puddle */
function cloud(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  across: number,
  up: number,
  color: string,
  alpha: number,
): void {
  if (!(across > 0) || alpha <= 0) {
    return;
  }
  const glow = context.createRadialGradient(x, y, 0, x, y, across);

  glow.addColorStop(0, fade(color, alpha));
  glow.addColorStop(0.6, fade(color, alpha * 0.8));
  glow.addColorStop(1, fade(color, 0));
  context.beginPath();
  context.ellipse(x, y, across, up, 0, 0, TAU);
  context.fillStyle = glow;
  context.fill();
}

/** A filled triangle from a base of `width` up to a point `height` over it */
function spike(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  width: number,
  height: number,
  lean: number,
  color: string,
  alpha: number,
): void {
  if (!(height > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.moveTo(x - width, y);
  context.lineTo(x + lean, y - height);
  context.lineTo(x + width, y);
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** A lumpy rock, dark with a lighter face up on its left */
function rock(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  turn: number,
  color: string,
  alpha: number,
  seed: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  for (let face = 0; face < 2; face += 1) {
    const shrink = face === 0 ? 1 : 0.6;
    const off = face === 0 ? 0 : -0.2 * radius;

    context.beginPath();
    for (let corner = 0; corner < 8; corner += 1) {
      const angle = turn + (corner / 8) * TAU;
      const out = radius * shrink * (0.76 + noise(seed + face, corner) * 0.28);

      context[corner === 0 ? 'moveTo' : 'lineTo'](
        x + off + Math.cos(angle) * out,
        y + off + Math.sin(angle) * out,
      );
    }
    context.closePath();
    context.fillStyle = fade(face === 0 ? mix(color, '#2a1c12', 0.4) : lighten(color, 0.3), alpha);
    context.fill();
  }
}

/** A flat hexagon lying on the ground round a point */
function hexagon(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  turn: number,
  color: string,
  alpha: number,
  width: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  for (let corner = 0; corner <= 6; corner += 1) {
    const angle = turn + (corner / 6) * TAU;

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius * 0.34,
    );
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.stroke();
}

/**
 * The opening every Max Move shares: a dark storm cloud gathering over
 * the target, lit red from inside, with a magenta ring turning under it
 * and the type's colour at its heart
 */
function gather(
  context: CanvasRenderingContext2D,
  { eye, size, scale }: Frame,
  share: number,
  color: string,
  seed: number,
): void {
  const shown = clouded(share);

  if (shown <= 0) {
    return;
  }
  const form = Math.min(1, share / MAX_FORMS);
  const turn = share * 1.4;

  for (let puff = 0; puff < 6; puff += 1) {
    const angle = (puff / 6) * TAU + turn * 0.4;
    const out = size * 1.6 * form * (0.6 + noise(seed, puff) * 0.4);

    cloud(
      context,
      [eye[0] + Math.cos(angle) * out, eye[1] + Math.sin(angle) * out * 0.3 - size * 0.2],
      size * (1 + noise(seed, puff + 10) * 0.5) * form,
      size * 0.7 * form,
      MAX_CLOUD,
      shown * 0.75,
    );
  }
  orb(context, eye, size * 1.8 * form, { color: MAX_RED, alpha: shown * 0.55 });
  orb(context, eye, size * 0.8 * form, { color, alpha: shown * 0.85 });
  ripple(context, eye, size * 2.6 * form, {
    color: MAX_MAGENTA,
    alpha: shown,
    width: 3.4 * scale,
  });
  ripple(context, [eye[0], eye[1] + size * 0.15], size * 1.9 * form, {
    color: MAX_RED,
    alpha: shown * 0.9,
    width: 2.4 * scale,
  });
  // Red crackle across the cloud, flickering on a coarse clock so it reads as lightning
  const flick = Math.floor(share * 14);

  for (let arc = 0; arc < 2; arc += 1) {
    const from = noise(seed + flick, arc) * TAU;
    const to = from + 1.4 + noise(seed + flick, arc + 5);

    bolt(
      context,
      [eye[0] + Math.cos(from) * size * 2 * form, eye[1] + Math.sin(from) * size * 0.6 * form],
      [eye[0] + Math.cos(to) * size * 2 * form, eye[1] + Math.sin(to) * size * 0.6 * form],
      seed + flick * 7 + arc,
      {
        color: lighten(MAX_RED, 0.5),
        alpha: shown * (flick % 2 === 0 ? 0.9 : 0.35),
        width: 1.6 * scale,
      },
    );
  }
}

/** The type's energy slamming down out of the cloud onto the target */
function column(
  context: CanvasRenderingContext2D,
  { eye, foot, size }: Frame,
  share: number,
  color: string,
): void {
  const drop = falling(share);
  const after = aftermath(share);
  const kept = after <= 0 ? 1 : decay(after * 2.4);

  if (drop <= 0 || kept <= 0) {
    return;
  }
  const reach = drop ** 2;

  beam(context, eye, foot, reach, size * 2.6 * kept, { color: MAX_RED, alpha: kept * 0.45 });
  beam(context, eye, foot, reach, size * 1.5 * kept, { color, alpha: kept });
}

/** The blow landing: a flash, rings going out along the ground in red and the type's colour */
function slam(
  context: CanvasRenderingContext2D,
  { at, foot, size, scale }: Frame,
  share: number,
  color: string,
  seed: number,
): void {
  const hit = Math.min(1, aftermath(share) * 2);

  if (hit <= 0 || hit >= 1) {
    return;
  }
  const light = lighten(color, 0.55);

  orb(context, at, size * (1.4 + hit * 2.2), { color, alpha: decay(hit) * 0.75 });
  orb(context, at, size * (1 + hit), { color: '#ffffff', alpha: decay(Math.min(1, hit * 2)) });
  for (const [wave, tint] of [light, MAX_RED, MAX_MAGENTA].entries()) {
    const held = Math.max(0, Math.min(1, hit * 1.5 - wave * 0.22));

    if (held > 0) {
      ripple(context, foot, size * (1 + held * 4.4), {
        color: tint,
        alpha: decay(held),
        width: 4 * scale,
      });
    }
  }
  burst(context, at, size * (2 + hit * 2), 16, seed, {
    color: light,
    alpha: decay(hit),
    width: 3 * scale,
  });
}

/** The whole shared opening: cloud, column and slam. `falls` is false where the move draws its own descent */
function maxCall(
  context: CanvasRenderingContext2D,
  stage: Stage,
  share: number,
  color: string,
  seed: number,
  weight: number,
  falls = true,
): Frame {
  const frame = frameOf(stage, weight);

  gather(context, frame, share, color, seed);
  if (falls) {
    column(context, frame, share, color);
  }
  slam(context, frame, share, color, seed);
  return frame;
}

/** A fist pointing along `angle`: a palm and four knuckles across its front */
function fist(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  angle: number,
  color: string,
  alpha: number,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = fade(color, alpha);
  context.beginPath();
  context.ellipse(-size * 0.2, 0, size * 0.8, size * 0.64, 0, 0, TAU);
  context.fill();
  context.fillStyle = fade(lighten(color, 0.45), alpha);
  for (let knuckle = 0; knuckle < 4; knuckle += 1) {
    context.beginPath();
    context.ellipse(
      size * 0.52,
      (knuckle - 1.5) * size * 0.34,
      size * 0.22,
      size * 0.17,
      0,
      0,
      TAU,
    );
    context.fill();
  }
  context.restore();
}

/** Chevrons pointing down and sinking round a point: a stat falling */
function sinking(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  share: number,
  color: string,
  alpha: number,
): void {
  for (let row = 0; row < 3; row += 1) {
    for (const side of [-1, 1]) {
      const held = (share * 1.4 + row / 3) % 1;
      const cx = x + side * size * 1.5;
      const cy = y - size * 1.2 + held * size * 2.4;
      const shown = alpha * swell(held);

      edge(context, [cx - size * 0.45, cy - size * 0.3], [cx, cy], size * 0.1, 0, {
        color,
        alpha: shown,
      });
      edge(context, [cx + size * 0.45, cy - size * 0.3], [cx, cy], size * 0.1, 0, {
        color,
        alpha: shown,
      });
    }
  }
}

const maxMoves = {
  // A sun breaks out over the target, rays turning, and flames lick up off the ground
  MaxFlare(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, foot, size, scale } = frame;
    const shown = showing(after, 4, 0.55);
    const sun: Point = [at[0], at[1] - size * (1.4 + after * 0.6)];
    const turn = after * 1.2;

    cloud(context, foot, size * 3, size * 1, paint.color, shown * 0.4);
    orb(context, sun, size * 2.2, { color: MAX_SUN, alpha: shown * 0.5 });
    for (let ray = 0; ray < 12; ray += 1) {
      const angle = turn + (ray / 12) * TAU;
      const long = size * (1.8 + (ray % 2) * 0.6 + swell(after) * 0.6);

      edge(
        context,
        [sun[0] + Math.cos(angle) * size * 0.9, sun[1] + Math.sin(angle) * size * 0.9],
        [sun[0] + Math.cos(angle) * long, sun[1] + Math.sin(angle) * long],
        size * 0.16,
        0,
        { color: MAX_SUN, alpha: shown },
      );
    }
    orb(context, sun, size * 1.1, { color: '#fff4c0', alpha: shown });
    for (let lick = 0; lick < 9; lick += 1) {
      const rise = (after * 1.6 + noise(seed, lick)) % 1;
      const x = foot[0] + spread(seed, lick + 20) * size * 2.2;

      petal(context, [x, foot[1] - rise * size * 2.2], size * 0.5 * decay(rise), 0, {
        color: rise < 0.4 ? MAX_SUN : paint.color,
        alpha: shown * swell(rise),
      });
    }
    motes(context, at, size * 2.4, 10, seed, after, {
      color: MAX_SUN,
      alpha: shown,
      width: 2 * scale,
    });
  },

  // A waterspout comes down, then a downpour lashes the ground round the target
  MaxGeyser(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { eye, foot, size, scale } = frame;
    const shown = showing(after, 5, 0.6);

    cloud(context, foot, size * 3.2, size * 1.1, paint.color, shown * 0.45);
    context.lineCap = 'round';
    context.strokeStyle = fade(MAX_RAIN, shown * 0.85);
    context.lineWidth = 1.8 * scale;
    context.beginPath();
    for (let drop = 0; drop < 22; drop += 1) {
      const fall = (after * 2.4 + noise(seed, drop)) % 1;
      const x = eye[0] + spread(seed, drop + 30) * size * 3.4;
      const y = eye[1] + (foot[1] - eye[1]) * fall;

      context.moveTo(x, y);
      context.lineTo(x - size * 0.15, y + size * 0.6);
    }
    context.stroke();
    context.lineCap = 'butt';
    for (let splash = 0; splash < 6; splash += 1) {
      const held = (after * 2 + noise(seed, splash + 60)) % 1;

      ripple(
        context,
        [
          foot[0] + spread(seed, splash + 70) * size * 2.6,
          foot[1] + spread(seed, splash + 80) * size * 0.5,
        ],
        size * (0.2 + held * 0.6),
        { color: MAX_RAIN, alpha: shown * decay(held), width: 1.6 * scale },
      );
    }
  },

  // Ice shards burst out of a giant snowflake, and hail rattles down round the target
  MaxHailstorm(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, eye, foot, size, scale } = frame;
    const shown = showing(after, 5, 0.55);
    const ice = lighten(paint.color, 0.2);

    for (let arm = 0; arm < 6; arm += 1) {
      const angle = after * 0.8 + (arm / 6) * TAU;
      const tip: Point = [
        at[0] + Math.cos(angle) * size * 2 * shown,
        at[1] + Math.sin(angle) * size * 2 * shown,
      ];

      edge(context, at, tip, size * 0.2, 0, { color: ice, alpha: shown });
      edge(
        context,
        between(at, tip, 0.6),
        [tip[0] + Math.cos(angle + 0.8) * size * 0.5, tip[1] + Math.sin(angle + 0.8) * size * 0.5],
        size * 0.08,
        0,
        { color: ice, alpha: shown },
      );
    }
    shards(context, at, size * 3.4, 12, seed, after, {
      color: ice,
      alpha: decay(after),
      width: 4 * scale,
    });
    for (let stone = 0; stone < 14; stone += 1) {
      const fall = (after * 2 + noise(seed, stone)) % 1;
      const x = eye[0] + spread(seed, stone + 30) * size * 3.4;

      orb(context, [x, eye[1] + (foot[1] - eye[1]) * fall], size * 0.3, {
        color: ice,
        alpha: shown * swell(fall * 0.9 + 0.1),
      });
    }
    cloud(context, foot, size * 3, size, MAX_HAIL, shown * 0.35);
  },

  // Boulders drop out of the cloud one after another, and sand whirls round where they land
  MaxRockfall(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight, false);
    const { at, eye, foot, size, scale } = frame;
    const drop = falling(share);
    const after = aftermath(share);

    for (const [index, starts] of ROCKFALL_DROPS.entries()) {
      // Each rock falls over the cloud's descent and the start of the after-effect
      const fall = Math.max(0, Math.min(1, (drop + after * 0.6 - starts) / 0.6));

      if (fall <= 0 || fall >= 1) {
        continue;
      }
      const x = at[0] + (index - 1) * size * 1.3;
      const spot: Point = [x, eye[1] + (foot[1] - size * 0.6 - eye[1]) * fall ** 2];

      rock(
        context,
        spot,
        size * (1.2 - index * 0.2),
        fall * 3 + index,
        paint.color,
        1,
        seed + index,
      );
    }
    if (after <= 0) {
      return;
    }
    const shown = showing(after, 4, 0.55);

    for (let gust = 0; gust < 4; gust += 1) {
      const start = after * 7 + gust * 1.6;

      sickle(
        context,
        [at[0], at[1] + size * 0.3],
        size * (1.4 + gust * 0.5),
        start,
        start + 1.8,
        size * 0.35,
        {
          color: gust % 2 === 0 ? MAX_SAND : lighten(MAX_SAND, 0.35),
          alpha: shown * 0.7,
        },
      );
    }
    shards(context, foot, size * 3, 10, seed, after, {
      color: paint.color,
      alpha: decay(after),
      width: 5 * scale,
    });
    cloud(context, foot, size * 3.4, size * 1.1, MAX_SAND, shown * 0.45);
  },

  // A giant bolt cracks down, then the ground round the target crawls with arcs
  MaxLightning(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight, false);
    const { eye, foot, size, scale } = frame;
    const drop = falling(share);
    const after = aftermath(share);
    const flick = Math.floor(share * 18);

    if (drop > 0 && after < 0.35) {
      const head = between(eye, foot, drop ** 2);
      const kept = decay(after / 0.35);

      bolt(context, eye, head, seed + flick, {
        color: MAX_RED,
        alpha: kept * 0.6,
        width: 10 * scale,
      });
      bolt(context, eye, head, seed + flick, { color: paint.color, alpha: kept, width: 5 * scale });
      bolt(context, eye, head, seed + flick, { color: '#ffffff', alpha: kept, width: 2 * scale });
    }
    if (after <= 0) {
      return;
    }
    const shown = showing(after, 5, 0.6);
    const bright = shown * (flick % 3 === 2 ? 0.45 : 1);

    cloud(context, foot, size * 3.4, size * 1.1, paint.color, bright * 0.45);
    ripple(context, foot, size * 3.2, { color: MAX_SPARK, alpha: bright * 0.7, width: 2 * scale });
    for (let arc = 0; arc < 5; arc += 1) {
      const from = noise(seed + flick, arc) * TAU;
      const to = from + 0.6 + noise(seed + flick, arc + 9) * 0.8;
      const out = size * 3;

      bolt(
        context,
        [foot[0] + Math.cos(from) * out, foot[1] + Math.sin(from) * out * 0.34],
        [foot[0] + Math.cos(to) * out * 0.5, foot[1] + Math.sin(to) * out * 0.17],
        seed + flick * 5 + arc,
        { color: MAX_SPARK, alpha: bright, width: 2.4 * scale },
      );
    }
  },

  // Grass blades and vines spring up round the target, and leaves are thrown up between them
  MaxOvergrowth(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, foot, size } = frame;
    const shown = showing(after, 4, 0.6);
    const grow = Math.min(1, after * 2.4);

    cloud(context, foot, size * 3.2, size * 1.1, paint.color, shown * 0.5);
    for (let blade = 0; blade < 11; blade += 1) {
      const angle = (blade / 11) * TAU + noise(seed, blade) * 0.3;
      const base: Point = [
        foot[0] + Math.cos(angle) * size * 2.2,
        foot[1] + Math.sin(angle) * size * 0.75,
      ];
      const tall = size * (1.6 + noise(seed, blade + 20) * 1.6) * grow;
      const tip: Point = [base[0] + spread(seed, blade + 40) * size * 0.6, base[1] - tall];

      edge(context, base, tip, size * 0.22, spread(seed, blade + 60) * size * 0.5, {
        color: blade % 3 === 0 ? MAX_LEAF : paint.color,
        alpha: shown,
      });
    }
    for (let leaf = 0; leaf < 8; leaf += 1) {
      const held = (after * 1.4 + noise(seed, leaf + 80)) % 1;
      const angle = noise(seed, leaf + 90) * TAU + after * 3;

      petal(
        context,
        [
          at[0] + Math.cos(angle) * size * 2 * held,
          at[1] - held * size * 2 + Math.sin(angle) * size * 0.6,
        ],
        size * 0.32,
        angle,
        { color: MAX_LEAF, alpha: shown * swell(held) },
      );
    }
  },

  // Pink rings pulse out along the ground and warped hoops turn round the target
  MaxMindstorm(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, foot, size, scale } = frame;
    const shown = showing(after, 4, 0.6);

    cloud(context, foot, size * 3, size, MAX_MIND, shown * 0.35);
    for (let wave = 0; wave < 4; wave += 1) {
      const held = (after * 1.8 + wave / 4) % 1;

      ripple(context, foot, size * (0.6 + held * 4), {
        color: wave % 2 === 0 ? MAX_MIND : paint.color,
        alpha: shown * decay(held),
        width: 3.2 * scale,
      });
    }
    for (let loop = 0; loop < 3; loop += 1) {
      hoop(
        context,
        at,
        size * (1.4 + loop * 0.45),
        Math.abs(Math.sin(after * 6 + loop * 1.1)),
        loop * 1.05 + after * 2,
        { color: lighten(MAX_MIND, 0.3), alpha: shown * 0.85, width: 2.4 * scale },
      );
    }
    orb(context, at, size * 1.2, { color: MAX_MIND, alpha: shown * 0.5 });
    motes(context, at, size * 2.6, 10, seed, after, {
      color: '#ffffff',
      alpha: shown,
      width: 1.8 * scale,
    });
  },

  // Stars rain down round the target through a pink mist
  MaxStarfall(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, eye, foot, size } = frame;
    const shown = showing(after, 4, 0.6);

    cloud(context, foot, size * 3.4, size * 1.2, MAX_STAR, shown * 0.5);
    cloud(context, at, size * 2.4, size * 1.6, paint.color, shown * 0.3);
    for (let fall = 0; fall < 12; fall += 1) {
      const held = (after * 1.6 + noise(seed, fall)) % 1;
      const x = eye[0] + spread(seed, fall + 30) * size * 3;
      const y = eye[1] + (foot[1] - eye[1]) * held;

      edge(context, [x + size * 0.4, y - size * 1.2], [x, y], size * 0.08, 0, {
        color: paint.color,
        alpha: shown * 0.6 * decay(held),
      });
      star(context, [x, y], size * (0.5 + noise(seed, fall + 50) * 0.3), held * 4, {
        color: fall % 3 === 0 ? MAX_STAR : paint.color,
        alpha: shown * swell(held * 0.8 + 0.2),
      });
    }
  },

  // A white star of force bursts on the target, and arrows sink round it as its speed falls
  MaxStrike(context, stage, share, { seed, weight }) {
    const frame = maxCall(context, stage, share, MAX_WHITE, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, size, scale } = frame;
    const shown = showing(after, 5, 0.55);

    // A grey star painted under the white one, so it still shows on snow
    star(context, at, size * (2.6 + after * 1.4), after * 0.6, {
      color: MAX_DUSK,
      alpha: decay(after) * 0.6,
    });
    star(context, at, size * (2.2 + after * 1.4), after * 0.6, {
      color: MAX_WHITE,
      alpha: decay(after) * 0.8,
    });
    star(context, at, size * 1.2, -after, { color: '#ffffff', alpha: decay(after) });
    ring(context, at, size * (1.4 + after * 1.6), {
      color: MAX_RED,
      alpha: decay(after),
      width: 3 * scale,
    });
    sinking(context, at, size, after, MAX_DUSK, shown);
  },

  // Glowing wings flutter round the target and shed scale dust as they go
  MaxFlutterby(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, size, scale } = frame;
    const shown = showing(after, 4, 0.6);

    orb(context, at, size * 2, { color: paint.color, alpha: shown * 0.35 });
    for (let wing = 0; wing < 5; wing += 1) {
      const angle = after * 3 + (wing / 5) * TAU;
      const spot: Point = [
        at[0] + Math.cos(angle) * size * 2,
        at[1] + Math.sin(angle) * size * 0.8 - size * 0.4,
      ];
      const flap = 0.5 + Math.abs(Math.sin(after * 22 + wing)) * 0.5;

      for (const side of [-1, 1]) {
        petal(
          context,
          [spot[0] + side * size * 0.3 * flap, spot[1]],
          size * 0.45,
          side * (0.9 + flap * 0.4),
          {
            color: wing % 2 === 0 ? MAX_WING : paint.color,
            alpha: shown * 0.9,
          },
        );
      }
    }
    motes(context, [at[0], at[1] - size], size * 2.6, 14, seed, 1 - after, {
      color: MAX_WING,
      alpha: shown,
      width: 1.8 * scale,
    });
  },

  // Ghostly wisps spiral up out of a violet shroud, and two eyes open in it
  MaxPhantasm(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, foot, size } = frame;
    const shown = showing(after, 4, 0.6);

    cloud(context, at, size * 2.4, size * 1.8, MAX_SHROUD, shown * 0.5);
    cloud(context, foot, size * 3, size, MAX_WISP, shown * 0.35);
    for (let wisp = 0; wisp < 8; wisp += 1) {
      const rise = (after * 1.2 + noise(seed, wisp)) % 1;
      const angle = (wisp / 8) * TAU + rise * 3;
      const spot: Point = [at[0] + Math.cos(angle) * size * 1.8, foot[1] - rise * size * 3.4];

      petal(context, spot, size * 0.5 * (1 - rise * 0.4), Math.cos(angle) * 0.4, {
        color: wisp % 2 === 0 ? MAX_WISP : lighten(MAX_WISP, 0.4),
        alpha: shown * swell(rise),
      });
    }
    const open = Math.min(1, after * 3) * shown;

    for (const side of [-1, 1]) {
      cloud(
        context,
        [at[0] + side * size * 0.6, at[1] - size * 0.9],
        size * 0.32,
        size * 0.18 * open,
        '#ffe0ff',
        open,
      );
    }
  },

  // A blue-violet dragon wind coils round the target and throws scales off it
  MaxWyrmwind(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, size, scale } = frame;
    const shown = showing(after, 4, 0.6);

    for (let band = 0; band < 5; band += 1) {
      const start = after * 9 + band * 1.3;
      const lift: Point = [at[0], at[1] + size * (0.6 - band * 0.45)];

      sickle(context, lift, size * (2.4 - band * 0.25), start, start + 2.4, size * 0.4, {
        color: band % 2 === 0 ? MAX_WYRM : mix(paint.color, '#c06cff', 0.5),
        alpha: shown * (0.95 - band * 0.1),
      });
    }
    shards(context, at, size * 3.2, 10, seed, after, {
      color: lighten(MAX_WYRM, 0.4),
      alpha: decay(after),
      width: 3.4 * scale,
    });
  },

  // A black sphere swallows the light round the target and dark tendrils reach out of it
  MaxDarkness(context, stage, share, { seed, weight }) {
    const frame = maxCall(context, stage, share, '#6a3a8a', seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, size, scale } = frame;
    const shown = showing(after, 4, 0.6);
    const pull = swell(Math.min(1, after * 1.4));

    for (let tendril = 0; tendril < 7; tendril += 1) {
      const angle = (tendril / 7) * TAU + noise(seed, tendril) * 0.4;
      const out = size * (2 + pull * 1.6);

      edge(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.7],
        size * 0.28,
        spread(seed, tendril + 10) * size,
        {
          color: MAX_VOID,
          alpha: shown * 0.85,
        },
      );
    }
    cloud(context, at, size * (1.6 + pull * 0.8), size * (1.6 + pull * 0.8), MAX_VOID, shown * 0.8);
    ring(context, at, size * (1.5 + pull * 0.7), {
      color: MAX_RED,
      alpha: shown * 0.8,
      width: 2.4 * scale,
    });
    ring(context, at, size * (1.9 + pull * 0.7), {
      color: '#9a5acc',
      alpha: shown * 0.6,
      width: 2 * scale,
    });
    sinking(context, at, size, after, '#9a5acc', shown * 0.8);
  },

  // A giant fist punches down out of the cloud, and the ground cracks round where it lands
  MaxKnuckle(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight, false);
    const { at, eye, foot, size, scale } = frame;
    const drop = falling(share);
    const after = aftermath(share);

    if (drop > 0 && after < 0.25) {
      const spot = between(eye, [at[0], at[1] - size * 0.6], drop ** 2);
      const kept = decay(after / 0.25);

      edge(context, eye, spot, size * 1.2, 0, { color: MAX_FIST, alpha: kept * 0.4 });
      orb(context, spot, size * 2.2, { color: MAX_RED, alpha: kept * 0.5 });
      fist(context, spot, size * 1.4, Math.PI / 2, MAX_FIST, kept);
    }
    if (after <= 0) {
      return;
    }
    const shown = showing(after, 5, 0.55);

    for (let crack = 0; crack < 7; crack += 1) {
      const angle = (crack / 7) * TAU + noise(seed, crack) * 0.4;
      const out = size * 3.4 * Math.min(1, after * 3);

      bolt(
        context,
        foot,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34],
        seed + crack,
        {
          color: '#3a2010',
          alpha: shown,
          width: 3 * scale,
        },
      );
    }
    cloud(context, foot, size * 3.4, size, MAX_FIST, shown * 0.4);
    shards(context, foot, size * 3, 10, seed, after, {
      color: MAX_EARTH,
      alpha: decay(after),
      width: 4 * scale,
    });
  },

  // A crown of giant steel spikes bursts up out of the ground round the target
  MaxSteelspike(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, foot, size } = frame;
    const shown = showing(after, 5, 0.6);
    const rise = Math.min(1, after * 3) ** 0.5;

    for (let index = 0; index < STEELSPIKE_SPIKES; index += 1) {
      const angle = (index / STEELSPIKE_SPIKES) * TAU + 0.3;
      const base: Point = [
        foot[0] + Math.cos(angle) * size * 2.2,
        foot[1] + Math.sin(angle) * size * 0.75,
      ];
      const tall = size * (2.4 + noise(seed, index) * 1.2) * rise;
      const lean = Math.cos(angle) * size * 0.5;

      spike(context, base, size * 0.5, tall, lean, mix(paint.color, MAX_STEEL, 0.5), shown);
      spike(
        context,
        [base[0] - size * 0.12, base[1]],
        size * 0.18,
        tall * 0.9,
        lean,
        '#ffffff',
        shown * 0.7,
      );
    }
    for (let glint = 0; glint < 3; glint += 1) {
      star(
        context,
        [
          at[0] + spread(seed, glint + 40) * size * 2,
          at[1] - size * (1 + noise(seed, glint + 50) * 1.4),
        ],
        size * 0.4,
        after * 3,
        {
          color: '#ffffff',
          alpha: shown * swell((after * 2 + glint / 3) % 1),
        },
      );
    }
  },

  // A toxic pool spreads under the target, bubbling and spattering goo
  MaxOoze(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { at, foot, size, scale } = frame;
    const shown = showing(after, 4, 0.6);
    const pooled = Math.min(1, after * 2.4);

    cloud(context, foot, size * 3.4 * pooled, size * 1.2 * pooled, MAX_OOZE, shown * 0.8);
    for (let pop = 0; pop < 10; pop += 1) {
      const rise = (after * 1.8 + noise(seed, pop)) % 1;
      const spot: Point = [
        foot[0] + spread(seed, pop + 20) * size * 2.6,
        foot[1] + spread(seed, pop + 30) * size * 0.5 - rise * size * 1.8,
      ];

      bubble(context, spot, size * (0.2 + noise(seed, pop + 40) * 0.25) * (0.5 + rise), {
        color: lighten(MAX_OOZE, 0.3),
        alpha: shown * decay(rise),
        width: 1.6 * scale,
      });
    }
    motes(context, at, size * 3, 12, seed, after, {
      color: paint.color,
      alpha: decay(after),
      width: 3.4 * scale,
    });
  },

  // The ground cracks open round the target and heaves up rock and dust
  MaxQuake(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { foot, size, scale } = frame;
    const shown = showing(after, 5, 0.6);
    const shake = Math.sin(after * 60) * size * 0.08 * decay(after);
    const shaken: Point = [foot[0] + shake, foot[1]];

    cloud(context, shaken, size * 3.6, size * 1.2, MAX_EARTH, shown * 0.55);
    for (let crack = 0; crack < 8; crack += 1) {
      const angle = (crack / 8) * TAU + noise(seed, crack) * 0.3;
      const out = size * 4 * Math.min(1, after * 2.6);

      bolt(
        context,
        shaken,
        [shaken[0] + Math.cos(angle) * out, shaken[1] + Math.sin(angle) * out * 0.34],
        seed + crack,
        {
          color: '#2a1408',
          alpha: shown,
          width: 3.4 * scale,
        },
      );
    }
    for (let slab = 0; slab < 5; slab += 1) {
      const angle = noise(seed, slab + 50) * TAU;
      const up = swell(Math.min(1, after * 1.6 - slab * 0.06)) * size * 1.4;

      rock(
        context,
        [shaken[0] + Math.cos(angle) * size * 2.4, shaken[1] + Math.sin(angle) * size * 0.8 - up],
        size * 0.55,
        slab,
        MAX_EARTH,
        shown,
        seed + slab,
      );
    }
  },

  // A tornado winds up round the target, rings of wind stacked and turning
  MaxAirstream(context, stage, share, { paint, seed, weight }) {
    const frame = maxCall(context, stage, share, paint.color, seed, weight);
    const after = aftermath(share);

    if (after <= 0) {
      return;
    }
    const { foot, size, scale } = frame;
    const shown = showing(after, 4, 0.6);
    const rise = Math.min(1, after * 2.4);

    for (let level = 0; level < AIRSTREAM_RINGS; level += 1) {
      const up = level / (AIRSTREAM_RINGS - 1);
      const sway = Math.sin(after * 10 + level * 0.9) * size * 0.4 * up;
      const centre: Point = [foot[0] + sway, foot[1] - up * size * 4.4 * rise];
      const radius = size * (0.8 + up * 2);
      const start = after * 14 + level * 0.8;

      ripple(context, centre, radius, { color: MAX_WIND, alpha: shown * 0.55, width: 2 * scale });
      context.beginPath();
      context.ellipse(centre[0], centre[1], radius, radius * 0.34, 0, start, start + 2.2);
      context.strokeStyle = fade(level % 2 === 0 ? '#ffffff' : paint.color, shown);
      context.lineWidth = 3.4 * scale;
      context.stroke();
    }
    motes(context, foot, size * 3, 10, seed, after, {
      color: '#ffffff',
      alpha: shown,
      width: 1.8 * scale,
    });
  },

  // A giant red dome rises round the caster, ribbed and crowned by a turning hexagon
  MaxGuard(context, stage, share, { seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale * 1.6;
    const foot: Point = [at[0], at[1] + REACH * stage.scale * 0.9];
    const up = Math.min(1, share * 4) ** 0.5;
    const shown = share < 0.78 ? 1 : decay((share - 0.78) / 0.22);
    const wide = size * 1.6;
    const tall = size * 2 * up;
    const pulse = 0.5 + Math.sin(share * 18) * 0.5;

    // The dome's own shell, filled faintly so the caster shows through
    context.beginPath();
    context.ellipse(foot[0], foot[1], wide, tall, 0, Math.PI, TAU);
    context.closePath();
    context.fillStyle = fade(MAX_RED, shown * 0.22);
    context.fill();
    context.strokeStyle = fade(MAX_MAGENTA, shown);
    context.lineWidth = 3.4 * stage.scale;
    context.stroke();
    for (let rib = 1; rib < 4; rib += 1) {
      context.beginPath();
      context.ellipse(
        foot[0],
        foot[1],
        wide * Math.cos((rib / 4) * (Math.PI / 2)) * 0.7,
        tall,
        0,
        Math.PI,
        TAU,
      );
      context.strokeStyle = fade(MAX_RED, shown * 0.7);
      context.lineWidth = 1.6 * stage.scale;
      context.stroke();
    }
    for (let band = 1; band < 3; band += 1) {
      const lat = (band / 3) * (Math.PI / 2);

      ripple(context, [foot[0], foot[1] - Math.sin(lat) * tall], wide * Math.cos(lat), {
        color: lighten(MAX_RED, 0.3),
        alpha: shown * (0.4 + pulse * 0.4),
        width: 1.8 * stage.scale,
      });
    }
    hexagon(context, foot, wide * 1.1, share, MAX_MAGENTA, shown, 3 * stage.scale);
    hexagon(
      context,
      [foot[0], foot[1] - tall],
      size * 0.6,
      -share * 3,
      '#ffffff',
      shown * up,
      2.4 * stage.scale,
    );
    orb(context, [foot[0], foot[1] - tall], size * 0.6, {
      color: MAX_MAGENTA,
      alpha: shown * up * 0.7,
    });
    // A flash running up the shell as it closes
    if (share < 0.4) {
      const run = share / 0.4;

      ripple(context, [foot[0], foot[1] - tall * run], wide * Math.cos(run * (Math.PI / 2)), {
        color: '#ffffff',
        alpha: decay(run),
        width: 3 * stage.scale,
      });
    }
    motes(context, at, size * 2, 10, seed, share, {
      color: MAX_MAGENTA,
      alpha: shown * 0.8,
      width: 2 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default maxMoves;
