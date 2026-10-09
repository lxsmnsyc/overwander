import type { Point, Stage } from '../../stage';
import {
  bolt,
  edge,
  fade,
  late,
  lighten,
  mix,
  noise,
  orb,
  petal,
  ripple,
  spread,
  swell,
} from '../__paint';
import { DYNAMAX_DARK, DYNAMAX_RED } from './galar';
import { REACH, landing } from './shapes';

/** G-Max Moves: the share of the span the caster spends gathering its Dynamax energy */
export const G_GATHER = 0.25;

/** The Dynamax red every G-Max Move rises in, the magenta it crackles with, and its storm cloud */
export const GMAX_RED = DYNAMAX_RED;
export const GMAX_MAGENTA = '#ff3fd2';
export const GMAX_DARK = DYNAMAX_DARK;
export const GMAX_CLOUD = '#6e1236';

/** How high over the target the Dynamax cloud gathers, in sizes */
export const CLOUD_HEIGHT = 3;

/** How many puffs the cloud is drawn from */
export const CLOUD_PUFFS = 7;

/** How far through the payoff a G-Max Move is, from 0 once its energy is gathered */
export function gigantic(share: number): number {
  return Math.max(0, (share - G_GATHER) / (1 - G_GATHER));
}

/** How far a share is between two marks, clamped to 0 and 1 */
export function stretch(share: number, from: number, to: number): number {
  return Math.max(0, Math.min(1, (share - from) / (to - from)));
}

/** How strongly the caster's own glow shows: up at once, and gone soon after the payoff begins */
export function opening(share: number): number {
  return Math.min(1, share * 8) * (1 - stretch(share, G_GATHER, G_GATHER + 0.12));
}

/** How strongly the cloud over the target shows: in with the gather, gone a little into the payoff */
export function clouded(share: number): number {
  return Math.min(1, share / G_GATHER) * late(share, G_GATHER + 0.15);
}

/** A filled round, for clouds, coins, berries and puddles */
export function blot(
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
  context.beginPath();
  context.ellipse(x, y, across, Math.max(0.1, up), 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** A stroked run of points, for vines, coils and roots */
export function strand(
  context: CanvasRenderingContext2D,
  points: Point[],
  width: number,
  color: string,
  alpha: number,
): void {
  if (points.length < 2 || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let at = 1; at < points.length; at += 1) {
    context.lineTo(points[at][0], points[at][1]);
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.stroke();
  context.lineCap = 'butt';
}

/** A fist seen from the front: a palm, four knuckles and a thumb across */
export function fist(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  orb(context, [x, y], size * 1.6, { color, alpha: alpha * 0.45 });
  blot(context, [x, y + size * 0.15], size * 0.78, size * 0.66, color, alpha);
  for (let knuckle = 0; knuckle < 4; knuckle += 1) {
    blot(
      context,
      [x + (knuckle - 1.5) * size * 0.4, y - size * 0.42],
      size * 0.23,
      size * 0.26,
      lighten(color, 0.25),
      alpha,
    );
  }
  edge(
    context,
    [x - size * 0.62, y + size * 0.1],
    [x + size * 0.3, y + size * 0.22],
    size * 0.14,
    0,
    {
      color: lighten(color, 0.45),
      alpha,
    },
  );
}

/** Where the Dynamax cloud hangs over the target */
export function cloudOver(stage: Stage): Point {
  const at = landing(stage);

  return [at[0], at[1] - REACH * stage.scale * CLOUD_HEIGHT];
}

/**
 * The opening every G-Max Move shares: the caster swelling in Dynamax
 * red, magenta crackling round it, and the red storm cloud a Max Move
 * falls out of gathering over the target
 */
export function gMaxPower(
  context: CanvasRenderingContext2D,
  stage: Stage,
  share: number,
  color: string,
  seed: number,
): void {
  const size = REACH * stage.scale;
  const shown = opening(share);
  const gather = Math.min(1, share / G_GATHER);
  const at = stage.source;

  if (shown > 0) {
    orb(context, at, size * (1.2 + gather * 1.1), { color: GMAX_RED, alpha: shown * 0.5 });
    orb(context, at, size * 0.8, { color: mix(color, GMAX_MAGENTA, 0.5), alpha: shown * 0.6 });
    for (let band = 0; band < 3; band += 1) {
      const held = (gather * 1.4 + band / 3) % 1;

      ripple(context, [at[0], at[1] + size * (0.9 - held * 2.8)], size * (1.7 - held * 0.7), {
        color: band % 2 === 0 ? GMAX_RED : GMAX_MAGENTA,
        alpha: shown * swell(held),
        width: 3 * stage.scale,
      });
    }
    const flick = Math.floor(share * 20);

    for (let arc = 0; arc < 3; arc += 1) {
      const angle = noise(seed + flick, arc) * Math.PI * 2;

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * size * 1.8, at[1] + Math.sin(angle) * size * 1.8],
        seed + flick * 3 + arc,
        { color: lighten(GMAX_MAGENTA, 0.3), alpha: shown * 0.8, width: 1.6 * stage.scale },
      );
    }
  }
  const cloud = clouded(share);

  if (cloud <= 0) {
    return;
  }
  const top = cloudOver(stage);
  const turn = share * 2;

  orb(context, top, size * 2.6, { color: GMAX_RED, alpha: cloud * 0.35 });
  for (let puff = 0; puff < CLOUD_PUFFS; puff += 1) {
    const angle = (puff / CLOUD_PUFFS) * Math.PI * 2 + turn;

    blot(
      context,
      [top[0] + Math.cos(angle) * size * 1.6, top[1] + Math.sin(angle) * size * 0.45],
      size * (0.8 + noise(seed, puff) * 0.3),
      size * 0.5,
      GMAX_CLOUD,
      cloud * 0.85,
    );
  }
  blot(context, top, size * 1.1, size * 0.4, GMAX_DARK, cloud * 0.9);
  if (Math.floor(share * 18) % 3 !== 1) {
    const flick = Math.floor(share * 18);

    bolt(
      context,
      [top[0] + spread(seed + flick, 1) * size * 1.4, top[1]],
      [top[0] + spread(seed + flick, 2) * size * 1.6, top[1] + size * 0.6],
      seed + flick,
      { color: GMAX_MAGENTA, alpha: cloud, width: 1.6 * stage.scale },
    );
  }
}

/** A tongue of flame standing on a point, pointed at the top */
export function flame(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  height: number,
  color: string,
  alpha: number,
): void {
  if (!(height > 0) || alpha <= 0) {
    return;
  }
  petal(context, [x, y - height * 0.5], height * 0.5, 0, { color, alpha });
  petal(context, [x, y - height * 0.3], height * 0.3, 0, {
    color: mix(color, '#fff2a0', 0.6),
    alpha,
  });
}

/** A quaver: a round head, a stem and a flag */
export function note(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  blot(context, [x, y], size * 0.42, size * 0.3, color, alpha);
  edge(context, [x + size * 0.36, y], [x + size * 0.36, y - size * 1.3], size * 0.1, 0, {
    color,
    alpha,
  });
  edge(
    context,
    [x + size * 0.36, y - size * 1.3],
    [x + size * 0.9, y - size * 0.8],
    size * 0.12,
    0,
    {
      color,
      alpha,
    },
  );
}

/** A sleeper's Z: a top bar, the stroke down across, and a bottom bar */
export function zee(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  strand(
    context,
    [
      [x - size * 0.5, y - size * 0.5],
      [x + size * 0.5, y - size * 0.5],
      [x - size * 0.5, y + size * 0.5],
      [x + size * 0.5, y + size * 0.5],
    ],
    size * 0.2,
    color,
    alpha,
  );
}

/** How many joints a whipping vine is drawn with */
export const VINE_JOINTS = 9;

/**
 * A vine whipping over from its root, as [across, up] offsets from it.
 * `beat` runs one lash from reared back to cracked down, and the end
 * lags the root so the vine curls the way a whip does
 */
export function whip(beat: number, side: number, length: number): [number, number][] {
  const joints: [number, number][] = [[0, 0]];
  const piece = length / VINE_JOINTS;
  let across = 0;
  let up = 0;

  for (let joint = 1; joint <= VINE_JOINTS; joint += 1) {
    const lag = Math.max(0, Math.min(1, beat * 1.3 - (joint / VINE_JOINTS) * 0.3));
    const eased = lag * lag * (3 - 2 * lag);
    // Up and leaning back to begin with, over and down across the target by the crack
    const angle = Math.PI / 2 + side * (0.5 - eased * 2.3);

    across += Math.cos(angle) * piece;
    up += Math.sin(angle) * piece;
    joints.push([across, up]);
  }
  return joints;
}

/**
 * How high a thing dropped from `height` is: `fall` runs from 0 at the
 * top to the floor at 0.7, then a short hop and still
 */
export function dropped(fall: number, height: number): number {
  if (fall < 0.7) {
    const down = fall / 0.7;

    return height * (1 - down * down);
  }
  const hop = (fall - 0.7) / 0.3;

  return height * 0.12 * Math.sin(Math.PI * hop);
}
