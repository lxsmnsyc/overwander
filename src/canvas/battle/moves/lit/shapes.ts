import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { noise } from '../__paint';
import { type Draw, type EffectShape, REACH } from '../effect/shapes';

/**
 * The kit the scene versions of a move landing are built with. Sizes
 * are the painted versions' own, turned into field units by the stage,
 * so the two stay the same size as each other.
 */

export type LitShapePainter = (
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  draw: Draw,
) => void;

/** How hard each shape shakes the scene at ordinary weight, in drawing pixels */
export const JOLTS: Partial<Record<EffectShape, number>> = {
  Blast: 3,
  Quake: 4,
  Chasm: 3.5,
  Rocks: 2,
  Spout: 2.5,
  Slam: 2.5,
  Strike: 1.5,
  Drum: 1.5,
  Rush: 2.5,
  Torrent: 1.5,
  Stall: 2,
  Rend: 2,
  Verdict: 1.5,
  Pyre: 1.5,
  Upheaval: 3.5,
  Ambush: 2.5,
  Lustre: 2,
  Starfall: 2.5,
  Grip: 2,
  Surge: 3,
  Cannon: 3,
  Meteors: 3.5,
  Rampage: 2.5,
  Rift: 2.5,
  Freeze: 1.5,
  Blaster: 3,
  Crash: 3.5,
  Haymaker: 3,
  Flurry: 2,
  Aura: 2,
  Kicks: 1,
  Roar: 1.5,
};

/** Where the effect is happening: the first body it landed on. */
export function landed(stage: LitStage): Spot {
  return stage.targets[0] ?? stage.source;
}

/** The painted `REACH` in field units, scaled by weight. */
export function reachOf(stage: LitStage, weight = 1): number {
  return REACH * stage.size * weight;
}

/** The ground under a spot. */
export function floorOf(spot: Spot): Spot {
  return [spot[0], 0, spot[2]];
}

/** The spot in the middle of everything given. */
export function middleOf(spots: Spot[]): Spot {
  const sum: Spot = [0, 0, 0];

  for (const spot of spots) {
    sum[0] += spot[0];
    sum[1] += spot[1];
    sum[2] += spot[2];
  }
  return [sum[0] / spots.length, sum[1] / spots.length, sum[2] / spots.length];
}

/** A point some share of the way from one spot to another. */
export function toward(from: Spot, to: Spot, share: number): Spot {
  return [
    from[0] + (to[0] - from[0]) * share,
    from[1] + (to[1] - from[1]) * share,
    from[2] + (to[2] - from[2]) * share,
  ];
}

/** A spot moved across the picture, up, and away from the camera. */
export function aside(kit: EffectBatch, spot: Spot, right: number, up = 0, away = 0): Spot {
  const [ax, az] = kit.across;
  const [bx, bz] = kit.away;

  return [spot[0] + ax * right + bx * away, spot[1] + up, spot[2] + az * right + bz * away];
}

/**
 * Where a piece thrown out of a spot is: out along the ground in a
 * seeded direction, up, and back down to the floor by the end
 */
export function thrown(
  from: Spot,
  seed: number,
  index: number,
  share: number,
  out: number,
  up: number,
): Spot {
  const angle = noise(seed, index) * Math.PI * 2;
  const distance = out * (0.35 + noise(seed, index + 40) * 0.65) * (1 - (1 - share) ** 2);
  const lift = up * (0.5 + noise(seed, index + 80) * 0.5);

  return [
    from[0] + Math.cos(angle) * distance,
    Math.max(0, from[1] + lift * 4 * share * (1 - share) - from[1] * share * share),
    from[2] + Math.sin(angle) * distance,
  ];
}

/** Full until `from`, then gone by the end. */
export function late(share: number, from: number): number {
  return share < from ? 1 : Math.max(0, 1 - (share - from) / (1 - from));
}

/** How far through its own part something staggered is, from 0 to 1. */
export function staged(share: number, rate: number, delay: number): number {
  return Math.max(0, Math.min(1, share * rate - delay));
}
