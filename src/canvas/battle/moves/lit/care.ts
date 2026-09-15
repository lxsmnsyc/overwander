import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import {
  BLADES,
  DOLL_DROP,
  FLOP_HOPS,
  SCHEME_GATHER,
  SHELL_CELL,
  dollLift,
  shellCells,
  shellFlash,
  wagOf,
} from '../effect/care';
import { RAINBOW } from '../effect/legends';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, chevron, dome, gathering, smoke } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  staged,
  thrown,
  toward,
} from './shapes';

/**
 * The shapes that mend, ward or pass something along, in the battle
 * scene.
 */

/** A hexagon's outline on the picture round a spot, flat along its top */
function hexagon(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  const path: Spot[] = [];

  for (let corner = 0; corner <= 6; corner += 1) {
    const angle = (corner / 6) * TAU;

    path.push(aside(kit, at, Math.cos(angle) * size, Math.sin(angle) * size));
  }
  kit.ribbon(path, size * 0.12, colour, alpha);
}

/** A sword standing on the picture: a blade pointing up, a cross-guard and a glint at the tip */
function sword(kit: EffectBatch, at: Spot, length: number, colour: string, alpha: number): void {
  kit.streak(
    aside(kit, at, 0, length * 0.15),
    length * 0.5,
    length * 0.07,
    Math.PI / 2,
    '#e8eef5',
    alpha,
    {
      add: 0.3,
    },
  );
  kit.streak(aside(kit, at, 0, -length * 0.3), length * 0.16, length * 0.035, 0, colour, alpha);
  kit.glow(aside(kit, at, 0, length * 0.65), length * 0.08, '#ffffff', alpha, 1);
}

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

  // Water turning about the pokemon: three hoops on three axes, each passing through the flat at a different moment
  Gyro(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    // Up quickly and held: what it puts round the pokemon stays there
    const up = Math.min(1, share * 4);
    const alpha = share < 0.85 ? 0.55 + up * 0.4 : decay(share) * 6;
    const radius = reach * 1.3 * up;
    const water = lighten(paint.color, 0.25);

    for (let hoop = 0; hoop < 3; hoop += 1) {
      const axis = (hoop / 3) * Math.PI;
      const tilt = share * Math.PI * 2.4 + (hoop / 3) * Math.PI;
      const ux = Math.cos(axis);
      const uz = Math.sin(axis);
      const path: Spot[] = [];

      for (let step = 0; step <= 24; step += 1) {
        const turn = (step / 24) * TAU;
        const along = Math.cos(turn) * radius;
        const round = Math.sin(turn) * radius;

        path.push([
          at[0] + ux * along - uz * round * Math.cos(tilt),
          Math.max(0.05, at[1] + round * Math.sin(tilt)),
          at[2] + uz * along + ux * round * Math.cos(tilt),
        ]);
      }
      kit.ribbon(path, reach * 0.1, water, alpha);
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
  // A shell of hexagons thrown up round it, a flash running out from the middle as it goes up
  Shell(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const light = lighten(paint.color, 0.4);
    const up = Math.min(1, share * 4);
    const shown = share < 0.75 ? 1 : decay((share - 0.75) / 0.25);
    const radius = reach * 1.5 * (0.7 + up * 0.3);

    kit.glow(at, radius * 1.05, paint.color, shown * 0.25, 0.1);
    kit.ring(at, radius, 0.05, light, shown * 0.8);
    for (const [x, y] of shellCells(radius)) {
      const flash = shellFlash(share, Math.hypot(x, y) / radius);

      hexagon(
        kit,
        aside(kit, at, x, y),
        radius * SHELL_CELL * 0.92,
        mix(light, '#ffffff', flash),
        shown * (0.35 + flash * 0.65),
      );
    }
  },

  // A doll dropped into place, landing with a bounce and a puff of dust
  Doll(kit, stage, share, { paint, seed }) {
    const floor = floorOf(landed(stage));
    const reach = reachOf(stage);
    const colour = paint.color;
    const shade = mix(colour, '#6b5a3a', 0.35);
    const shown = late(share, 0.85);
    const body = aside(kit, floor, 0, reach * (0.7 + dollLift(share)));

    kit.pool(floor, reach * 0.9, '#140e0a', Math.min(1, share / DOLL_DROP) * 0.4 * shown, {
      add: 0,
    });
    kit.puff(body, reach * 0.7, colour, shown);
    kit.puff(aside(kit, body, 0, reach * 0.95), reach * 0.5, colour, shown);
    for (const side of [-1, 1]) {
      kit.puff(aside(kit, body, side * reach * 0.35, reach * 1.45), reach * 0.2, shade, shown);
      kit.glow(
        aside(kit, body, side * reach * 0.18, reach, -reach * 0.5),
        reach * 0.07,
        '#2a2016',
        shown,
        0,
        { add: 0 },
      );
    }
    if (share > DOLL_DROP) {
      const settled = (share - DOLL_DROP) / (1 - DOLL_DROP);

      smoke(kit, floor, reach, 4, seed, settled, mix(colour, '#b9a58a', 0.5), decay(settled) * 0.5);
    }
  },

  // Flopping about and nothing happening: a few hops of spray at its feet, and a bead of sweat
  Flop(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage);
    const drop = lighten(paint.color, 0.3);

    for (let hop = 0; hop < FLOP_HOPS; hop += 1) {
      const held = share * FLOP_HOPS - hop;

      if (held <= 0 || held >= 1) {
        continue;
      }
      kit.ripple(floor, reach * (0.4 + held * 1.2), 0.1, drop, decay(held) * 0.8);
      for (let one = 0; one < 5; one += 1) {
        kit.glow(
          thrown(
            aside(kit, floor, 0, reach * 0.1),
            seed + hop,
            one,
            held,
            reach * 0.9,
            reach * 0.8,
          ),
          reach * 0.07,
          drop,
          decay(held),
          0.7,
        );
      }
    }
    const bead = staged(share, 1.5, 0.3);

    if (bead > 0) {
      kit.glow(
        aside(kit, at, reach * 0.6, reach * (0.9 - bead * 0.4)),
        reach * 0.09,
        '#bfe6ff',
        swell(bead),
        0.6,
      );
    }
  },

  // A metronome ticking over its head, and whatever it picked going off at the end
  Wag(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.4);
    const pivot = aside(kit, at, 0, reach * 1.2);
    const shown = Math.min(1, share * 5) * late(share, 0.7);
    const swing = wagOf(share);
    const tip = aside(kit, pivot, Math.sin(swing) * reach * 1.2, Math.cos(swing) * reach * 1.2);

    kit.ribbon([pivot, tip], reach * 0.1, light, shown);
    kit.glow(tip, reach * 0.22, colour, shown, 0.8);
    kit.glow(pivot, reach * 0.12, light, shown, 0.5);
    if (share <= 0.7) {
      return;
    }
    const pick = (share - 0.7) / 0.3;

    for (let spark = 0; spark < 6; spark += 1) {
      kit.star(
        thrown(pivot, seed, spark, pick, reach * 1.6, reach * 1.2),
        reach * 0.25,
        pick * 4 + spark,
        RAINBOW[spark % RAINBOW.length],
        decay(pick),
      );
    }
  },

  // Bands of light sweeping up the pokemon that is changing, the way a shape is redrawn
  Shimmer(kit, stage, share, { paint, seed }) {
    const at = stage.source;
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.5);
    const shown = swell(share);

    kit.pool(floorOf(at), reach * 1.4, colour, shown * 0.5);
    kit.glow(at, reach * 1.1, colour, shown * 0.35, 0.3);
    for (let band = 0; band < 4; band += 1) {
      const held = (share * 1.6 + band * 0.25) % 1;

      kit.streak(
        aside(kit, at, 0, -reach * 0.9 + held * reach * 2),
        reach * 0.9 * Math.sin(Math.PI * held),
        reach * 0.05,
        0,
        light,
        shown * swell(held),
      );
    }
    for (let mote = 0; mote < 10; mote += 1) {
      const held = (share * 1.3 + noise(seed, mote)) % 1;

      kit.glow(
        aside(
          kit,
          at,
          spread(seed, mote + 10) * reach * 1.1,
          -reach * 0.9 + held * reach * 2,
          spread(seed, mote + 20) * reach * 0.5,
        ),
        reach * 0.06,
        '#ffffff',
        shown * swell(held),
        0.9,
      );
    }
  },

  // Swords circling it, then drawn in and crossed over its head
  Blades(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = Math.min(1, share * 4) * late(share, 0.75);
    const closing = Math.max(0, (share - 0.55) / 0.45);

    kit.pool(floorOf(at), reach * 1.6, colour, shown * 0.5);
    for (let blade = 0; blade < BLADES; blade += 1) {
      const angle = (blade / BLADES) * TAU + share * Math.PI * 3;
      const round = reach * 1.3 * (1 - closing * 0.6);

      sword(
        kit,
        [
          at[0] + Math.cos(angle) * round,
          at[1] + Math.sin(share * TAU + blade) * reach * 0.2,
          at[2] + Math.sin(angle) * round,
        ],
        reach * 1.3,
        colour,
        shown,
      );
    }
    if (closing <= 0) {
      return;
    }
    kit.star(
      aside(kit, at, 0, reach * (1.6 + closing * 0.6)),
      reach * (0.6 + closing * 0.6),
      0,
      '#ffffff',
      swell(closing),
    );
    kit.ring(at, reach * (0.6 + closing * 1.4), 0.08, lighten(colour, 0.3), decay(closing));
  },

  // Aura winding up round it in two strands
  Dance(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = Math.min(1, share * 4) * late(share, 0.7);
    const risen = Math.min(1, share * 2.5);

    kit.pool(floor, reach * 1.6, colour, shown * 0.5);
    for (let strand = 0; strand < 2; strand += 1) {
      const path: Spot[] = [];

      for (let step = 0; step <= 20; step += 1) {
        const along = step / 20;
        const turn = along * TAU * 2 + share * Math.PI * 3 + strand * Math.PI;
        const round = reach * (1.1 - along * 0.5);

        path.push([
          floor[0] + Math.cos(turn) * round,
          along * reach * 3.2 * risen,
          floor[2] + Math.sin(turn) * round,
        ]);
      }
      kit.ribbon(path, reach * 0.16, lighten(colour, 0.2), shown * 0.85, share * 10, { add: 0.8 });
    }
    for (let mote = 0; mote < 8; mote += 1) {
      const held = (share * 1.2 + noise(seed, mote)) % 1;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, mote + 10) * reach,
          held * reach * 3.4,
          spread(seed, mote + 20) * reach * 0.6,
        ),
        reach * 0.07,
        lighten(colour, 0.5),
        shown * swell(held),
        0.9,
      );
    }
  },

  // A metal sheen running across the body, and a glint where it ends
  Sheen(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = Math.min(1, share * 4) * late(share, 0.75);
    const sweep = Math.min(1, share / 0.6);
    const across = (sweep * 2 - 1) * reach * 1.2;

    kit.glow(at, reach * 1.1, colour, shown * 0.45, 0.2);
    kit.ring(at, reach * 1.05, 0.05, lighten(colour, 0.6), shown * 0.6);
    // Leaning the way light off metal does
    kit.streak(
      aside(kit, at, across),
      reach * 0.9,
      reach * 0.14,
      Math.PI * 0.35,
      '#ffffff',
      shown * swell(sweep),
    );
    kit.streak(
      aside(kit, at, across - reach * 0.35),
      reach * 0.7,
      reach * 0.06,
      Math.PI * 0.35,
      lighten(colour, 0.6),
      shown * swell(sweep) * 0.7,
    );
    if (share > 0.6) {
      const glint = swell((share - 0.6) / 0.4);

      kit.star(aside(kit, at, reach * 0.7, reach * 0.6), reach * 0.5 * glint, 0, '#ffffff', glint);
    }
  },

  // Copies of it sliding out to either side and back
  Mirage(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const out = swell(share);

    kit.ring(at, reach * (1.2 - out * 0.4), 0.06, lighten(colour, 0.4), out * 0.5);
    for (const side of [-1, 1]) {
      for (let copy = 1; copy <= 2; copy += 1) {
        const spot = aside(kit, at, side * copy * reach * 0.9 * out);

        kit.glow(spot, reach * 0.8, colour, out * (0.35 - copy * 0.1), 0.2);
        kit.oval(spot, reach * 0.7, reach, 0, 0.12, lighten(colour, 0.3), out * (0.7 - copy * 0.2));
      }
    }
  },

  // Thought gathering into its head under halos, then a pulse off it
  Scheme(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.5);
    const head = aside(kit, at, 0, reach * 0.9);
    const gather = Math.min(1, share / SCHEME_GATHER);
    const kept = late(share, 0.8);

    if (share < SCHEME_GATHER) {
      gathering(kit, head, reach * 1.6, 12, seed, share * 1.5, light);
    }
    kit.glow(head, reach * (0.2 + gather * 0.35), light, Math.min(1, gather + 0.2) * kept, 0.9);
    for (let halo = 0; halo < 3; halo += 1) {
      kit.oval(
        aside(kit, head, 0, reach * 0.35),
        reach * (0.5 + halo * 0.2),
        reach * (0.16 + halo * 0.06),
        0,
        0.12,
        colour,
        gather * kept * (0.8 - halo * 0.2),
      );
    }
    if (share <= SCHEME_GATHER) {
      return;
    }
    const pulse = (share - SCHEME_GATHER) / (1 - SCHEME_GATHER);

    kit.ring(head, reach * (0.3 + pulse * 1.6), 0.08, light, decay(pulse));
    kit.star(head, reach * (0.5 + pulse * 0.5), 0, '#ffffff', decay(pulse));
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default care;
