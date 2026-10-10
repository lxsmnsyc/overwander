import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { lighten, mix, noise, spread, swell } from '../__paint';
import {
  CLOUD_HEIGHT,
  CLOUD_PUFFS,
  GMAX_CLOUD,
  GMAX_DARK,
  GMAX_MAGENTA,
  GMAX_RED,
  G_GATHER,
  clouded,
  opening,
} from '../effect/g-max-power';
import { TAU, bolt } from './pieces';
import { aside, landed, reachOf } from './shapes';

export {
  GMAX_CLOUD,
  GMAX_DARK,
  GMAX_MAGENTA,
  GMAX_RED,
  G_GATHER,
  VINE_JOINTS,
  dropped,
  gigantic,
  stretch,
  whip,
} from '../effect/g-max-power';

/** A fist facing the camera: a palm, four knuckles and a thumb across */
export function fist(
  kit: EffectBatch,
  at: Spot,
  size: number,
  colour: string,
  alpha: number,
): void {
  kit.glow(at, size * 1.7, colour, alpha * 0.45, 0.2);
  kit.puff(aside(kit, at, 0, -size * 0.15), size * 0.8, colour, alpha, { add: 0.3 });
  for (let knuckle = 0; knuckle < 4; knuckle += 1) {
    kit.puff(
      aside(kit, at, (knuckle - 1.5) * size * 0.4, size * 0.42),
      size * 0.27,
      lighten(colour, 0.25),
      alpha,
      { add: 0.3 },
    );
  }
  kit.ribbon(
    [aside(kit, at, -size * 0.62, -size * 0.1), aside(kit, at, size * 0.3, -size * 0.22)],
    size * 0.26,
    lighten(colour, 0.45),
    alpha,
    0,
    { add: 0.3 },
  );
}

/** A tongue of flame standing on a spot, pointed at the top */
export function flame(
  kit: EffectBatch,
  base: Spot,
  height: number,
  colour: string,
  alpha: number,
): void {
  if (!(height > 0) || alpha <= 0) {
    return;
  }
  // Half paint, so a fire still shows standing on snow
  kit.glow(aside(kit, base, 0, height * 0.2), height * 0.32, colour, alpha, 0.4, { add: 0.5 });
  kit.streak(
    aside(kit, base, 0, height * 0.5),
    height * 0.5,
    height * 0.32,
    Math.PI / 2,
    colour,
    alpha,
    { add: 0.5 },
  );
  kit.streak(
    aside(kit, base, 0, height * 0.3),
    height * 0.3,
    height * 0.2,
    Math.PI / 2,
    mix(colour, '#fff2a0', 0.6),
    alpha,
  );
}

/** A quaver: a round head, a stem and a flag */
export function note(
  kit: EffectBatch,
  at: Spot,
  size: number,
  colour: string,
  alpha: number,
): void {
  const stem = aside(kit, at, size * 0.36, size * 1.3);

  kit.puff(at, size * 0.4, colour, alpha, { add: 0.3 });
  kit.ribbon([aside(kit, at, size * 0.36), stem], size * 0.12, colour, alpha, 0, { add: 0.3 });
  kit.ribbon([stem, aside(kit, stem, size * 0.54, -size * 0.5)], size * 0.14, colour, alpha, 0, {
    add: 0.3,
  });
}

/** A sleeper's Z: a top bar, the stroke down across, and a bottom bar */
export function zee(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  kit.ribbon(
    [
      aside(kit, at, -size * 0.5, size * 0.5),
      aside(kit, at, size * 0.5, size * 0.5),
      aside(kit, at, -size * 0.5, -size * 0.5),
      aside(kit, at, size * 0.5, -size * 0.5),
    ],
    size * 0.2,
    colour,
    alpha,
    0,
    { add: 0.3 },
  );
}

/** Where the Dynamax cloud hangs over the target */
export function cloudOver(stage: LitStage): Spot {
  const at = landed(stage);

  return [at[0], at[1] + reachOf(stage) * CLOUD_HEIGHT, at[2]];
}

/**
 * The opening every G-Max Move shares: the caster swelling in Dynamax
 * red, magenta crackling round it, and the red storm cloud a Max Move
 * falls out of gathering over the target
 */
export function gMaxPower(
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  colour: string,
  seed: number,
): void {
  const reach = reachOf(stage);
  const shown = opening(share);
  const gather = Math.min(1, share / G_GATHER);
  const at = stage.source;

  if (shown > 0) {
    kit.glow(at, reach * (1.2 + gather * 1.1), GMAX_RED, shown * 0.5, 0.3);
    kit.glow(at, reach * 0.8, mix(colour, GMAX_MAGENTA, 0.5), shown * 0.6);
    kit.pool([at[0], 0, at[2]], reach * 2.2, GMAX_RED, shown * 0.45, { add: 0.5 });
    for (let band = 0; band < 3; band += 1) {
      const held = (gather * 1.4 + band / 3) % 1;

      kit.ripple(
        [at[0], held * reach * 3, at[2]],
        reach * (1.7 - held * 0.7),
        0.1,
        band % 2 === 0 ? GMAX_RED : GMAX_MAGENTA,
        shown * swell(held),
      );
    }
    const flick = Math.floor(share * 20);

    for (let arc = 0; arc < 3; arc += 1) {
      const angle = noise(seed + flick, arc) * TAU;

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * reach * 1.8, Math.sin(angle) * reach * 1.8),
        seed + flick * 3 + arc,
        reach * 0.4,
        reach * 0.05,
        lighten(GMAX_MAGENTA, 0.3),
        shown * 0.8,
      );
    }
  }
  const cloud = clouded(share);

  if (cloud <= 0) {
    return;
  }
  const top = cloudOver(stage);
  const turn = share * 2;

  kit.glow(top, reach * 2.6, GMAX_RED, cloud * 0.35, 0);
  for (let puff = 0; puff < CLOUD_PUFFS; puff += 1) {
    const angle = (puff / CLOUD_PUFFS) * TAU + turn;

    kit.puff(
      aside(kit, top, Math.cos(angle) * reach * 1.6, 0, Math.sin(angle) * reach * 1.2),
      reach * (0.8 + noise(seed, puff) * 0.3),
      GMAX_CLOUD,
      cloud * 0.85,
    );
  }
  kit.puff(top, reach * 1.1, GMAX_DARK, cloud * 0.9);
  if (Math.floor(share * 18) % 3 !== 1) {
    const flick = Math.floor(share * 18);

    bolt(
      kit,
      aside(kit, top, spread(seed + flick, 1) * reach * 1.4),
      aside(kit, top, spread(seed + flick, 2) * reach * 1.6, -reach * 0.7),
      seed + flick,
      reach * 0.3,
      reach * 0.05,
      GMAX_MAGENTA,
      cloud,
    );
  }
}
