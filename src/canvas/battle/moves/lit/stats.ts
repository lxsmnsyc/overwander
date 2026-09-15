import { Types } from '../../../../data/constants/types';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { BEE } from '../effect/care';
import { type EffectShape, many } from '../effect/shapes';
import { FOG, HIVE_COLUMNS, HIVE_ROWS, SMOKE, STACK_LANDS, settle, showing } from '../effect/stats';
import { TAU, bolt, sickle, smoke, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, reachOf, toward } from './shapes';

/** The stat moves drawn as what the pokemon does, in the battle scene */
const stats = {
  // Speed lines streaking past it and afterimages left behind
  Haste(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = showing(share, 4, 0.75);

    for (let copy = 1; copy <= 2; copy += 1) {
      kit.glow(
        aside(kit, at, -copy * reach * 0.6 * swell(share)),
        reach * 0.8,
        colour,
        shown * (0.4 - copy * 0.12),
        0.2,
      );
    }
    for (let line = 0; line < 6; line += 1) {
      const held = (share * 2.5 + noise(seed, line)) % 1;
      const x = -reach * 1.8 + held * reach * 3.6;
      const up = spread(seed, line + 10) * reach * 1.1;

      kit.trail(
        aside(kit, at, x - reach * 0.9, up),
        aside(kit, at, x, up),
        reach * 0.05,
        lighten(colour, 0.5),
        shown * swell(held),
      );
    }
  },

  // Rubbed to a shine: a ring working round over it and glints popping one after another
  Polish(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = showing(share, 4, 0.8);
    const turn = share * Math.PI * 6;

    kit.glow(at, reach * 1.1, colour, shown * 0.35, 0.2);
    kit.ring(
      aside(kit, at, Math.cos(turn) * reach * 0.5, Math.sin(turn) * reach * 0.3),
      reach * 0.35,
      0.12,
      lighten(colour, 0.5),
      shown * 0.8,
    );
    for (let glint = 0; glint < 5; glint += 1) {
      const held = share * 1.6 - glint * 0.2;

      if (held <= 0 || held >= 1) {
        continue;
      }
      kit.star(
        aside(kit, at, spread(seed, glint) * reach, spread(seed, glint + 10) * reach),
        reach * 0.45 * swell(held),
        glint,
        '#ffffff',
        swell(held),
      );
    }
  },

  // Two hard throbs: the body swelling with power and spokes snapping out
  Flex(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.4);

    for (let beat = 0; beat < 2; beat += 1) {
      const held = share * 2 - beat;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const pump = swell(Math.min(1, held * 2));

      kit.glow(at, reach * (0.9 + pump * 0.5), colour, pump * 0.55, 0.4);
      kit.ring(at, reach * (1 + held * 0.9), 0.08, light, decay(held) * 0.8);
      kit.ripple(floorOf(at), reach * (0.8 + held * 1.2), 0.08, colour, decay(held) * 0.5);
      sparks(kit, at, reach * (1.2 + held * 0.8), 8, seed + beat, held, light, decay(held));
    }
  },

  // Rings rising off its head as it calls out
  Howl(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const head = aside(kit, at, 0, reach * 0.8);

    kit.glow(head, reach * 0.5, colour, swell(share) * 0.5, 0.5);
    for (let wave = 0; wave < 4; wave += 1) {
      const held = share * 1.6 - wave * 0.2;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const radius = reach * (0.4 + held * 0.8);

      kit.oval(
        aside(kit, head, 0, reach * held * 2),
        radius,
        radius * 0.35,
        0,
        0.1,
        lighten(colour, 0.3),
        decay(held),
      );
    }
  },

  // Empty thought bubbles floating up off its head: whatever was there is forgotten
  Blank(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const kept = showing(share, 20, 0.8);

    for (let one = 0; one < 3; one += 1) {
      const held = Math.max(0, Math.min(1, share * 1.5 - one * 0.2));

      if (held <= 0) {
        continue;
      }
      kit.bubble(
        aside(kit, at, reach * (0.3 + one * 0.35), reach * (0.8 + one * 0.55 + held * 0.3)),
        reach * (0.12 + one * 0.14) * Math.min(1, held * 3),
        lighten(paint.color, 0.3),
        kept,
      );
    }
  },

  // Stars circling it on a tilted orbit, over a glow of night sky
  Cosmos(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = showing(share, 4, 0.8);

    kit.glow(at, reach * 1.3, mix(colour, '#140c30', 0.7), shown * 0.4, 0, { add: 0 });
    for (let one = 0; one < 7; one += 1) {
      const angle = (one / 7) * TAU + share * TAU;

      kit.star(
        [
          at[0] + Math.cos(angle) * reach * 1.4,
          at[1] + Math.sin(angle) * reach * 0.3,
          at[2] + Math.sin(angle) * reach * 1.4,
        ],
        reach * 0.22,
        share * 4 + one,
        colour,
        shown * (0.6 + 0.4 * Math.sin(share * 10 + one)),
      );
    }
    for (let glint = 0; glint < 4; glint += 1) {
      kit.star(
        aside(kit, at, spread(seed, glint) * reach, spread(seed, glint + 10) * reach),
        reach * 0.15,
        0,
        '#ffffff',
        swell((share * 2 + noise(seed, glint)) % 1) * shown,
      );
    }
  },

  // Bees flying in and lining up into a wall in front of it
  Hive(kit, stage, share, { seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const kept = showing(share, 20, 0.8);

    for (let row = 0; row < HIVE_ROWS; row += 1) {
      for (let column = 0; column < HIVE_COLUMNS; column += 1) {
        const bee = row * HIVE_COLUMNS + column;
        const flying = share * 1.8 - noise(seed, bee) * 0.5;

        if (flying <= 0) {
          continue;
        }
        // In front of it, toward the camera
        const place = aside(
          kit,
          at,
          (column - (HIVE_COLUMNS - 1) / 2) * reach * 0.4,
          -(row - (HIVE_ROWS - 1) / 2) * reach * 0.45 - reach * 0.2,
          -reach * 1.1,
        );
        const from = aside(
          kit,
          place,
          spread(seed, bee + 20) * reach * 3,
          spread(seed, bee + 40) * reach * 2,
          spread(seed, bee + 60) * reach * 2,
        );
        const spot = aside(
          kit,
          toward(from, place, settle(flying)),
          Math.sin(share * 40 + bee) * reach * 0.04,
        );

        kit.glow(spot, reach * 0.12, BEE, kept, 0.4);
        kit.glow(spot, reach * 0.05, '#2a2010', kept, 0, { add: 0 });
      }
    }
  },

  // Electricity crackling in over the body as it stores up charge
  Crackle(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = showing(share, 4, 0.8);
    const flick = Math.floor(share * 16);
    const bright = shown * (flick % 3 === 2 ? 0.5 : 1);

    kit.pool(floorOf(at), reach * 1.4, colour, bright * 0.4);
    kit.glow(at, reach * (0.4 + share * 0.5), colour, shown * 0.7, 0.6);
    for (let arc = 0; arc < 3; arc += 1) {
      const angle = noise(seed + flick, arc) * TAU;

      bolt(
        kit,
        aside(kit, at, Math.cos(angle) * reach * 1.4, Math.sin(angle) * reach * 1.4),
        at,
        seed + flick * 7 + arc,
        reach * 0.5,
        reach * 0.06,
        colour,
        bright,
      );
    }
  },

  // A light glowing at its tail, pulsing, with fireflies drawn round it
  Lantern(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = showing(share, 4, 0.8);
    const lamp = aside(kit, at, -reach * 0.7, -reach * 0.3);
    const pulse = 0.75 + Math.sin(share * Math.PI * 6) * 0.25;

    kit.pool(floorOf(at), reach * 1.4, colour, shown * 0.4);
    kit.glow(lamp, reach * (0.4 + swell(share) * 0.6) * pulse, colour, shown, 1);
    kit.star(lamp, reach * 1.4 * pulse, share, lighten(colour, 0.5), shown * 0.6);
    for (let fly = 0; fly < 6; fly += 1) {
      const angle = noise(seed, fly) * TAU + share * Math.PI * 3;

      kit.glow(
        aside(kit, lamp, Math.cos(angle) * reach * 1.2, Math.sin(angle) * reach * 0.6),
        reach * 0.1,
        lighten(colour, 0.5),
        shown * swell((share * 2 + noise(seed, fly + 10)) % 1),
        0.8,
      );
    }
  },

  // Orbs dropping onto a stack over it one at a time, then taken in
  Stack(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const sink = Math.max(0, (share - 0.8) / 0.2);

    for (const [one, lands] of STACK_LANDS.entries()) {
      const fall = Math.min(1, (share - lands + 0.12) / 0.12);

      if (fall <= 0) {
        continue;
      }
      const spot = aside(
        kit,
        at,
        0,
        reach * (1 + one * 0.55) * (1 - sink) + reach * 1.2 * (1 - fall) ** 2,
      );
      const since = (share - lands) / 0.2;

      kit.glow(spot, reach * 0.32, colour, decay(sink), 0.7);
      if (since > 0 && since < 1) {
        kit.ring(spot, reach * (0.3 + since * 0.6), 0.08, lighten(colour, 0.4), decay(since));
      }
    }
  },

  // A sprout pushing up out of the ground in front of it and opening two leaves
  Sprout(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const kept = showing(share, 20, 0.8);
    const foot = aside(kit, floorOf(at), 0, 0, -reach * 0.9);
    const grow = settle(share * 2.5);
    const top = aside(kit, foot, 0, reach * 1.8 * grow);
    const open = settle((share - 0.35) * 3);
    const stem: Spot[] = [];

    for (let step = 0; step <= 6; step += 1) {
      stem.push(
        aside(
          kit,
          toward(foot, top, step / 6),
          Math.sin((Math.PI * step) / 6) * reach * 0.25 * grow,
        ),
      );
    }
    kit.glow(at, reach * (0.6 + share * 0.5), colour, swell(share) * 0.4, 0.4);
    kit.ribbon(stem, reach * 0.12, mix(colour, '#2c6a2c', 0.4), kept, 0, { add: 0 });
    if (open > 0) {
      for (const side of [-1, 1]) {
        kit.leaf(
          aside(kit, top, side * reach * 0.28 * open, -reach * 0.05),
          reach * 0.3 * open,
          side * 1.1,
          colour,
          kept,
        );
      }
    }
    for (let mote = 0; mote < 6; mote += 1) {
      const held = (share * 1.2 + noise(seed, mote)) % 1;

      kit.glow(
        aside(kit, at, spread(seed, mote + 10) * reach, held * reach * 1.6 - reach * 0.4),
        reach * 0.07,
        lighten(colour, 0.5),
        swell(held) * swell(share),
        0.8,
      );
    }
  },

  // A shell closing round it from both sides, and a glint as it hardens
  Curl(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const kept = showing(share, 20, 0.8);
    const close = settle(share / 0.4);

    for (const side of [-1, 1]) {
      sickle(
        kit,
        at,
        reach * 1.2,
        -Math.PI / 2,
        -Math.PI / 2 + side * Math.PI * close,
        reach * 0.45,
        colour,
        kept * 0.85,
        0.4,
      );
    }
    kit.ring(at, reach * 1.2, 0.05, lighten(colour, 0.5), kept * close * 0.6);
    if (share > 0.4) {
      const glint = swell((share - 0.4) / 0.5);

      kit.star(aside(kit, at, 0, reach * 1.2), reach * 0.6 * glint, 0, '#ffffff', glint);
    }
  },

  // Jagged arcs grating out toward it, with metal sparks for a steel sound
  Screech(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.4);
    const angle = kit.angleOn(stage.source, at);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.6 + pulse * 0.33) % 1;
      const front = toward(stage.source, at, held * 0.9);
      const radius = reach * (0.5 + held * 1.4);
      const arc: Spot[] = [];

      for (let step = 0; step <= 12; step += 1) {
        const turn = angle + (step / 12 - 0.5) * 1.8;
        // Every other point out and in, which is what makes the arc grate rather than roll
        const out = radius + (step % 2 === 0 ? 1 : -1) * reach * 0.15;

        arc.push(
          aside(
            kit,
            front,
            Math.cos(turn) * out - Math.cos(angle) * radius,
            Math.sin(turn) * out - Math.sin(angle) * radius,
          ),
        );
      }
      kit.ribbon(arc, reach * 0.1, light, decay(held) * 0.9);
    }
    sparks(
      kit,
      at,
      reach * (0.8 + swell(share) * 0.6),
      10,
      seed + Math.floor(share * 12),
      0.4,
      light,
      swell(share) * 0.8,
    );
    if (type === Types.Steel) {
      sparks(
        kit,
        at,
        reach * 1.4,
        6,
        seed + Math.floor(share * 16) * 3,
        0.6,
        '#fff2c0',
        swell(share),
      );
    }
  },

  // Two feathers brushing quickly at its sides
  Tickle(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const kept = showing(share, 5, 0.8);
    const wiggle = Math.sin(share * Math.PI * 8);

    for (const side of [-1, 1]) {
      const spot = aside(
        kit,
        at,
        side * reach * (0.9 + wiggle * 0.2),
        reach * 0.1 * Math.cos(share * Math.PI * 8),
      );

      kit.leaf(spot, reach * 0.4, side * (0.6 + wiggle * 0.4), colour, kept);
      kit.trail(
        aside(kit, spot, side * reach * 0.35, reach * 0.4),
        aside(kit, spot, side * reach * 0.55, reach * 0.1),
        reach * 0.04,
        lighten(colour, 0.3),
        kept * Math.abs(wiggle),
      );
    }
  },

  // Cotton puffs drifting down onto it and sticking
  Cotton(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const kept = showing(share, 20, 0.8);

    for (let one = 0; one < many(8, weight); one += 1) {
      const drifting = share * 1.4 - noise(seed, one) * 0.4;

      if (drifting <= 0) {
        continue;
      }
      const held = settle(drifting);
      const spot = aside(
        kit,
        at,
        spread(seed, one + 10) * reach * 0.8 +
          (spread(seed, one + 30) + Math.sin(held * 6 + one) * 0.15) * reach * (1 - held),
        -spread(seed, one + 20) * reach * 0.6 + reach * 2.5 * (1 - held),
        -reach * 0.4,
      );

      for (let tuft = 0; tuft < 3; tuft += 1) {
        const turn = (tuft / 3) * TAU + one;

        kit.puff(
          aside(kit, spot, Math.cos(turn) * reach * 0.12, Math.sin(turn) * reach * 0.1),
          reach * 0.16,
          paint.color,
          kept * 0.9,
        );
      }
    }
  },

  // Strands of silk shot at it, then wound round it
  Silk(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const kept = showing(share, 20, 0.8);
    const shoot = Math.min(1, share * 2.5);
    const wrap = Math.min(1, Math.max(0, (share - 0.35) / 0.35));

    for (let strand = 0; strand < 3; strand += 1) {
      const end = aside(
        kit,
        at,
        spread(seed, strand) * reach * 0.6,
        spread(seed, strand + 10) * reach * 0.6,
      );
      const tip = toward(stage.source, end, shoot);

      kit.ribbon(
        [
          stage.source,
          aside(kit, toward(stage.source, tip, 0.5), 0, spread(seed, strand + 20) * reach * 0.3),
          tip,
        ],
        reach * 0.05,
        colour,
        0.9 * Math.max(0, 1 - Math.max(0, share - 0.5) * 3),
        0,
        { add: 0.3 },
      );
    }
    for (let loop = 0; loop < 3; loop += 1) {
      if (wrap <= loop / 3) {
        continue;
      }
      const radius = reach * (1.1 - wrap * 0.2);

      kit.oval(
        aside(kit, at, 0, (loop - 1) * reach * 0.45),
        radius,
        radius * 0.3,
        -0.25 + loop * 0.25,
        0.1,
        colour,
        kept * Math.min(1, (wrap - loop / 3) * 3),
      );
    }
  },

  // Tears falling from its eyes and splashing at its feet
  Tears(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const kept = showing(share, 5, 0.8);
    const splash = (share * 2) % 1;

    for (let drop = 0; drop < many(6, weight); drop += 1) {
      const side = drop % 2 === 0 ? -1 : 1;
      const held = (share * 2 + noise(seed, drop)) % 1;
      const spot = aside(
        kit,
        at,
        side * reach * (0.3 + held * 0.15),
        reach * 0.5 - held * reach * 1.4,
        -reach * 0.3,
      );

      kit.bubble(
        [spot[0], Math.max(0.05, spot[1]), spot[2]],
        reach * 0.1,
        colour,
        kept * Math.min(1, held * 5) * (held < 0.8 ? 1 : decay((held - 0.8) / 0.2)),
      );
    }
    kit.ripple(floorOf(at), reach * (0.6 + splash * 0.8), 0.08, colour, kept * decay(splash) * 0.7);
  },

  // The pokemon that used it going up in dark smoke, and the dark settling on the one it cursed
  Memento(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const dark = mix(colour, SMOKE, 0.6);

    smoke(kit, stage.source, reach, 8, seed, share, dark, swell(share) * 0.8);
    kit.glow(at, reach * (1.4 - swell(share) * 0.4), dark, swell(share) * 0.45, 0, { add: 0 });
    kit.ring(at, reach * (1.9 - share * 1.1), 0.08, lighten(colour, 0.3), swell(share) * 0.7);
  },

  // Fog over it blown apart to either side by a gust
  Clear(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage);

    for (let puff = 0; puff < many(8, weight); puff += 1) {
      const side = spread(seed, puff) < 0 ? -1 : 1;
      const out = settle(share * 1.3) * reach * 2.2 * (0.5 + noise(seed, puff + 5));

      kit.puff(
        aside(
          kit,
          at,
          spread(seed, puff) * reach * 0.8 + side * out,
          spread(seed, puff + 10) * reach * 0.6,
          spread(seed, puff + 15) * reach * 0.6,
        ),
        reach * (0.45 + noise(seed, puff + 20) * 0.2),
        FOG,
        decay(share) * 0.6,
      );
    }
    for (let gust = 0; gust < 3; gust += 1) {
      const held = (share * 2 + gust / 3) % 1;
      const x = -reach * 2 + held * reach * 4;
      const up = (gust - 1) * reach * 0.6;

      kit.trail(
        aside(kit, at, x - reach * 1.2, up),
        aside(kit, at, x, up),
        reach * 0.06,
        lighten(paint.color, 0.4),
        swell(held) * 0.8,
      );
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default stats;
