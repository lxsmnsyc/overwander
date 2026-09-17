import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix } from '../__paint';
import { AUGER_THROUGH, SHEARS_CLOSE, steelOf } from '../effect/ohko';
import { type EffectShape, many } from '../effect/shapes';
import { debris, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, reachOf } from './shapes';

/**
 * Guillotine and Horn Drill in the battle scene: the same finishes the
 * painted versions draw, a snap and a punch-through.
 */

const DARK = '#05060a';

/** A point along the ground from one spot to another, past either end */
function along(from: Spot, to: Spot, distance: number): Spot {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const length = Math.max(0.001, Math.hypot(dx, dz));

  return [from[0] + (dx / length) * distance, from[1], from[2] + (dz / length) * distance];
}

const ohko = {
  Shears(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const steel = steelOf(paint.color);
    const closing = Math.min(1, share / SHEARS_CLOSE);
    const cut = Math.max(0, (share - SHEARS_CLOSE) / (1 - SHEARS_CLOSE));
    const radius = reach * 1.4;
    const gap = reach * (0.05 + 2.2 * (1 - closing * closing));
    const shade = (cut > 0 ? decay(cut) : closing) * 0.5;

    kit.pool(floorOf(at), reach * 3, DARK, shade, { add: 0 });
    kit.glow(at, reach * 2.6, DARK, shade * 0.7, 0, { add: 0 });

    const held = cut > 0 ? decay(cut * 3) : 1;

    if (held > 0) {
      for (const side of [-1, 1]) {
        const blade: Spot[] = [];
        const edge: Spot[] = [];

        for (let step = 0; step <= 12; step += 1) {
          const angle = (side < 0 ? Math.PI : 0) + (step / 12 - 0.5) * 2.2;
          const right = side * (gap - radius) + Math.cos(angle) * radius;
          const up = Math.sin(angle) * radius;

          blade.push(aside(kit, at, right, up));
          edge.push(aside(kit, at, right + Math.cos(angle) * reach * 0.12, up));
        }
        kit.ribbon(blade, reach * 0.34, steel, held, 0, { add: 0.2 });
        kit.ribbon(edge, reach * 0.08, '#ffffff', held * 0.8, 0, { add: 0.6 });
      }
    }
    if (cut <= 0) {
      return;
    }

    const drawn = Math.min(1, cut * 6);
    const from = aside(kit, at, -reach * 2.8, -reach * 0.55);
    const to = aside(kit, at, reach * 2.8 * (drawn * 2 - 1), reach * 0.55 * (drawn * 2 - 1));

    kit.glow(at, reach * (0.6 + cut * 1.6), '#ffffff', decay(cut * 2.5) * 0.9, 1);
    kit.ribbon([from, to], reach * 0.24 * decay(cut), '#ffffff', decay(cut), 0, { add: 1 });
    if (cut > 0.15) {
      const apart = reach * 0.4 * cut;

      for (const side of [-1, 1]) {
        kit.ribbon(
          [
            aside(kit, at, -reach * 2.8, -reach * 0.55 + side * apart),
            aside(kit, at, reach * 2.8, reach * 0.55 + side * apart),
          ],
          reach * 0.06,
          lighten(steel, 0.4),
          decay(cut) * 0.8,
        );
      }
    }
    kit.ring(at, reach * (0.8 + cut * 2.2), 0.08, steel, decay(cut) * 0.8);
    kit.ripple(floorOf(at), reach * (1 + cut * 2.4), 0.1, steel, decay(cut) * 0.6);
    debris(kit, at, reach, many(10, weight), seed, cut, steel, decay(cut));
    sparks(kit, at, reach * (0.8 + cut), 8, seed, cut, '#ffffff', decay(cut));
  },

  Auger(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const steel = steelOf(paint.color);
    const thread = mix(steel, '#3a4250', 0.55);
    const hot = mix(paint.color, '#ffe27a', 0.6);
    const driving = Math.min(1, share / AUGER_THROUGH);
    const through = Math.max(0, (share - AUGER_THROUGH) / (1 - AUGER_THROUGH));
    const eased = 1 - (1 - driving) ** 2;
    const tip = along(at, stage.source, reach * (1.6 * (1 - eased) - 0.2));
    const base = along(tip, stage.source, reach * 2.4);
    const shade = (through > 0 ? decay(through) : driving) * 0.4;

    kit.pool(floorOf(at), reach * 3, DARK, shade, { add: 0 });
    kit.glow(at, reach * (0.4 + driving * 0.8), hot, driving * 0.6 * decay(through), 0.8);

    const held = through > 0 ? decay(through * 4) : 1;

    if (held > 0) {
      // The body of the cone, fattest at the base
      for (let slice = 0; slice < 6; slice += 1) {
        const share6 = slice / 6;
        const spot: Spot = [
          base[0] + (tip[0] - base[0]) * share6,
          base[1] + (tip[1] - base[1]) * share6,
          base[2] + (tip[2] - base[2]) * share6,
        ];

        kit.glow(spot, reach * 0.8 * (1 - share6), steel, held * 0.7, 0.3, { add: 0.2 });
      }
      // Two threads wound round it, turning as it spins
      for (const phase of [0, Math.PI]) {
        const path: Spot[] = [];

        for (let step = 0; step <= 16; step += 1) {
          const at16 = step / 16;
          const angle = at16 * Math.PI * 6 + share * 40 + phase;
          const round = reach * 0.75 * (1 - at16);
          const middle: Spot = [
            base[0] + (tip[0] - base[0]) * at16,
            base[1] + (tip[1] - base[1]) * at16,
            base[2] + (tip[2] - base[2]) * at16,
          ];

          path.push(aside(kit, middle, 0, Math.sin(angle) * round, Math.cos(angle) * round));
        }
        kit.ribbon(path, reach * 0.07, thread, held);
      }
      if (driving > 0.3) {
        sparks(kit, tip, reach * 1.1, 8, seed + Math.floor(share * 30), (share * 6) % 1, hot, held);
      }
    }
    if (through <= 0) {
      return;
    }

    const exit = along(at, stage.source, -reach * 3.4 * Math.min(1, through * 5));

    kit.glow(at, reach * (0.8 + through * 1.8), '#ffffff', decay(through * 2.5) * 0.9, 1);
    kit.ribbon([at, exit], reach * 0.5 * decay(through), hot, decay(through), 0, { add: 1 });
    kit.star(at, reach * (1.2 + through * 2), 0.4, lighten(hot, 0.4), decay(through));
    kit.ring(at, reach * (0.6 + through * 2.6), 0.08, steel, decay(through) * 0.8);
    kit.ripple(floorOf(at), reach * (0.8 + through * 2.8), 0.1, hot, decay(through) * 0.6);
    debris(kit, at, reach, many(12, weight), seed + 7, through, steel, decay(through));
    sparks(kit, at, reach * (1 + through * 1.5), 12, seed, through, hot, decay(through));
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default ohko;
