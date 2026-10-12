import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, swell } from '../__paint';
import { BLAST_BLOWS, FALL_LANDS } from '../effect/hisui';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, bolt, debris, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, reachOf } from './shapes';

/**
 * The Frenzy bursts of Hisui's five Nobles in the battle scene: the
 * same moments the painted versions draw, an axe, a petal storm, a
 * wildfire, a blast and an iceberg.
 */

/** How far a falling piece has come: eased in, so it hits hard */
function falling(share: number): number {
  const drop = Math.min(1, share / FALL_LANDS);

  return drop * drop;
}

/** A solid block of stone or ice, built out of shards packed round a middle */
function block(
  kit: EffectBatch,
  at: Spot,
  reach: number,
  seed: number,
  colour: string,
  alpha: number,
): void {
  kit.glow(at, reach * 0.9, colour, alpha * 0.5, 0, { add: 0 });
  for (let piece = 0; piece < 7; piece += 1) {
    const angle = (piece / 7) * TAU + noise(seed, piece);
    const out = piece === 0 ? 0 : reach * 0.45;

    kit.shard(
      aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.7),
      reach * 0.7,
      noise(seed, piece + 9) * TAU,
      piece % 2 === 0 ? colour : lighten(colour, 0.25),
      alpha,
    );
  }
}

const hisui = {
  Splinters(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const stone = mix(paint.color, '#a89478', 0.5);
    const hit = Math.max(0, (share - FALL_LANDS) / (1 - FALL_LANDS));

    if (hit <= 0) {
      const top = aside(kit, at, 0, reach * 4 * (1 - falling(share)));

      block(kit, top, reach * 1.2, seed, stone, Math.min(1, share * 6));
      kit.ribbon(
        [aside(kit, top, -reach * 0.9, -reach * 0.6), aside(kit, top, reach * 0.8, -reach * 0.6)],
        reach * 0.12,
        '#f0e6d2',
        Math.min(1, share * 6),
      );
      return;
    }

    kit.glow(at, reach * (0.6 + hit * 1.2), '#fff4dc', decay(hit * 3) * 0.8, 1);
    kit.ripple(floorOf(at), reach * (1 + hit * 2.6), 0.1, stone, decay(hit) * 0.8);
    debris(kit, at, reach, many(12, weight), seed, hit, stone, decay(hit));
    for (let piece = 0; piece < 4; piece += 1) {
      const angle = (piece / 4) * TAU + hit * 1.5 + noise(seed, piece + 30);
      const out = reach * (1.2 + swell(Math.min(1, hit * 2)) * 0.6);

      kit.shard(
        aside(kit, at, Math.cos(angle) * out, reach * 0.4 + Math.sin(angle) * out * 0.45),
        reach * 0.4,
        angle,
        stone,
        Math.min(1, hit * 4) * decay(Math.max(0, hit - 0.5) * 2),
      );
    }
  },

  PetalStorm(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const pink = mix(paint.color, '#ff8cc6', 0.85);
    const count = many(16, weight);
    const tighten = share < 0.6 ? 1 - share / 0.6 : 0;
    const scatter = Math.max(0, (share - 0.6) / 0.4);

    for (let one = 0; one < count; one += 1) {
      const angle = (one / count) * TAU + share * 9 + noise(seed, one) * 0.6;
      const out = reach * (0.6 + tighten * 2 + scatter * 3) * (0.8 + noise(seed, one + 9) * 0.4);
      const spot: Spot = [
        at[0] + Math.cos(angle) * out,
        Math.max(0, at[1] + (noise(seed, one + 19) - 0.5) * reach * 1.6),
        at[2] + Math.sin(angle) * out,
      ];

      kit.leaf(
        spot,
        reach * 0.32,
        angle + share * 12,
        one % 3 === 0 ? '#fff2f8' : pink,
        Math.min(1, share * 5) * decay(scatter),
      );
    }
    kit.ripple(
      floorOf(at),
      reach * (0.6 + tighten * 2),
      0.08,
      pink,
      swell(Math.min(1, share / 0.6)) * 0.5 * (1 - scatter),
    );
    if (scatter > 0) {
      kit.glow(at, reach * (0.8 + scatter * 1.4), pink, decay(scatter) * 0.6, 0.5);
    }
  },

  Wildfire(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const floor = floorOf(at);
    const flame = mix(paint.color, '#ff7a1a', 0.5);
    const out = reach * (0.5 + swell(Math.min(1, share * 1.6)) * 1.4);
    const alpha = Math.min(1, share * 5) * decay(Math.max(0, share - 0.5) * 2) * 0.8;

    // A floor alight rather than a ring, so it never reads as a warning mark
    kit.pool(floor, out * 1.1, '#ff5a1a', alpha * 0.8);
    kit.pool(floor, out * 0.6, '#ffd34a', alpha * 0.5);
    for (let tongue = 0; tongue < many(10, weight); tongue += 1) {
      const angle = noise(seed, tongue) * TAU;
      const flicker = 0.6 + noise(seed + Math.floor(share * 20), tongue) * 0.6;

      kit.glow(
        [floor[0] + Math.cos(angle) * out, reach * 0.4 * flicker, floor[2] + Math.sin(angle) * out],
        reach * 0.5 * flicker,
        tongue % 2 === 0 ? flame : '#ffd34a',
        alpha,
        0.7,
      );
    }
    sparks(kit, at, reach * 1.6, 6, seed, share, '#ffd34a', alpha * 0.8);
  },

  ChargedBlast(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const charge = Math.min(1, share / BLAST_BLOWS);
    const blown = Math.max(0, (share - BLAST_BLOWS) / (1 - BLAST_BLOWS));
    const hot = mix(paint.color, '#fff6a0', 0.5);

    if (blown <= 0) {
      kit.glow(at, reach * (0.3 + charge * 0.9), hot, 0.4 + charge * 0.6, 1);
      for (let arc = 0; arc < 3; arc += 1) {
        const angle = noise(seed + Math.floor(share * 24), arc) * TAU;

        bolt(
          kit,
          aside(kit, at, Math.cos(angle) * reach * 1.6, Math.sin(angle) * reach * 1.6),
          at,
          seed + arc + Math.floor(share * 24),
          reach,
          reach * 0.08,
          hot,
          charge,
        );
      }
      return;
    }

    kit.glow(at, reach * (1 + blown * 2.6), '#ffffff', decay(blown * 1.6), 1);
    kit.glow(at, reach * (1.4 + blown * 2.2), hot, decay(blown) * 0.7, 0.6);
    kit.ring(at, reach * (1 + blown * 3.4), 0.08, hot, decay(blown));
    kit.ripple(floorOf(at), reach * (1.2 + blown * 3.4), 0.1, hot, decay(blown) * 0.7);
    sparks(kit, at, reach * (1.6 + blown * 2.4), 12, seed, blown, lighten(hot, 0.3), decay(blown));
    for (let arc = 0; arc < 5; arc += 1) {
      const angle = (arc / 5) * TAU + noise(seed, arc + 5);
      const out = reach * (1.2 + blown * 3);

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        seed + arc,
        reach,
        reach * 0.08,
        hot,
        decay(blown),
      );
    }
  },

  Iceberg(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const ice = mix(paint.color, '#cdf2ff', 0.5);
    const hit = Math.max(0, (share - FALL_LANDS) / (1 - FALL_LANDS));

    if (hit <= 0) {
      const top = aside(kit, at, 0, reach * 3.2 * (1 - falling(share)));
      const alpha = Math.min(1, share * 6);

      kit.pool(floorOf(at), reach * 1.6, '#000000', falling(share) * 0.3, { add: 0 });
      block(kit, top, reach * 1.6, seed, ice, alpha);
      block(kit, aside(kit, top, 0, reach * 0.7), reach * 0.8, seed + 3, '#f4fdff', alpha);
      return;
    }

    kit.glow(at, reach * (0.8 + hit * 1.6), '#ffffff', decay(hit * 3) * 0.9, 1);
    kit.ripple(floorOf(at), reach * (1.2 + hit * 2.8), 0.1, ice, decay(hit) * 0.8);
    debris(kit, at, reach * 1.2, many(16, weight), seed, hit, ice, decay(hit));
    sparks(kit, at, reach * (1 + hit * 2), 8, seed + 1, hit, '#f4fdff', decay(hit));
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default hisui;
