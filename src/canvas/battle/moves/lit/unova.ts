import { Types } from '../../../../data/constants/types';
import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import { settle, showing } from '../effect/stats';
import {
  ARIA_TONES,
  CONVERGE_DRIVE,
  CONVERGE_HOLD,
  FUSION_LANDS,
  GAMBIT_LANDS,
  KYUREM_FIRE,
  KYUREM_SPARK,
  ORBIT_CLOSE,
  ORBIT_ORBS,
  SMITE_LANDS,
  VICTORY_LANDS,
} from '../effect/unova';
import { note } from './minds';
import { TAU, bolt, imbue, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, late, reachOf, toward } from './shapes';

/** Ice spikes standing up out of the floor round a spot, `grow` from 0 to 1 */
function iceSpikes(
  kit: EffectBatch,
  at: Spot,
  reach: number,
  grow: number,
  seed: number,
  colour: string,
  alpha: number,
): void {
  const floor = floorOf(at);

  for (let spike = 0; spike < 7; spike += 1) {
    const across = (spike / 6 - 0.5) * reach * 2.6 + spread(seed, spike) * reach * 0.15;
    const tall =
      reach * (0.8 + noise(seed, spike + 10) * 0.9) * grow * (1 - Math.abs(spike / 6 - 0.5));

    if (tall <= 0) {
      continue;
    }
    const base = aside(kit, floor, across, 0, -reach * 0.3);
    const top = aside(kit, base, -across * 0.2, tall * 1.6);

    // A streak is pointed at both ends, which is the spike's point
    kit.streak(
      toward(base, top, 0.5),
      tall * 0.8,
      reach * 0.2,
      kit.angleOn(base, top),
      colour,
      alpha,
      {
        add: 0.25,
      },
    );
  }
}

/** The Unova moves with a picture of their own, in the battle scene */
const unova = {
  // Shards of psychic force hanging round it, then driven in together
  Converge(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);
    const count = many(6, weight);
    const drive = Math.min(1, Math.max(0, (share - CONVERGE_HOLD) / CONVERGE_DRIVE));

    if (drive < 1) {
      const alpha = Math.min(1, share / 0.15);

      kit.glow(at, reach * 0.8, colour, alpha * 0.3, 0.2);
      for (let shard = 0; shard < count; shard += 1) {
        const angle = (shard / count) * TAU + noise(seed, shard) * 0.3 + share * 0.8;
        const out = reach * (2.2 - drive * 1.9) + reach * 0.35;

        // A streak is pointed at both ends, which is the shard's edge
        kit.streak(
          aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
          reach * 0.35,
          reach * 0.14,
          angle,
          light,
          alpha,
        );
      }
      return;
    }
    const hit = (share - CONVERGE_HOLD - CONVERGE_DRIVE) / (1 - CONVERGE_HOLD - CONVERGE_DRIVE);

    kit.glow(at, reach * (0.5 + hit), colour, decay(hit), 0.9);
    kit.star(at, reach * (1 + hit), 0.3, light, decay(hit));
    kit.ring(at, reach * (0.4 + hit * 1.8), 0.08, light, decay(hit));
    kit.ripple(floorOf(at), reach * (0.6 + hit * 1.6), 0.08, colour, decay(hit) * 0.6);
    sparks(kit, at, reach * (1 + hit * 1.4), count * 2, seed, hit, light, decay(hit));
  },

  // Waves pulsing out of it and out of the pokemon that used it in step, with a line shaking between them
  Resonance(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.4);
    const shown = showing(share, 5, 0.75);
    const path: Spot[] = [];

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.5 + pulse / 3) % 1;

      kit.ring(at, reach * (0.4 + held * 2), 0.06, light, decay(held) * shown);
      kit.ring(stage.source, reach * (0.4 + held * 1.2), 0.06, light, decay(held) * shown * 0.5);
    }
    for (let step = 0; step <= 24; step += 1) {
      const along = step / 24;
      const wave =
        Math.sin(along * Math.PI * 8 - share * Math.PI * 6) *
        Math.sin(along * Math.PI) *
        reach *
        0.3;

      path.push(aside(kit, toward(stage.source, at, along), 0, wave));
    }
    kit.ribbon(path, reach * 0.08, colour, shown * 0.8);
  },

  // Orbs of stored power circling it, closing in and bursting together
  Orbit(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    if (share < ORBIT_CLOSE) {
      const round = reach * 1.6 * (1 - settle(share / ORBIT_CLOSE));
      const alpha = Math.min(1, share * 5);

      for (let one = 0; one < ORBIT_ORBS; one += 1) {
        const angle = (one / ORBIT_ORBS) * TAU + share * TAU * 2;
        const spot: Spot = [
          at[0] + Math.cos(angle) * round,
          at[1] + Math.sin(angle) * round * 0.3,
          at[2] + Math.sin(angle) * round,
        ];

        kit.glow(spot, reach * 0.25, colour, alpha, 0.7);
        kit.star(spot, reach * 0.25, share * 6 + one, '#ffffff', alpha * 0.8);
      }
      return;
    }
    const hit = (share - ORBIT_CLOSE) / (1 - ORBIT_CLOSE);

    kit.glow(at, reach * (0.6 + hit * 0.8), colour, decay(hit), 0.9);
    kit.star(at, reach * (0.8 + hit), 0.4, '#ffffff', decay(hit));
    kit.ring(at, reach * (0.5 + hit * 1.6), 0.08, light, decay(hit));
    sparks(kit, at, reach * (1 + hit * 1.2), 10, seed, hit, light, decay(hit));
  },

  // The pokemon that used it flaring as it throws everything in, and one blow that lands with all of it
  Gambit(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.6);
    const flare = share < 0.25 ? share / 0.25 : decay((share - 0.25) / 0.75);

    kit.glow(stage.source, reach * (0.8 + flare * 0.6), light, flare * 0.8, 0.8);
    if (share < GAMBIT_LANDS) {
      const rush = Math.max(0, (share - 0.15) / (GAMBIT_LANDS - 0.15));

      if (rush > 0) {
        kit.trail(stage.source, toward(stage.source, at, rush), reach * 0.3, light, 0.9);
      }
      return;
    }
    const hit = (share - GAMBIT_LANDS) / (1 - GAMBIT_LANDS);

    kit.pool(floorOf(at), reach * 2.2, colour, decay(hit) * 0.6);
    kit.glow(at, reach * (0.8 + hit * 1.4), light, decay(hit), 1);
    kit.star(at, reach * (1.4 + hit * 1.6), 0.2, '#ffffff', decay(hit));
    sparks(kit, at, reach * (1.4 + hit * 1.6), 14, seed, hit, colour, decay(hit));
    for (let wave = 0; wave < 2; wave += 1) {
      kit.ring(at, reach * (0.6 + hit * (2 + wave)), 0.1, light, decay(hit) * (1 - wave * 0.4));
    }
  },

  // Tiny bugs zigzagging in on it and nipping where they land
  Buzz(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.4);

    kit.ring(at, reach * (0.8 + swell(share) * 0.4), 0.05, light, swell(share) * 0.4);
    for (let bug = 0; bug < many(8, weight); bug += 1) {
      const flying = share * 1.5 - noise(seed, bug) * 0.5;

      if (flying <= 0) {
        continue;
      }
      const end = aside(
        kit,
        at,
        spread(seed, bug + 10) * reach * 0.8,
        spread(seed, bug + 20) * reach * 0.7,
      );

      if (flying < 1) {
        const sway = Math.sin(flying * Math.PI * 6 + bug) * reach * 0.4 * (1 - flying);

        kit.glow(
          aside(kit, toward(stage.source, end, flying), 0, sway),
          reach * 0.12,
          light,
          1,
          0.6,
        );
        continue;
      }
      const nip = (flying - 1) / 0.5;

      if (nip < 1) {
        sparks(kit, end, reach * (0.3 + nip * 0.4), 4, seed + bug, nip, light, decay(nip));
      }
    }
  },

  // A shot of plasma: a hard line from the pokemon that fired it, and hexagons ringing out off the hit
  Techno(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.6);
    const flick = Math.floor(share * 14);

    if (share < 0.35) {
      kit.ribbon(
        [stage.source, toward(stage.source, at, Math.min(1, share / 0.2))],
        reach * 0.18,
        light,
        decay(share / 0.35),
      );
    }
    kit.glow(at, reach * (0.5 + swell(share) * 0.5), colour, decay(share), 0.9);
    for (let hex = 0; hex < 3; hex += 1) {
      const held = Math.max(0, Math.min(1, (share - 0.15 - hex * 0.12) / 0.6));

      if (held <= 0) {
        continue;
      }
      const radius = reach * (0.5 + held * 2);
      const path: Spot[] = [];

      for (let corner = 0; corner <= 6; corner += 1) {
        const angle = hex * 0.5 + share + (corner / 6) * TAU;

        path.push(aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius));
      }
      kit.ribbon(path, reach * 0.08, light, decay(held));
    }
    sparks(
      kit,
      at,
      reach * 1.4,
      6,
      seed + flick,
      0.5,
      colour,
      decay(share) * (flick % 2 === 0 ? 1 : 0.4),
    );
  },

  // A V of fire driven down onto it, going off as it lands
  Victory(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.6);
    const fall = Math.min(1, share / VICTORY_LANDS);
    const point = aside(kit, at, 0, reach * 3 * (1 - fall) ** 2);
    const kept = late(share, VICTORY_LANDS);

    for (const side of [-1, 1]) {
      const arm = aside(kit, point, side * reach * 1.3, reach * 1.8);
      const middle = toward(arm, point, 0.5);
      const angle = kit.angleOn(arm, point);

      kit.streak(middle, reach * 1.1, reach * 0.32, angle, colour, kept, { add: 0.6 });
      kit.streak(middle, reach * 1.1, reach * 0.12, angle, hot, kept);
    }
    if (share < VICTORY_LANDS) {
      return;
    }
    const hit = (share - VICTORY_LANDS) / (1 - VICTORY_LANDS);

    kit.pool(floorOf(at), reach * 2.4, colour, decay(hit) * 0.7);
    kit.glow(at, reach * (0.8 + hit * 1.2), hot, decay(hit));
    sparks(kit, at, reach * (1.4 + hit * 1.4), 12, seed, hit, hot, decay(hit));
    imbue(kit, at, reach * 1.2, hit, seed, Types.Fire, colour, 8);
  },

  // Blue fire rising up round it in a column, white at the heart
  Azure(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const shown = showing(share, 5, 0.7);
    const core = lighten(colour, 0.7);

    kit.pool(floorOf(at), reach * 1.8, colour, shown * 0.6);
    kit.glow(at, reach * (0.8 + swell(share) * 0.8), core, shown * 0.8, 1);
    for (let lick = 0; lick < many(12, weight); lick += 1) {
      const rise = (share * 1.8 + noise(seed, lick)) % 1;
      const spot = aside(
        kit,
        at,
        spread(seed, lick + 5) * reach * 1.2 * (1 - rise * 0.5),
        -reach * 0.9 + rise * reach * 3,
        spread(seed, lick + 15) * reach * 0.6,
      );

      kit.glow(
        [spot[0], Math.max(0.05, spot[1]), spot[2]],
        reach * 0.4 * (1 - rise * 0.6),
        rise < 0.35 ? core : colour,
        swell(rise) * shown,
        rise < 0.35 ? 0.6 : 0.1,
      );
    }
  },

  // Bolts coming down on it from every side at once, and a dark shock ring off the hit
  Thunderclap(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const flick = Math.floor(share * 14);
    const bright = decay(share) * (flick % 3 === 2 ? 0.5 : 1);

    for (let one = 0; one < 4; one += 1) {
      bolt(
        kit,
        aside(kit, at, (one - 1.5) * reach * 2, reach * 8),
        at,
        seed + flick * 7 + one,
        reach,
        reach * 0.22,
        colour,
        bright,
      );
    }
    kit.pool(floorOf(at), reach * 2.4, colour, bright * 0.6);
    kit.glow(at, reach * (0.6 + swell(share) * 0.6), lighten(colour, 0.6), bright);
    kit.ring(at, reach * (0.5 + share * 2.4), 0.12, mix(colour, '#1a2a6a', 0.5), decay(share), {
      add: 0,
    });
    kit.ripple(floorOf(at), reach * (0.5 + share * 2.4), 0.08, colour, decay(share) * 0.7);
  },

  // A ball of fire or lightning dropping out of the sky onto it and breaking open
  Fusion(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.6);

    if (share < FUSION_LANDS) {
      const fall = share / FUSION_LANDS;
      const spot = aside(kit, at, reach * 1.5 * (1 - fall), reach * 6 * (1 - fall));

      kit.trail(aside(kit, spot, reach * 0.85, reach * 3.4), spot, reach * 0.5, colour, 0.5);
      kit.glow(spot, reach * 0.9, colour, 1, 0.3);
      kit.glow(spot, reach * 0.45, light, 1, 1);
      return;
    }
    const hit = (share - FUSION_LANDS) / (1 - FUSION_LANDS);

    kit.pool(floorOf(at), reach * 2.4, colour, decay(hit) * 0.7);
    kit.glow(at, reach * (1 + hit * 1.4), light, decay(hit));
    kit.ring(at, reach * (0.6 + hit * 2), 0.1, colour, decay(hit));
    imbue(kit, at, reach * 1.4, hit, seed, type, colour, 8);
  },

  // Ice spikes breaking up round it, crackling with electricity
  Frostbolt(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    iceSpikes(
      kit,
      at,
      reach,
      settle(share * 3),
      seed,
      lighten(paint.color, 0.4),
      showing(share, 20, 0.7),
    );
    imbue(kit, at, reach, share, seed, Types.Electric, KYUREM_SPARK, 3);
  },

  // Ice spikes breaking up round it, with fire licking off them
  Frostfire(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    iceSpikes(
      kit,
      at,
      reach,
      settle(share * 3),
      seed,
      lighten(paint.color, 0.4),
      showing(share, 20, 0.7),
    );
    imbue(kit, at, reach, share, seed, Types.Fire, KYUREM_FIRE, 5);
  },

  // Frost spreading across the ground under it and freezing air blowing over
  Glaze(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const reached = settle(share * 2);
    const kept = showing(share, 20, 0.75);
    const light = lighten(paint.color, 0.5);

    kit.pool(floor, reach * (1 + reached * 2), light, kept * 0.4);
    for (let band = 0; band < 3; band += 1) {
      kit.ripple(
        floor,
        reach * (0.6 + reached * (1.4 + band * 0.6)),
        0.06,
        light,
        kept * (0.8 - band * 0.2),
      );
    }
    for (let crystal = 0; crystal < many(8, weight); crystal += 1) {
      const angle = noise(seed, crystal) * TAU;
      const out = reach * (0.4 + noise(seed, crystal + 10) * 1.6) * reached;

      kit.star(
        [floor[0] + Math.cos(angle) * out, 0.05, floor[2] + Math.sin(angle) * out],
        reach * 0.18,
        angle,
        '#ffffff',
        kept * swell((share * 2 + noise(seed, crystal + 20)) % 1),
      );
    }
    for (let flake = 0; flake < 10; flake += 1) {
      const held = (share * 1.5 + noise(seed, flake + 30)) % 1;

      kit.glow(
        aside(
          kit,
          at,
          -reach * 2.5 + held * reach * 5,
          spread(seed, flake + 40) * reach * 1.2,
          spread(seed, flake + 50) * reach * 0.8,
        ),
        reach * 0.06,
        '#ffffff',
        swell(held) * kept,
        0.8,
      );
    }
  },

  // Fireballs flung out of the pokemon that used it, bursting on it one after another
  Searing(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.6);

    for (let ball = 0; ball < 3; ball += 1) {
      const flight = share * 2.5 - ball * 0.25;

      if (flight <= 0) {
        continue;
      }
      if (flight < 1) {
        const arc = Math.sin(Math.PI * flight);

        kit.glow(
          aside(
            kit,
            toward(stage.source, at, flight),
            (ball - 1) * reach * 0.8 * arc,
            arc * reach * (1.5 + ball),
          ),
          reach * 0.4,
          hot,
          1,
          0.8,
        );
        continue;
      }
      const hit = (flight - 1) / 1.2;

      if (hit >= 1) {
        continue;
      }
      const spot = aside(kit, at, (ball - 1) * reach * 0.6, spread(seed, ball) * reach * 0.4);

      kit.glow(spot, reach * (0.4 + hit * 0.8), colour, decay(hit), 0.6);
      imbue(kit, spot, reach * 0.8, hit, seed + ball, Types.Fire, colour, 4);
    }
  },

  // A great sword falling point first through it, and the light of the cut left standing
  Smite(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.6);
    const drop = Math.min(1, share / SMITE_LANDS);
    const kept = late(share, SMITE_LANDS);
    const tip = aside(kit, at, 0, -reach * (1 - 4 * (1 - drop) ** 2));
    const hilt = aside(kit, tip, 0, reach * 3);
    const middle = toward(hilt, tip, 0.5);

    kit.streak(middle, reach * 1.5, reach * 0.28, Math.PI / 2, colour, kept, { add: 0.5 });
    kit.streak(middle, reach * 1.5, reach * 0.1, Math.PI / 2, light, kept);
    kit.streak(aside(kit, hilt, 0, -reach * 0.4), reach * 0.6, reach * 0.1, 0, light, kept);
    if (share < SMITE_LANDS) {
      return;
    }
    const hit = (share - SMITE_LANDS) / (1 - SMITE_LANDS);

    kit.pool(floorOf(at), reach * 1.8, colour, decay(hit) * 0.6);
    kit.ring(at, reach * (0.4 + hit * 1.8), 0.08, light, decay(hit));
    kit.star(at, reach * 0.8 * decay(hit), 0, '#ffffff', decay(hit));
    sparks(kit, at, reach * (1 + hit * 1.2), 8, seed, hit, light, decay(hit));
  },

  // Notes spiralling up round it through rings in a song's colours
  Aria(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const shown = showing(share, 4, 0.8);

    for (let wave = 0; wave < ARIA_TONES.length; wave += 1) {
      const held = (share * 1.2 + wave / ARIA_TONES.length) % 1;
      const radius = reach * (1.4 - held * 0.6);

      kit.oval(
        aside(kit, at, 0, -reach * 0.6 + held * reach * 2.4),
        radius,
        radius * 0.3,
        0,
        0.08,
        ARIA_TONES[wave],
        swell(held) * shown,
      );
    }
    for (let one = 0; one < many(8, weight); one += 1) {
      const held = (share * 1.2 + noise(seed, one)) % 1;
      const angle = held * TAU * 2 + one;
      const round = reach * (1.3 - held * 0.5);

      note(
        kit,
        [
          at[0] + Math.cos(angle) * round,
          at[1] - reach * 0.6 + held * reach * 2.6,
          at[2] + Math.sin(angle) * round,
        ],
        reach * 0.35,
        ARIA_TONES[one % ARIA_TONES.length],
        swell(held) * shown,
      );
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default unova;
