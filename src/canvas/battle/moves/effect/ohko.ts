import type { Point } from '../../stage';
import {
  beam,
  burst,
  decay,
  edge,
  fade,
  lighten,
  mix,
  orb,
  ring,
  shards,
  sickle,
} from '../__paint';
import { backToward } from './contact';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/**
 * The one-hit knockouts that are not weather or ground: Guillotine and
 * Horn Drill. Each is as big a moment as a Fissure, so each ends in a
 * finish rather than a plain hit.
 */

/** Guillotine: the share at which the pincers snap shut */
export const SHEARS_CLOSE = 0.4;

/** Horn Drill: the share at which the drill punches through */
export const AUGER_THROUGH = 0.55;

/** The colour a blade is drawn in, leaning toward the move's own */
export function steelOf(colour: string): string {
  return mix(colour, '#e8eef5', 0.7);
}

/** The field dimmed round the target while a finisher lands */
function dim(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  alpha: number,
): void {
  const shade = context.createRadialGradient(x, y, 0, x, y, radius);

  shade.addColorStop(0, fade('#05060a', alpha));
  shade.addColorStop(1, fade('#05060a', 0));
  context.fillStyle = shade;
  context.beginPath();
  context.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2);
  context.fill();
}

const ohko = {
  // Two great pincers close from either side and snap, cutting a line
  // of light clean through it
  Shears(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const steel = steelOf(paint.color);
    const closing = Math.min(1, share / SHEARS_CLOSE);
    const cut = Math.max(0, (share - SHEARS_CLOSE) / (1 - SHEARS_CLOSE));
    const radius = size * 1.4;
    // Slow to start and fast at the end, so the snap is the fast part
    const gap = size * (0.05 + 2.2 * (1 - closing * closing));

    dim(context, at, size * 3, (cut > 0 ? decay(cut) : closing) * 0.5);

    const held = cut > 0 ? decay(cut * 3) : 1;

    if (held > 0) {
      for (const side of [-1, 1]) {
        // Concave toward the target, from its own side of it
        const centre: Point = [at[0] + side * (gap - radius), at[1]];
        const facing = side < 0 ? Math.PI : 0;

        sickle(context, centre, radius, facing - 1.1, facing + 1.1, size * 0.34, {
          color: steel,
          alpha: held,
        });
        sickle(context, centre, radius, facing - 0.9, facing + 0.9, size * 0.08, {
          color: '#ffffff',
          alpha: held * 0.8,
        });
      }
    }
    if (cut <= 0) {
      return;
    }

    const from: Point = [at[0] - size * 2.8, at[1] + size * 0.55];
    const to: Point = [at[0] + size * 2.8, at[1] - size * 0.55];

    orb(context, at, size * (0.6 + cut * 1.6), { color: '#ffffff', alpha: decay(cut * 2.5) * 0.9 });
    beam(context, from, to, Math.min(1, cut * 6), size * 0.24 * decay(cut), {
      color: '#ffffff',
      alpha: decay(cut),
    });
    // The two halves of the cut, sliding apart as it fades
    if (cut > 0.15) {
      const apart = size * 0.4 * cut;

      for (const side of [-1, 1]) {
        edge(
          context,
          [from[0], from[1] + side * apart],
          [to[0], to[1] + side * apart],
          size * 0.05,
          0,
          { color: lighten(steel, 0.4), alpha: decay(cut) * 0.8 },
        );
      }
    }
    ring(context, at, size * (0.8 + cut * 2.2), {
      color: steel,
      alpha: decay(cut) * 0.8,
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2.4, many(10, weight), seed, cut, {
      color: steel,
      alpha: decay(cut),
      width: 3 * stage.scale,
    });
  },

  // A spinning drill grinds in, throwing sparks, and punches straight
  // through
  Auger(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const steel = steelOf(paint.color);
    const hot = mix(paint.color, '#ffe27a', 0.6);
    const driving = Math.min(1, share / AUGER_THROUGH);
    const through = Math.max(0, (share - AUGER_THROUGH) / (1 - AUGER_THROUGH));
    const eased = 1 - (1 - driving) ** 2;
    // Along the line it came in on
    const tip = backToward(at, stage.source, size * (1.6 * (1 - eased) - 0.2));
    const base = backToward(tip, stage.source, size * 2.4);
    const dx = tip[0] - base[0];
    const dy = tip[1] - base[1];
    const length = Math.max(1, Math.hypot(dx, dy));
    const across: Point = [-dy / length, dx / length];

    dim(context, at, size * 3, (through > 0 ? decay(through) : driving) * 0.4);
    orb(context, at, size * (0.4 + driving * 0.8), {
      color: hot,
      alpha: driving * 0.6 * decay(through),
    });

    const held = through > 0 ? decay(through * 4) : 1;

    if (held > 0) {
      const half = size * 0.75;

      context.beginPath();
      context.moveTo(tip[0], tip[1]);
      context.lineTo(base[0] + across[0] * half, base[1] + across[1] * half);
      context.lineTo(base[0] - across[0] * half, base[1] - across[1] * half);
      context.closePath();
      context.fillStyle = fade(steel, held);
      context.fill();
      // The thread, running down the cone as it turns
      context.strokeStyle = fade(mix(steel, '#3a4250', 0.55), held);
      context.lineWidth = 2 * stage.scale;
      context.beginPath();
      for (let band = 0; band < 6; band += 1) {
        const along = (band / 6 + share * 8) % 1;
        const wide = half * (1 - along);
        const middle: Point = [base[0] + dx * along, base[1] + dy * along];

        context.moveTo(middle[0] + across[0] * wide, middle[1] + across[1] * wide);
        context.lineTo(
          middle[0] - across[0] * wide + (dx / length) * size * 0.25,
          middle[1] - across[1] * wide + (dy / length) * size * 0.25,
        );
      }
      context.stroke();
      // Sparks off the point, a fresh spray every few frames
      if (driving > 0.3) {
        burst(context, tip, size * 1.1, 8, seed + Math.floor(share * 30), {
          color: hot,
          alpha: held,
          width: 2 * stage.scale,
        });
      }
    }
    if (through <= 0) {
      return;
    }

    const exit = backToward(at, stage.source, -size * 3.4);

    orb(context, at, size * (0.8 + through * 1.8), {
      color: '#ffffff',
      alpha: decay(through * 2.5) * 0.9,
    });
    beam(context, at, exit, Math.min(1, through * 5), size * 0.5 * decay(through), {
      color: hot,
      alpha: decay(through),
    });
    burst(context, at, size * (1.2 + through * 2), 12, seed, {
      color: hot,
      alpha: decay(through),
      width: 3 * stage.scale,
    });
    ring(context, at, size * (0.6 + through * 2.6), {
      color: steel,
      alpha: decay(through) * 0.8,
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2.6, many(12, weight), seed + 7, through, {
      color: steel,
      alpha: decay(through),
      width: 3 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default ohko;
