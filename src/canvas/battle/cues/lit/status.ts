import { Statuses } from '../../../../data/ids/status';
import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../../moves/__painted';
import { decay, lighten, mix, noise, spread, swell } from '../../moves/__paint';
import { TAU, bolt, chevron, dome, gathering, sparks } from '../../moves/lit/pieces';
import { aside } from '../../moves/lit/shapes';
import { LIFT } from '../shapes';
import {
  type LitCue,
  footOf,
  headOf,
  litBitten,
  litOrbiting,
  litRising,
  litStalled,
  sizeOf,
} from './shapes';

/**
 * What each status looks like in the battle scene, as it lands and each
 * time it does something. The same pictures as the painted cues beside
 * this folder, stood round the pokemon in depth.
 */

/** Rings laid level round the body at heights, the back half hidden by it */
function levelRings(
  kit: EffectBatch,
  stage: LitStage,
  radius: number,
  heights: number[],
  colour: string,
  alpha: number,
): void {
  kit.near(0);
  for (const height of heights) {
    kit.ripple(
      [stage.source[0], stage.source[1] + height, stage.source[2]],
      radius,
      0.14,
      colour,
      alpha,
    );
  }
}

/** Chevrons climbing (`way` 1) or falling (-1) through a spot */
function climbing(
  kit: EffectBatch,
  at: Spot,
  size: number,
  count: number,
  share: number,
  way: 1 | -1,
  colour: string,
  alpha: number,
): void {
  for (let mark = 0; mark < count; mark += 1) {
    const held = (share * 1.4 + mark / count) % 1;

    chevron(
      kit,
      aside(kit, at, 0, (held * 2 - 1) * size * way),
      size,
      way,
      lighten(colour, 0.2),
      alpha * Math.min(1, swell(held) * 1.8),
      size * 0.14,
    );
  }
}

/** A heart facing the camera, with its glow */
function heartAt(kit: EffectBatch, spot: Spot, size: number, colour: string, alpha: number): void {
  kit.glow(spot, size * 1.2, colour, alpha * 0.35, 0.2);
  kit.heart(spot, size, 0, lighten(colour, 0.15), alpha);
}

const poisonDeep = litRising(12, 5, 'bubble');

export const LIT_STATUS: Partial<Record<Statuses, LitCue>> = {
  [Statuses.Poisoned]: litRising(7, 3, 'bubble'),
  [Statuses.BadlyPoisoned]: (kit, stage, share, colour, strength) => {
    kit.pool(footOf(stage), sizeOf(stage) * 1.6, '#1a0a24', swell(share) * 0.45 * strength, {
      add: 0,
    });
    poisonDeep(kit, stage, share, colour, strength);
  },

  // Flames licking up round it, and embers
  [Statuses.Burned]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const at = stage.source;
    const shown = swell(share) * strength;
    const hot = mix(colour, '#ffd84a', 0.6);

    kit.pool(footOf(stage), size * 1.5, colour, shown * 0.5);
    for (let lick = 0; lick < 8; lick += 1) {
      const rise = (share * 1.8 + noise(11, lick)) % 1;
      const angle = (lick / 8) * TAU + noise(11, lick + 5);
      const round = size * 0.6 * (1 - rise * 0.5);

      kit.glow(
        [
          at[0] + Math.cos(angle) * round,
          Math.max(0, at[1] - size * 0.7 + rise * size * 1.8),
          at[2] + Math.sin(angle) * round,
        ],
        size * 0.3 * (1 - rise * 0.7),
        rise < 0.4 ? hot : colour,
        swell(rise) * shown,
        0.3,
      );
    }
    for (let ember = 0; ember < 6; ember += 1) {
      kit.glow(
        aside(
          kit,
          at,
          spread(11, ember + 20) * size * (0.4 + share),
          share * size * 1.6,
          spread(11, ember + 30) * size * 0.6,
        ),
        size * 0.06,
        hot,
        decay(share) * strength,
      );
    }
  },

  // Arcs crackling across the body
  [Statuses.Paralyzed]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const at = stage.source;
    const flick = Math.floor(share * 12);

    for (let arc = 0; arc < 2; arc += 1) {
      const angle = noise(13, arc) * TAU + share * 2;

      bolt(
        kit,
        aside(kit, at, -Math.cos(angle) * size, -Math.sin(angle) * size),
        aside(kit, at, Math.cos(angle) * size, Math.sin(angle) * size),
        arc + 1 + flick * 7,
        size,
        size * 0.12,
        colour,
        Math.min(1, decay(share) * 1.2) * strength,
      );
    }
    sparks(kit, at, size * 1.1, 5, 13, share, lighten(colour, 0.5), decay(share) * strength);
  },

  // Crystals grown up out of the floor round it
  [Statuses.Frozen]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const floor = footOf(stage);
    const shown = swell(share) * strength;
    const ice = lighten(colour, 0.4);
    const grown = Math.min(1, share * 3);

    kit.pool(floor, size * 1.6, '#e6f7ff', shown * 0.35, { add: 0.5 });
    kit.ripple(floor, size * (1 + share * 0.4), 0.15, ice, shown * 0.7);
    for (let crystal = 0; crystal < 6; crystal += 1) {
      const angle = (crystal / 6) * TAU + noise(7, crystal);
      const round = size * (0.9 + noise(7, crystal + 3) * 0.3);
      const tall = size * 0.45 * (0.6 + noise(7, crystal + 6) * 0.6) * grown;

      kit.shard(
        [floor[0] + Math.cos(angle) * round, tall, floor[2] + Math.sin(angle) * round],
        tall,
        spread(7, crystal + 9) * 0.3,
        ice,
        shown,
        { add: 0.2 },
      );
    }
    kit.star(aside(kit, stage.source, size * 0.5, size * 0.6), size * 0.4, 0, '#ffffff', shown);
  },

  // Puffs lifting off the head one after another
  [Statuses.Sleeping]: (kit, stage, share, colour, strength) => {
    const head = headOf(kit, stage);
    const size = sizeOf(stage);

    for (let puff = 0; puff < 3; puff += 1) {
      const held = (share * 1.3 + puff * 0.33) % 1;
      const spot = aside(kit, head, held * size * 0.6, held * size * 1.2);

      kit.glow(spot, size * 0.3 * held, colour, swell(held) * 0.3 * strength, 0.2);
      kit.ring(
        spot,
        size * (0.05 + 0.3 * held),
        0.25,
        lighten(colour, 0.3),
        swell(held) * 0.8 * strength,
      );
    }
  },

  [Statuses.Confused]: litOrbiting(3),

  [Statuses.Flinched]: (kit, stage, share, colour, strength) => {
    const head = headOf(kit, stage);
    const size = sizeOf(stage);

    kit.star(head, size * (0.4 + share * 0.5), 0.3, lighten(colour, 0.3), decay(share) * strength);
    sparks(kit, head, size * (0.6 + share), 6, 23, share, colour, decay(share) * strength);
  },

  [Statuses.Raging]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    kit.pool(footOf(stage), size * 1.6, colour, decay(share) * 0.5 * strength);
    kit.glow(stage.source, size * (0.8 + share * 0.6), colour, decay(share) * 0.6 * strength, 0.4);
    sparks(
      kit,
      stage.source,
      size * (0.8 + share * 0.8),
      8,
      29,
      share,
      lighten(colour, 0.3),
      decay(share) * strength,
    );
  },

  [Statuses.Infatuated]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    for (let beat = 0; beat < 3; beat += 1) {
      const held = (share * 1.2 + beat * 0.3) % 1;

      heartAt(
        kit,
        aside(
          kit,
          stage.source,
          spread(31, beat) * size * 0.8,
          held * size * 2,
          spread(31, beat + 5) * size * 0.4,
        ),
        size * 0.4 * (0.6 + held * 0.5),
        colour,
        swell(held) * strength,
      );
    }
  },

  [Statuses.Seeding]: litRising(6, 37, 'leaf'),

  // The doll standing in for it: shells round the body
  [Statuses.Substituted]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    kit.near(0);
    for (let shell = 0; shell < 2; shell += 1) {
      dome(
        kit,
        footOf(stage),
        size * (1.2 + shell * 0.3) * (0.7 + share * 0.4),
        colour,
        swell(share) * (0.9 - shell * 0.3) * strength,
      );
    }
  },

  // Coils round the body, tightening as they arrive
  [Statuses.Trapped]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    for (let coil = 0; coil < 3; coil += 1) {
      const held = (share * 1.2 + coil * 0.3) % 1;

      levelRings(
        kit,
        stage,
        size * (1.3 - held * 0.5),
        [(held - 0.5) * size],
        colour,
        swell(held) * 0.9 * strength,
      );
    }
  },

  // Nothing left in it: everything falls
  [Statuses.Recharging]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    for (let drop = 0; drop < 4; drop += 1) {
      const held = (share * 1.3 + noise(53, drop)) % 1;
      const spot = aside(
        kit,
        stage.source,
        spread(53, drop + 7) * size * 0.9,
        -held * size,
        spread(53, drop + 9) * size * 0.4,
      );

      kit.glow(
        [spot[0], Math.max(0, spot[1]), spot[2]],
        size * 0.12,
        colour,
        decay(held) * 0.9 * strength,
        0.4,
      );
    }
  },

  // Asleep on its feet: a slow ring settling over it
  [Statuses.Dormant]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    kit.ring(stage.source, size * (1.8 - share * 0.7), 0.1, colour, swell(share) * 0.8 * strength);
    kit.ripple(
      footOf(stage),
      size * (1.8 - share * 0.7),
      0.1,
      colour,
      swell(share) * 0.5 * strength,
    );
  },

  // Taking it: rings and motes drawn inward
  [Statuses.Biding]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    for (let pull = 0; pull < 3; pull += 1) {
      const held = (share * 1.4 + pull * 0.33) % 1;

      kit.ring(stage.source, size * 2 * (1 - held), 0.1, colour, swell(held) * 0.9 * strength);
    }
    gathering(kit, stage.source, size * 2, 6, 59, share, lighten(colour, 0.3));
  },

  [Statuses.FocusEnergy]: (kit, stage, share, colour, strength) => {
    climbing(kit, stage.source, sizeOf(stage), 3, share, 1, colour, swell(share) * strength);
    kit.pool(footOf(stage), sizeOf(stage) * 1.4, colour, swell(share) * 0.4 * strength);
  },

  // A guard: a dome round it
  [Statuses.Protected]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const radius = size * (1.6 + swell(share) * 0.3);

    kit.near(0);
    kit.glow(
      [stage.source[0], radius * 0.5, stage.source[2]],
      radius,
      colour,
      swell(share) * 0.2 * strength,
      0,
    );
    dome(kit, footOf(stage), radius, lighten(colour, 0.3), swell(share) * strength);
  },

  [Statuses.Enduring]: (kit, stage, share, colour, strength) => {
    kit.glow(stage.source, sizeOf(stage) * 0.8, colour, swell(share) * 0.4 * strength, 0.3);
    climbing(kit, stage.source, sizeOf(stage), 2, 1 - share, -1, colour, swell(share) * strength);
  },

  // Under it rather than over it: what a hold takes away is the ground
  [Statuses.Cornered]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    kit.pool(footOf(stage), size * 1.8, '#140e1a', swell(share) * 0.5 * strength, { add: 0 });
    kit.ripple(
      footOf(stage),
      size * (1.9 - share * 0.5),
      0.12,
      lighten(colour, 0.3),
      swell(share) * 0.9 * strength,
    );
  },

  [Statuses.Nightmared]: (kit, stage, share, colour, strength) => {
    const head = headOf(kit, stage);
    const size = sizeOf(stage);

    kit.glow(head, size * (0.7 + swell(share) * 0.6), '#0a0612', swell(share) * 0.6 * strength, 0, {
      add: 0,
    });
    kit.glow(head, size * (0.5 + swell(share) * 0.4), colour, swell(share) * 0.8 * strength, 0.1);
    for (let mote = 0; mote < 6; mote += 1) {
      kit.glow(
        aside(
          kit,
          head,
          spread(83, mote) * size * (0.5 + share),
          spread(83, mote + 4) * size * (0.5 + share),
          spread(83, mote + 8) * size * 0.5,
        ),
        size * 0.08,
        lighten(colour, 0.4),
        decay(share) * 0.8 * strength,
      );
    }
  },

  // A count: rings arriving one after another over the head
  [Statuses.Perishing]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const head = headOf(kit, stage);

    for (let beat = 0; beat < 3; beat += 1) {
      const held = (share * 1.3 + beat * 0.33) % 1;

      kit.ring(
        head,
        size * (0.5 + held * 1.4),
        0.1,
        lighten(colour, 0.3),
        decay(held) * 0.9 * strength,
      );
    }
  },

  // Two of them tied together
  [Statuses.Bonded]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const alpha = swell(share) * 0.9 * strength;
    const knots = [aside(kit, stage.source, -size * 0.6), aside(kit, stage.source, size * 0.6)];

    for (const knot of knots) {
      kit.ring(knot, size * 0.8, 0.12, lighten(colour, 0.3), alpha);
    }
    kit.ribbon(knots, size * 0.1, colour, alpha);
  },

  // A nail driven down into it
  [Statuses.Cursed]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const alpha = swell(share) * strength;

    kit.ribbon(
      [
        aside(kit, stage.source, 0, size * (2.2 - share * 1.2)),
        aside(kit, stage.source, 0, size * 0.2),
      ],
      size * 0.16,
      lighten(colour, 0.2),
      alpha,
      0,
      { add: 0.3 },
    );
    kit.ring(stage.source, size * (1.4 - share * 0.4), 0.1, colour, alpha * 0.8);
    kit.glow(stage.source, size, '#0a0612', alpha * 0.4, 0, { add: 0 });
  },

  [Statuses.Encored]: (kit, stage, share, colour, strength) => {
    climbing(
      kit,
      headOf(kit, stage),
      sizeOf(stage) * 0.9,
      3,
      share,
      1,
      colour,
      swell(share) * strength,
    );
  },

  // Pointed out: an eye opening over it
  [Statuses.Identified]: (kit, stage, share, colour, strength) => {
    const head = headOf(kit, stage);
    const size = sizeOf(stage);

    kit.oval(
      head,
      size * (0.4 + share * 0.6),
      size * (0.2 + share * 0.3),
      0,
      0.15,
      lighten(colour, 0.3),
      swell(share) * strength,
    );
    kit.glow(head, size * 0.25, lighten(colour, 0.5), swell(share) * strength);
  },

  [Statuses.Taunted]: (kit, stage, share, colour, strength) => {
    climbing(
      kit,
      headOf(kit, stage),
      sizeOf(stage) * 0.8,
      2,
      1 - share,
      -1,
      colour,
      swell(share) * strength,
    );
  },

  [Statuses.Tormented]: (kit, stage, share, colour, strength) => {
    kit.ring(
      headOf(kit, stage),
      sizeOf(stage) * (1.2 - share * 0.8),
      0.14,
      lighten(colour, 0.3),
      swell(share) * strength,
    );
  },

  // A cage of bars round it
  [Statuses.Imprisoned]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const floor = footOf(stage);
    const alpha = swell(share) * 0.9 * strength;

    kit.near(0);
    for (let bar = 0; bar < 6; bar += 1) {
      const angle = (bar / 6) * TAU;
      const foot: Spot = [
        floor[0] + Math.cos(angle) * size,
        0.05,
        floor[2] + Math.sin(angle) * size,
      ];

      kit.ribbon(
        [foot, [foot[0], stage.source[1] + size * 1.1, foot[2]]],
        size * 0.1,
        lighten(colour, 0.2),
        alpha,
      );
    }
    kit.ripple([floor[0], stage.source[1] + size * 1.1, floor[2]], size, 0.1, colour, alpha);
  },

  // Down into the floor, where the recovery comes from
  [Statuses.Rooted]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const floor = footOf(stage);
    const alpha = swell(share) * strength;

    kit.ripple(floor, size * (0.6 + share * 0.8), 0.1, colour, alpha * 0.8);
    for (let root = 0; root < 5; root += 1) {
      const angle = (root / 5) * TAU + noise(29, root);
      const out = size * (0.6 + share * 0.9);

      kit.ribbon(
        [
          [floor[0], 0.05, floor[2]],
          [
            floor[0] + Math.cos(angle) * out * 0.5,
            0.05,
            floor[2] + Math.sin(angle) * out * 0.5 + spread(29, root) * size * 0.2,
          ],
          [floor[0] + Math.cos(angle) * out, 0.05, floor[2] + Math.sin(angle) * out],
        ],
        size * 0.12,
        mix(colour, '#3b2a14', 0.35),
        alpha,
        0,
        { add: 0 },
      );
    }
  },

  // The bubble the mainline draws, swelling until it goes
  [Statuses.Drowsy]: (kit, stage, share, colour, strength) => {
    kit.bubble(
      headOf(kit, stage),
      sizeOf(stage) * (0.3 + share * 0.7),
      lighten(colour, 0.3),
      swell(share) * strength,
    );
  },

  // Everything coming to it
  [Statuses.Centered]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    for (let pull = 0; pull < 2; pull += 1) {
      const held = (share * 1.3 + pull * 0.5) % 1;
      const radius = size * (2.2 - held * 1.5);

      kit.ring(stage.source, radius, 0.1, lighten(colour, 0.3), swell(held) * 0.9 * strength);
      kit.ripple(footOf(stage), radius, 0.1, colour, swell(held) * 0.5 * strength);
    }
  },

  // A shell, and what came at it going back out
  [Statuses.Coated]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    kit.near(0);
    dome(kit, footOf(stage), size * 1.7, colour, swell(share) * 0.8 * strength);
    kit.near(size);
    climbing(
      kit,
      headOf(kit, stage, LIFT * 1.4),
      size * 0.7,
      1,
      share,
      1,
      colour,
      swell(share) * strength,
    );
  },

  // Waiting to take it: a mark over the head that darts aside
  [Statuses.Snatching]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const spot = aside(kit, headOf(kit, stage), share * size * 1.4);

    kit.trail(
      aside(kit, spot, -size * 0.6),
      spot,
      size * 0.1,
      colour,
      swell(share) * 0.5 * strength,
    );
    kit.star(spot, size * 0.45, share * 4, lighten(colour, 0.3), swell(share) * strength);
  },

  // Held under it, waiting on whatever knocks it out
  [Statuses.Grudging]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const floor = footOf(stage);

    kit.pool(floor, size * 1.4, '#0a0612', swell(share) * 0.4 * strength, { add: 0 });
    kit.ripple(
      floor,
      size * (1.4 - swell(share) * 0.4),
      0.12,
      lighten(colour, 0.3),
      swell(share) * 0.9 * strength,
    );
    for (let mote = 0; mote < 5; mote += 1) {
      kit.glow(
        aside(
          kit,
          floor,
          spread(101, mote) * size * 1.2,
          share * size * 1.4,
          spread(101, mote + 4) * size * 0.8,
        ),
        size * 0.09,
        colour,
        decay(share) * 0.8 * strength,
        0.5,
      );
    }
  },

  // Heard rather than worn: rings leaving it
  [Statuses.Uproaring]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.4 + pulse * 0.33) % 1;
      const radius = size * (0.5 + held * 1.8);

      kit.ring(stage.source, radius, 0.08, lighten(colour, 0.3), decay(held) * 0.9 * strength);
      kit.ripple(footOf(stage), radius, 0.08, colour, decay(held) * 0.5 * strength);
    }
  },

  [Statuses.Helped]: (kit, stage, share, colour, strength) => {
    climbing(kit, stage.source, sizeOf(stage) * 0.9, 2, share, 1, colour, swell(share) * strength);
  },

  // Asleep and staying asleep: the puffs held steady
  [Statuses.Comatose]: (kit, stage, share, colour, strength) => {
    const head = headOf(kit, stage);
    const size = sizeOf(stage);

    for (let puff = 0; puff < 2; puff += 1) {
      kit.ring(
        aside(kit, head, puff * size * 0.6, puff * size * 0.5),
        size * 0.3,
        0.25,
        lighten(colour, 0.3),
        swell(share) * 0.8 * strength,
      );
    }
  },
};

export const LIT_TRIGGERS: Partial<Record<Statuses, LitCue>> = {
  // A Z going up with it, so a blocked cast is not mistaken for falling asleep again
  [Statuses.Sleeping]: litStalled((kit, stage, share, colour, strength) => {
    const at = headOf(kit, stage, LIFT * 1.7);
    const size = sizeOf(stage) * (0.5 + share * 0.4);

    kit.ribbon(
      [
        aside(kit, at, -size, size),
        aside(kit, at, size, size),
        aside(kit, at, -size, -size),
        aside(kit, at, size, -size),
      ],
      size * 0.3,
      lighten(colour, 0.3),
      swell(share) * strength,
    );
  }),

  // The whole body crackling
  [Statuses.Paralyzed]: litStalled((kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const flick = Math.floor(share * 12);

    for (let arc = 0; arc < 4; arc += 1) {
      const angle = (arc / 4) * TAU + share;

      bolt(
        kit,
        stage.source,
        aside(kit, stage.source, Math.cos(angle) * size * 1.6, Math.sin(angle) * size * 1.2),
        arc + 3 + flick * 5,
        size,
        size * 0.12,
        colour,
        Math.min(1, decay(share) * 1.3) * strength,
      );
    }
  }),

  // Frozen solid: a block of ice round it that holds
  [Statuses.Frozen]: litStalled((kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);
    const held = share < 0.7 ? 1 : decay((share - 0.7) / 0.3);

    kit.near(0);
    dome(kit, footOf(stage), size * 1.3, lighten(colour, 0.4), held * 0.8 * strength);
    kit.glow(
      [stage.source[0], size * 0.6, stage.source[2]],
      size * 1.3,
      '#e6f7ff',
      held * 0.25 * strength,
      0,
    );
  }),

  [Statuses.Flinched]: litStalled(),
  [Statuses.Recharging]: litStalled(),
  [Statuses.Dormant]: litStalled(),

  // It went for somebody it likes instead
  [Statuses.Infatuated]: litStalled((kit, stage, share, colour, strength) => {
    heartAt(
      kit,
      headOf(kit, stage, LIFT * 1.6),
      sizeOf(stage) * 0.45 * swell(share),
      colour,
      swell(share) * strength,
    );
  }),

  // It hit itself: the burst on the body, the stars still going round
  [Statuses.Confused]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    kit.star(
      stage.source,
      size * (0.6 + share),
      0.2,
      lighten(colour, 0.4),
      decay(share) * strength,
    );
    sparks(
      kit,
      stage.source,
      size * (0.6 + share * 1.2),
      7,
      17,
      share,
      colour,
      decay(share) * strength,
    );
    litOrbiting(3)(kit, stage, share, colour, strength);
  },

  // The squeeze, rather than the coils arriving
  [Statuses.Trapped]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    levelRings(
      kit,
      stage,
      size * (1.4 - swell(share) * 0.7),
      [-size * 0.5, 0, size * 0.5],
      colour,
      0.9 * strength,
    );
  },

  // What it kept, drawn going in
  [Statuses.Biding]: (kit, stage, share, colour, strength) => {
    const size = sizeOf(stage);

    kit.glow(stage.source, size * (0.4 + share * 0.5), colour, swell(share) * 0.6 * strength, 0.6);
    gathering(kit, stage.source, size * 2.2, 8, 59, share, lighten(colour, 0.3));
  },

  [Statuses.Cursed]: litBitten(7, 89),
  [Statuses.Nightmared]: litBitten(7, 97),
  [Statuses.Poisoned]: litBitten(6, 61),
  [Statuses.BadlyPoisoned]: litBitten(9, 67),
  [Statuses.Burned]: litBitten(6, 71),
  [Statuses.Seeding]: litBitten(5, 73),
};
