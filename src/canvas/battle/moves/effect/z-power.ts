import type { Point, Stage } from '../../stage';
import { edge, lighten, mix, motes, noise, orb, ring } from '../__paint';
import { REACH, many } from './shapes';
import { showing } from './stats';

/** Z-Moves: the share of the span the caster spends gathering its Z-Power */
export const Z_GATHER = 0.28;

/** The gold every Z-Power is wrapped in, whatever the type */
export const Z_GOLD = '#ffd84a';

/** How far through the payoff a Z-Move is, from 0 once its power is gathered */
export function unleashed(share: number): number {
  return Math.max(0, (share - Z_GATHER) / (1 - Z_GATHER));
}

/** The Z itself: a top bar, the stroke down across, and a bottom bar */
export function zGlyph(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  const width = size * 0.16;
  const corners: Point[] = [
    [x - size * 0.5, y - size * 0.5],
    [x + size * 0.5, y - size * 0.5],
    [x - size * 0.5, y + size * 0.5],
    [x + size * 0.5, y + size * 0.5],
  ];

  for (let stroke = 0; stroke < 3; stroke += 1) {
    edge(context, corners[stroke], corners[stroke + 1], width, 0, { color, alpha });
  }
}

/**
 * The opening every Z-Move shares: the caster wrapped in gold and its
 * type's colour, light drawn in to it, and the Z over its head
 */
export function zPower(
  context: CanvasRenderingContext2D,
  stage: Stage,
  share: number,
  color: string,
  seed: number,
): void {
  const at = stage.source;
  const size = REACH * stage.scale;
  const shown = showing(share, 8, Z_GATHER * 0.8);

  if (shown <= 0) {
    return;
  }
  const gather = Math.min(1, share / Z_GATHER);
  const glow = mix(color, Z_GOLD, 0.5);

  orb(context, at, size * (1 + gather * 0.8), { color: glow, alpha: shown * 0.45 });
  orb(context, at, size * 0.7, { color: lighten(Z_GOLD, 0.5), alpha: shown * 0.5 });
  for (let band = 0; band < 3; band += 1) {
    const held = (gather * 1.5 + band / 3) % 1;

    ring(context, at, size * (2.4 - held * 1.8), {
      color: band % 2 === 0 ? Z_GOLD : color,
      alpha: shown * held,
      width: 2.4 * stage.scale,
    });
  }
  motes(context, at, size * 2.2 * (1 - gather), many(12, 1), seed, gather, {
    color: Z_GOLD,
    alpha: shown,
    width: 2 * stage.scale,
  });
  zGlyph(
    context,
    [at[0], at[1] - size * (1.9 + gather * 0.4 + noise(seed, 1) * 0.1)],
    size * 0.9,
    Z_GOLD,
    shown,
  );
}
