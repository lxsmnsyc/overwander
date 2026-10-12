import type { Point } from '../../stage';
import {
  bolt,
  burst,
  decay,
  fade,
  lighten,
  mix,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  shards,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/**
 * The Frenzy bursts of Hisui's five Nobles. Each lands on every foe at
 * once, so each is a whole moment over one body rather than a hit.
 */

/** The share at which a falling piece (the axe, the iceberg) strikes */
export const FALL_LANDS = 0.35;

/** Frenzied Blast: the share at which the gathered charge blows */
export const BLAST_BLOWS = 0.4;

/** A jagged stone slab, filled, its corners shaken by the seed */
function slab(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  width: number,
  height: number,
  seed: number,
  color: string,
  alpha: number,
): void {
  const corners: Point[] = [
    [x - width * 0.5, y - height * 0.3],
    [x - width * 0.15, y - height * 0.55],
    [x + width * 0.5, y - height * 0.4],
    [x + width * 0.4, y + height * 0.5],
    [x - width * 0.4, y + height * 0.45],
  ];

  context.beginPath();
  for (const [at, [cx, cy]] of corners.entries()) {
    const jitter = (noise(seed, at) - 0.5) * width * 0.12;

    if (at === 0) {
      context.moveTo(cx + jitter, cy);
    } else {
      context.lineTo(cx + jitter, cy);
    }
  }
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.strokeStyle = fade(mix(color, '#1a1410', 0.6), alpha);
  context.lineWidth = 2;
  context.stroke();
}

/** How far a falling piece has come: eased in, so it hits hard */
function falling(share: number): number {
  const drop = Math.min(1, share / FALL_LANDS);

  return drop * drop;
}

const hisui = {
  // A great stone axe head chops down out of the sky, and the stone it
  // splits hangs about the target as splinters
  Splinters(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const stone = mix(paint.color, '#a89478', 0.5);
    const hit = Math.max(0, (share - FALL_LANDS) / (1 - FALL_LANDS));

    if (hit <= 0) {
      const top: Point = [at[0], at[1] - size * 4 * (1 - falling(share))];

      slab(context, top, size * 2.2, size * 1.4, seed, stone, Math.min(1, share * 6));
      // The edge, honed pale
      context.strokeStyle = fade('#f0e6d2', Math.min(1, share * 6));
      context.lineWidth = 3 * stage.scale;
      context.beginPath();
      context.moveTo(top[0] - size * 0.9, top[1] + size * 0.62);
      context.lineTo(top[0] + size * 0.8, top[1] + size * 0.68);
      context.stroke();
      return;
    }

    orb(context, at, size * (0.6 + hit * 1.2), { color: '#fff4dc', alpha: decay(hit * 3) * 0.8 });
    ripple(context, [at[0], at[1] + size * 0.6], size * (1 + hit * 2.6), {
      color: stone,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2.6, many(12, weight), seed, hit, {
      color: stone,
      alpha: decay(hit),
    });
    // The splinters left hanging, turning slowly round it
    for (let piece = 0; piece < 4; piece += 1) {
      const angle = (piece / 4) * Math.PI * 2 + hit * 1.5 + noise(seed, piece + 30);
      const out = size * (1.2 + swell(Math.min(1, hit * 2)) * 0.6);

      slab(
        context,
        [at[0] + Math.cos(angle) * out, at[1] - size * 0.4 + Math.sin(angle) * out * 0.45],
        size * 0.55,
        size * 0.7,
        seed + piece,
        stone,
        Math.min(1, hit * 4) * decay(Math.max(0, hit - 0.5) * 2),
      );
    }
  },

  // A storm of petals whirls in round the target, tightens, and bursts
  // outward
  PetalStorm(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const pink = mix(paint.color, '#ff8cc6', 0.85);
    const count = many(16, weight);
    const tighten = share < 0.6 ? 1 - share / 0.6 : 0;
    const scatter = Math.max(0, (share - 0.6) / 0.4);

    for (let one = 0; one < count; one += 1) {
      const angle = (one / count) * Math.PI * 2 + share * 9 + noise(seed, one) * 0.6;
      const out = size * (0.6 + tighten * 2 + scatter * 3) * (0.8 + noise(seed, one + 9) * 0.4);
      const lift = (noise(seed, one + 19) - 0.5) * size * 1.6;

      petal(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + lift + Math.sin(angle) * out * 0.4],
        size * 0.32,
        angle + share * 12,
        { color: one % 3 === 0 ? '#fff2f8' : pink, alpha: Math.min(1, share * 5) * decay(scatter) },
      );
    }
    ring(context, at, size * (0.6 + tighten * 2), {
      color: pink,
      alpha: swell(Math.min(1, share / 0.6)) * 0.5 * (1 - scatter),
      width: 2 * stage.scale,
    });
    if (scatter > 0) {
      orb(context, at, size * (0.8 + scatter * 1.4), { color: pink, alpha: decay(scatter) * 0.6 });
    }
  },

  // The ground round the target catches: a ring of flame spreading out
  // along the floor, tongues licking up out of it
  Wildfire(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const floor: Point = [at[0], at[1] + size * 0.7];
    const flame = mix(paint.color, '#ff7a1a', 0.5);
    const spread = swell(Math.min(1, share * 1.6));
    const out = size * (0.5 + spread * 1.4);
    const alpha = Math.min(1, share * 5) * decay(Math.max(0, share - 0.5) * 2) * 0.8;

    // The glow on the ground, then the tongues stood round its rim
    // A floor alight rather than a ring, so it never reads as a warning mark
    for (const [reach, colour, strength] of [
      [1.1, '#ff5a1a', 0.45],
      [0.6, '#ffd34a', 0.35],
    ] as const) {
      context.fillStyle = fade(colour, alpha * strength);
      context.beginPath();
      context.ellipse(floor[0], floor[1], out * reach, out * reach * 0.34, 0, 0, Math.PI * 2);
      context.fill();
    }
    for (let tongue = 0; tongue < many(10, weight); tongue += 1) {
      const angle = noise(seed, tongue) * Math.PI * 2;
      const base: Point = [
        floor[0] + Math.cos(angle) * out,
        floor[1] + Math.sin(angle) * out * 0.34,
      ];
      const flicker = 0.6 + noise(seed + Math.floor(share * 20), tongue) * 0.6;

      orb(context, [base[0], base[1] - size * 0.4 * flicker], size * 0.5 * flicker, {
        color: tongue % 2 === 0 ? flame : '#ffd34a',
        alpha,
      });
    }
    motes(context, at, size * 1.6, 6, seed, share, { color: '#ffd34a', alpha: alpha * 0.8 });
  },

  // A charge gathers to a white-hot ball on the target and blows, bolts
  // flung out of it every way
  ChargedBlast(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const charge = Math.min(1, share / BLAST_BLOWS);
    const blown = Math.max(0, (share - BLAST_BLOWS) / (1 - BLAST_BLOWS));
    const hot = mix(paint.color, '#fff6a0', 0.5);

    if (blown <= 0) {
      orb(context, at, size * (0.3 + charge * 0.9), { color: hot, alpha: 0.4 + charge * 0.6 });
      for (let arc = 0; arc < 3; arc += 1) {
        const angle = noise(seed + Math.floor(share * 24), arc) * Math.PI * 2;

        bolt(
          context,
          [at[0] + Math.cos(angle) * size * 1.6, at[1] + Math.sin(angle) * size * 1.6],
          at,
          seed + arc + Math.floor(share * 24),
          { color: hot, alpha: charge, width: 2 * stage.scale },
        );
      }
      return;
    }

    orb(context, at, size * (1 + blown * 2.6), { color: '#ffffff', alpha: decay(blown * 1.6) });
    orb(context, at, size * (1.4 + blown * 2.2), { color: hot, alpha: decay(blown) * 0.7 });
    ring(context, at, size * (1 + blown * 3.4), {
      color: hot,
      alpha: decay(blown),
      width: 4 * stage.scale,
    });
    burst(context, at, size * (1.6 + blown * 2.4), 12, seed, {
      color: lighten(hot, 0.3),
      alpha: decay(blown),
      width: 3 * stage.scale,
    });
    for (let arc = 0; arc < 5; arc += 1) {
      const angle = (arc / 5) * Math.PI * 2 + noise(seed, arc + 5);
      const out = size * (1.2 + blown * 3);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        seed + arc,
        { color: hot, alpha: decay(blown), width: 2 * stage.scale },
      );
    }
  },

  // An iceberg drops out of the sky onto the target and shatters
  Iceberg(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const ice = mix(paint.color, '#cdf2ff', 0.5);
    const hit = Math.max(0, (share - FALL_LANDS) / (1 - FALL_LANDS));

    if (hit <= 0) {
      const top: Point = [at[0], at[1] - size * 3.2 * (1 - falling(share))];
      const alpha = Math.min(1, share * 6);

      // A wide berg with a pale crown and a shadow growing under it
      context.fillStyle = fade('#000000', falling(share) * 0.3);
      context.beginPath();
      context.ellipse(at[0], at[1] + size * 0.7, size * 1.6, size * 0.5, 0, 0, Math.PI * 2);
      context.fill();
      slab(context, top, size * 3, size * 2, seed, ice, alpha);
      slab(
        context,
        [top[0], top[1] - size * 0.6],
        size * 1.6,
        size * 0.8,
        seed + 3,
        '#f4fdff',
        alpha,
      );
      return;
    }

    orb(context, at, size * (0.8 + hit * 1.6), { color: '#ffffff', alpha: decay(hit * 3) * 0.9 });
    ripple(context, [at[0], at[1] + size * 0.7], size * (1.2 + hit * 2.8), {
      color: ice,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    shards(context, at, size * 3, many(16, weight), seed, hit, {
      color: ice,
      alpha: decay(hit),
    });
    burst(context, at, size * (1 + hit * 2), 8, seed + 1, {
      color: '#f4fdff',
      alpha: decay(hit),
      width: 2 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default hisui;
