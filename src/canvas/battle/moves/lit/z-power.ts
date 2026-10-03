import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { lighten, mix } from '../__paint';
import { showing } from '../effect/stats';
import { Z_GATHER, Z_GOLD } from '../effect/z-power';
import { gathering } from './pieces';
import { aside, reachOf } from './shapes';

export { Z_GATHER, Z_GOLD, unleashed } from '../effect/z-power';

/** The Z itself, standing up over a spot and facing the camera */
export function zGlyph(
  kit: EffectBatch,
  at: Spot,
  size: number,
  colour: string,
  alpha: number,
): void {
  kit.ribbon(
    [
      aside(kit, at, -size * 0.5, size * 0.5),
      aside(kit, at, size * 0.5, size * 0.5),
      aside(kit, at, -size * 0.5, -size * 0.5),
      aside(kit, at, size * 0.5, -size * 0.5),
    ],
    size * 0.16,
    colour,
    alpha,
  );
}

/**
 * The opening every Z-Move shares: the caster wrapped in gold and its
 * type's colour, light drawn in to it, and the Z over its head
 */
export function zPower(
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  colour: string,
  seed: number,
): void {
  const at = stage.source;
  const reach = reachOf(stage);
  const shown = showing(share, 8, Z_GATHER * 0.8);

  if (shown <= 0) {
    return;
  }
  const gather = Math.min(1, share / Z_GATHER);

  kit.glow(at, reach * (1 + gather * 0.8), mix(colour, Z_GOLD, 0.5), shown * 0.45, 0.4);
  kit.glow(at, reach * 0.7, lighten(Z_GOLD, 0.5), shown * 0.5);
  for (let band = 0; band < 3; band += 1) {
    const held = (gather * 1.5 + band / 3) % 1;

    kit.ring(at, reach * (2.4 - held * 1.8), 0.08, band % 2 === 0 ? Z_GOLD : colour, shown * held);
  }
  kit.pool([at[0], 0, at[2]], reach * 2, Z_GOLD, shown * 0.4, { add: 0.5 });
  gathering(kit, at, reach * 2.2, 12, seed, share, Z_GOLD);
  zGlyph(kit, aside(kit, at, 0, reach * (1.9 + gather * 0.4)), reach * 0.9, Z_GOLD, shown);
}
