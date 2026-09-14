import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { decay, lighten, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, chevron, dome } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, reachOf, toward } from './shapes';

/**
 * The shapes that mend, ward or pass something along, in the battle
 * scene.
 */

/** Chevrons climbing (or, turned over, falling) in columns round the body. */
function stepping(
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  colour: string,
  way: 1 | -1,
): void {
  const at = landed(stage);
  const reach = reachOf(stage);
  const shown = Math.min(1, swell(share) + 0.2);

  kit.ripple(floorOf(at), reach * 1.1, 0.08, colour, swell(share) * 0.5);
  for (let column = 0; column < 3; column += 1) {
    const angle = (column / 3) * TAU - Math.PI / 2;
    const base: Spot = [
      at[0] + Math.cos(angle) * reach * 0.8,
      at[1],
      at[2] + Math.sin(angle) * reach * 0.8,
    ];

    for (let mark = 0; mark < 3; mark += 1) {
      const held = (share * 1.4 + mark / 3 + column * 0.17) % 1;

      chevron(
        kit,
        [base[0], Math.max(0.1, base[1] + (held * 2 - 1) * reach * way), base[2]],
        reach * 0.6,
        way,
        lighten(colour, 0.2),
        shown * Math.min(1, swell(held) * 1.8),
        reach * 0.1,
      );
    }
  }
}

const care = {
  // Health coming back: motes rising in round the body
  Mend(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.4);

    kit.pool(floor, reach * 1.4, colour, swell(share) * 0.45);
    kit.ripple(floor, reach * (1.2 - swell(share) * 0.3), 0.08, light, swell(share) * 0.6);
    for (let mote = 0; mote < many(12, weight); mote += 1) {
      const held = (share + noise(seed, mote)) % 1;
      const angle = noise(seed, mote + 20) * TAU;
      const round = reach * (1 - held) * 1.2;
      const spot: Spot = [
        at[0] + Math.cos(angle) * round,
        Math.max(0, at[1] - reach * 0.8 + held * reach * 1.8),
        at[2] + Math.sin(angle) * round,
      ];

      kit.glow(spot, reach * 0.09, light, swell(held));
      if (mote % 4 === 0) {
        kit.star(spot, reach * 0.22, 0, '#ffffff', swell(held) * 0.7);
      }
    }
  },

  // Something put up: a dome the caster stands inside
  Ward(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const shown = swell(share);
    const radius = reach * 1.4 * (0.6 + shown * 0.5);

    kit.glow([at[0], radius * 0.5, at[2]], radius, paint.color, shown * 0.15, 0);
    dome(kit, floorOf(at), radius, lighten(paint.color, 0.3), shown * 0.8);
  },

  // A pane of coloured glass stood up in front of the side it is for
  Screen(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const up = Math.min(1, share * 3);
    // Held bright and taken away at the end, so it reads as a wall rather than a flash
    const alpha = share < 0.8 ? 0.55 + up * 0.35 : decay(share) * 4.5;
    const foot = aside(kit, floorOf(at), 0, 0, -reach * 1.2);
    const wide = reach * 1.8;
    const height = reach * 3.2 * up;

    kit.panel(
      [
        aside(kit, foot, -wide, height),
        aside(kit, foot, wide, height),
        aside(kit, foot, wide),
        aside(kit, foot, -wide),
      ],
      colour,
      alpha,
    );
    // The light running across its face, which says glass rather than paper
    if (up >= 1) {
      const x = (((share - 0.33) / 0.67) * 2 - 1) * wide;

      kit.ribbon(
        [aside(kit, foot, x), aside(kit, foot, x + reach * 0.9, height)],
        reach * 0.16,
        lighten(colour, 0.5),
        alpha * 0.5,
      );
    }
  },

  // What it takes, going home: motes arcing back to the caster
  Drain(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;

    kit.ring(at, reach * (1.2 - swell(share) * 0.6), 0.08, lighten(colour, 0.3), decay(share));
    kit.glow(stage.source, reach * 0.5, colour, swell(share) * 0.4, 0.5);
    for (let mote = 0; mote < many(8, weight); mote += 1) {
      const held = (share * 1.3 + noise(seed, mote) * 0.5) % 1;
      const height = reach * (0.4 + noise(seed, mote + 9) * 0.5);
      const side = spread(seed, mote + 20) * reach * 0.4;
      const along = (through: number): Spot =>
        aside(
          kit,
          toward(at, stage.source, through),
          side * (1 - through),
          Math.sin(Math.PI * through) * height,
        );
      const spot = along(held);

      kit.trail(
        along(Math.max(0, held - 0.06)),
        spot,
        reach * 0.07,
        lighten(colour, 0.3),
        swell(held) * 0.6,
      );
      kit.glow(spot, reach * 0.1, lighten(colour, 0.5), swell(held) * 0.9);
    }
  },

  // A stat going up, on whoever it went up on
  Boost(kit, stage, share, { paint }) {
    stepping(kit, stage, share, paint.color, 1);
  },

  // And going down: the same picture turned over
  Drop(kit, stage, share, { paint }) {
    stepping(kit, stage, share, paint.color, -1);
  },

  // Handed on: what it was carrying lifts off it
  Relay(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const lift = aside(kit, at, 0, reach * 2.4 * swell(share));

    kit.glow(lift, reach * 0.4, lighten(colour, 0.3), 1 - share * 0.4, 0.9);
    kit.ring(lift, reach * (0.5 + share * 0.7), 0.1, lighten(colour, 0.4), decay(share) * 0.8);
    for (let mote = 0; mote < 5; mote += 1) {
      kit.glow(
        aside(
          kit,
          at,
          spread(seed, mote) * reach * (0.4 + share),
          share * reach * 1.2,
          spread(seed, mote + 4) * reach * 0.6,
        ),
        reach * 0.07,
        colour,
        decay(share) * 0.7,
      );
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default care;
