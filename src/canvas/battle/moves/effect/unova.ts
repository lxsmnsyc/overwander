import type { Point } from '../../stage';
import {
  between,
  burst,
  decay,
  edge,
  fade,
  lighten,
  noise,
  orb,
  ring,
  spread,
  star,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';
import { settle, showing } from './stats';

/** Psyshock: the share its shards hang round the target, and how long driving them in takes */
export const CONVERGE_HOLD = 0.35;
export const CONVERGE_DRIVE = 0.15;

/** Stored Power: how many orbs circle in, and the share by which they have closed */
export const ORBIT_ORBS = 5;
export const ORBIT_CLOSE = 0.7;

/** Final Gambit: the share at which the blow lands */
export const GAMBIT_LANDS = 0.4;

/** A ring of `sides` straight edges round a point, turned by `turn` */
function polygon(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  sides: number,
  turn: number,
  color: string,
  alpha: number,
  width: number,
): void {
  context.beginPath();
  for (let corner = 0; corner <= sides; corner += 1) {
    const angle = turn + (corner / sides) * Math.PI * 2;

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius,
    );
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.stroke();
}

/** The Unova moves with a picture of their own */
const unova = {
  // Shards of psychic force hanging round it, then driven in together
  Converge(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);
    const count = many(6, weight);
    const drive = Math.min(1, Math.max(0, (share - CONVERGE_HOLD) / CONVERGE_DRIVE));

    if (drive < 1) {
      for (let shard = 0; shard < count; shard += 1) {
        const angle = (shard / count) * Math.PI * 2 + noise(seed, shard) * 0.3 + share * 0.8;
        const out = size * (2.2 - drive * 1.9);

        edge(
          context,
          [
            at[0] + Math.cos(angle) * (out + size * 0.7),
            at[1] + Math.sin(angle) * (out + size * 0.7) * 0.8,
          ],
          [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
          size * 0.16,
          0,
          { color: light, alpha: Math.min(1, share / 0.15) },
        );
      }
      return;
    }
    const hit = (share - CONVERGE_HOLD - CONVERGE_DRIVE) / (1 - CONVERGE_HOLD - CONVERGE_DRIVE);

    orb(context, at, size * (0.5 + hit), { ...paint, alpha: decay(hit) });
    burst(context, at, size * (1 + hit * 1.4), count * 2, seed, {
      color: light,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    ring(context, at, size * (0.4 + hit * 1.8), {
      color: light,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // Waves pulsing out of it and out of the pokemon that used it in step, with a line shaking between them
  Resonance(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.4);
    const shown = showing(share, 5, 0.75);
    const dx = at[0] - stage.source[0];
    const dy = at[1] - stage.source[1];
    const length = Math.max(1, Math.hypot(dx, dy));

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.5 + pulse / 3) % 1;

      ring(context, at, size * (0.4 + held * 2), {
        color: light,
        alpha: decay(held) * shown,
        width: 2.4 * stage.scale,
      });
      ring(context, stage.source, size * (0.4 + held * 1.2), {
        color: light,
        alpha: decay(held) * shown * 0.5,
        width: 2 * stage.scale,
      });
    }
    context.beginPath();
    for (let step = 0; step <= 24; step += 1) {
      const along = step / 24;
      const [x, y] = between(stage.source, at, along);
      const wave =
        Math.sin(along * Math.PI * 8 - share * Math.PI * 6) *
        Math.sin(along * Math.PI) *
        size *
        0.3;

      context[step === 0 ? 'moveTo' : 'lineTo'](x - (dy / length) * wave, y + (dx / length) * wave);
    }
    context.strokeStyle = fade(paint.color, shown * 0.8);
    context.lineWidth = 2 * stage.scale;
    context.stroke();
  },

  // Orbs of stored power circling it, closing in and bursting together
  Orbit(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);

    if (share < ORBIT_CLOSE) {
      const round = size * 1.6 * (1 - settle(share / ORBIT_CLOSE));
      const alpha = Math.min(1, share * 5);

      for (let one = 0; one < ORBIT_ORBS; one += 1) {
        const angle = (one / ORBIT_ORBS) * Math.PI * 2 + share * Math.PI * 4;
        const spot: Point = [
          at[0] + Math.cos(angle) * round,
          at[1] + Math.sin(angle) * round * 0.4,
        ];

        orb(context, spot, size * 0.25, { ...paint, alpha });
        star(context, spot, size * 0.2, share * 6 + one, { color: '#ffffff', alpha: alpha * 0.8 });
      }
      return;
    }
    const hit = (share - ORBIT_CLOSE) / (1 - ORBIT_CLOSE);

    orb(context, at, size * (0.6 + hit * 0.8), { ...paint, alpha: decay(hit) });
    ring(context, at, size * (0.5 + hit * 1.6), {
      color: light,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    burst(context, at, size * (1 + hit * 1.2), 10, seed, {
      color: light,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // The pokemon that used it flaring as it throws everything in, and one blow that lands with all of it
  Gambit(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const flare = share < 0.25 ? share / 0.25 : decay((share - 0.25) / 0.75);

    orb(context, stage.source, size * (0.8 + flare * 0.6), { color: light, alpha: flare * 0.8 });
    if (share < GAMBIT_LANDS) {
      const rush = Math.max(0, (share - 0.15) / (GAMBIT_LANDS - 0.15));

      if (rush > 0) {
        edge(context, stage.source, between(stage.source, at, rush), size * 0.3, 0, {
          color: light,
          alpha: 0.9,
        });
      }
      return;
    }
    const hit = (share - GAMBIT_LANDS) / (1 - GAMBIT_LANDS);

    orb(context, at, size * (0.8 + hit * 1.4), { color: light, alpha: decay(hit) });
    burst(context, at, size * (1.4 + hit * 1.6), 14, seed, {
      ...paint,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    for (let wave = 0; wave < 2; wave += 1) {
      ring(context, at, size * (0.6 + hit * (2 + wave)), {
        color: light,
        alpha: decay(hit) * (1 - wave * 0.4),
        width: 3 * stage.scale,
      });
    }
  },

  // Tiny bugs zigzagging in on it and nipping where they land
  Buzz(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.4);
    const angle = Math.atan2(at[1] - stage.source[1], at[0] - stage.source[0]);

    ring(context, at, size * (0.8 + swell(share) * 0.4), {
      color: light,
      alpha: swell(share) * 0.4,
      width: 1.6 * stage.scale,
    });
    for (let bug = 0; bug < many(8, weight); bug += 1) {
      const flying = share * 1.5 - noise(seed, bug) * 0.5;

      if (flying <= 0) {
        continue;
      }
      const end: Point = [
        at[0] + spread(seed, bug + 10) * size * 0.8,
        at[1] + spread(seed, bug + 20) * size * 0.7,
      ];

      if (flying < 1) {
        const [x, y] = between(stage.source, end, flying);
        const sway = Math.sin(flying * Math.PI * 6 + bug) * size * 0.4 * (1 - flying);

        orb(context, [x - Math.sin(angle) * sway, y + Math.cos(angle) * sway], size * 0.12, {
          color: light,
          alpha: 1,
        });
        continue;
      }
      const nip = (flying - 1) / 0.5;

      if (nip < 1) {
        burst(context, end, size * (0.3 + nip * 0.4), 4, seed + bug, {
          color: light,
          alpha: decay(nip),
          width: 1.8 * stage.scale,
        });
      }
    }
  },

  // A shot of plasma: a hard line from the pokemon that fired it, and hexagons ringing out off the hit
  Techno(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const flick = Math.floor(share * 14);

    if (share < 0.35) {
      edge(
        context,
        stage.source,
        between(stage.source, at, Math.min(1, share / 0.2)),
        size * 0.18,
        0,
        { color: light, alpha: decay(share / 0.35) },
      );
    }
    orb(context, at, size * (0.5 + swell(share) * 0.5), { ...paint, alpha: decay(share) });
    for (let hex = 0; hex < 3; hex += 1) {
      const held = Math.max(0, Math.min(1, (share - 0.15 - hex * 0.12) / 0.6));

      if (held <= 0) {
        continue;
      }
      polygon(
        context,
        at,
        size * (0.5 + held * 2),
        6,
        hex * 0.5 + share,
        light,
        decay(held),
        2.4 * stage.scale,
      );
    }
    burst(context, at, size * 1.4, 6, seed + flick, {
      ...paint,
      alpha: decay(share) * (flick % 2 === 0 ? 1 : 0.4),
      width: 2 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default unova;
