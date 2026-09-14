import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../../moves/__painted';
import { decay, lighten, noise, spread, swell } from '../../moves/__paint';
import { TAU } from '../../moves/lit/pieces';
import { aside } from '../../moves/lit/shapes';
import { LIFT, REACH } from '../shapes';

/**
 * The kit a status cue is built with in the battle scene. A cue is about
 * one pokemon, so everything is placed off the stage's source.
 * `strength` is the cue's own alpha: a status biting is quieter than one
 * landing
 */
export type LitCue = (
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  colour: string,
  strength: number,
) => void;

/** The painted cue's `REACH`, in field units */
export function sizeOf(stage: LitStage): number {
  return REACH * stage.size;
}

/** Where a mark hangs over the head */
export function headOf(kit: EffectBatch, stage: LitStage, lift = LIFT): Spot {
  return aside(kit, stage.source, 0, lift * stage.size);
}

export function footOf(stage: LitStage): Spot {
  return [stage.source[0], 0, stage.source[2]];
}

/** Things rising off the body all round it: gas bubbles, embers, spores */
export function litRising(
  count: number,
  seed: number,
  form: 'bubble' | 'mote' | 'leaf' = 'mote',
): LitCue {
  return (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const at = stage.source;
    const shown = Math.min(1, swell(share) * 1.5) * strength;

    kit.pool(footOf(stage), size * 1.3, colour, swell(share) * 0.35 * strength);
    for (let one = 0; one < count; one += 1) {
      const held = (share * 1.2 + noise(seed, one)) % 1;
      const angle = noise(seed, one + 20) * TAU;
      const round = size * (0.5 + noise(seed, one + 40) * 0.6);
      const spot: Spot = [
        at[0] + Math.cos(angle) * round,
        Math.max(0, at[1] - size * 0.6 + held * size * 2.2),
        at[2] + Math.sin(angle) * round,
      ];
      const alpha = swell(held) * shown;

      if (form === 'bubble') {
        kit.bubble(
          spot,
          size * 0.16 * (0.6 + noise(seed, one + 60) * 0.8),
          lighten(colour, 0.3),
          alpha,
        );
      } else if (form === 'leaf') {
        kit.leaf(spot, size * 0.22, held * 6 + one, colour, alpha);
      } else {
        kit.glow(spot, size * 0.1, lighten(colour, 0.35), alpha, 0.8);
      }
    }
  };
}

/** Marks going round the head: what a pokemon is seeing rather than wearing */
export function litOrbiting(count: number): LitCue {
  return (kit, stage, share, colour, strength) => {
    const head = headOf(kit, stage);
    const size = sizeOf(stage);

    // Round the head for real, so the far side goes behind it
    kit.near(0);
    kit.ripple(head, size, 0.06, colour, swell(share) * 0.5 * strength);
    for (let mark = 0; mark < count; mark += 1) {
      const angle = share * TAU + (mark / count) * TAU;
      const spot: Spot = [
        head[0] + Math.cos(angle) * size,
        head[1],
        head[2] + Math.sin(angle) * size,
      ];

      kit.glow(spot, size * 0.3, colour, 0.4 * swell(share) * strength, 0.3);
      kit.star(
        spot,
        size * 0.38,
        angle,
        lighten(colour, 0.3),
        Math.min(1, swell(share) + 0.2) * strength,
      );
    }
  };
}

/**
 * A pokemon that tried and could not: a barred ring over the head, over
 * whatever the status itself is doing
 */
export function litStalled(under?: LitCue): LitCue {
  return (kit, stage, share, colour, strength) => {
    under?.(kit, stage, share, colour, strength);

    const head = headOf(kit, stage);
    const size = sizeOf(stage) * 0.7;
    // Snaps to full size and holds: a refusal is instant
    const alpha = (share < 0.15 ? share / 0.15 : decay((share - 0.15) / 0.85)) * strength;

    kit.near(sizeOf(stage));
    kit.ring(head, size, 0.24, '#1a1420', alpha * 0.6, { add: 0 });
    kit.ring(head, size, 0.12, colour, alpha);
    kit.ribbon(
      [aside(kit, head, -size * 0.7, size * 0.7), aside(kit, head, size * 0.7, -size * 0.7)],
      size * 0.18,
      colour,
      alpha,
    );
  };
}

/** Health leaving on the status's own clock: drips falling and the body flashing */
export function litBitten(count: number, seed: number): LitCue {
  return (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const at = stage.source;
    const drip = (index: number, held: number): Spot => {
      const spot = aside(
        kit,
        at,
        spread(seed, index + 11) * size * 0.9,
        size * 0.6 - held * size * 1.8,
        spread(seed, index + 30) * size * 0.5,
      );

      return [spot[0], Math.max(0, spot[1]), spot[2]];
    };

    kit.glow(at, size * 0.9, colour, decay(share) * 0.4 * strength, 0.3);
    kit.ring(at, size * (0.8 + share * 0.6), 0.08, colour, decay(share) * 0.7 * strength);
    for (let index = 0; index < count; index += 1) {
      const held = (share * 1.4 + noise(seed, index)) % 1;
      const spot = drip(index, held);

      kit.trail(
        drip(index, Math.max(0, held - 0.08)),
        spot,
        size * 0.08,
        colour,
        decay(held) * strength,
      );
      kit.glow(spot, size * 0.12, lighten(colour, 0.3), decay(held) * strength, 0.6);
    }
  };
}
