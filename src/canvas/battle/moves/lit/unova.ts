import { Types } from '../../../../data/constants/types';
import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import { settle, showing } from '../effect/stats';
import {
  ARIA_TONES,
  AZURE_FLIES,
  AZURE_HITS,
  CONVERGE_DRIVE,
  CONVERGE_HOLD,
  FUSION_LANDS,
  GAMBIT_LANDS,
  KYUREM_BREAK,
  KYUREM_FIRE,
  KYUREM_SPARK,
  ORBIT_CLOSE,
  ORBIT_ORBS,
  PLUMMET_LANDS,
  RAM_HITS,
  SMASH_BREAKS,
  SMITE_BLADES,
  SMITE_LANDS,
  TECHNO_FIRES,
  TECHNO_HITS,
  TONNAGE_LANDS,
  TURN_BACK,
  VICTORY_LANDS,
  VICTORY_RISES,
} from '../effect/unova';
import { backToward } from './contact';
import { note } from './minds';
import { TAU, arcing, bolt, debris, gathering, imbue, jet, sickle, smoke, sparks } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  staged,
  toward,
} from './shapes';
import type { LitStage } from '../__painted';

/** A crown of ice spikes standing up out of the floor round a spot, `grow` from 0 to 1 */
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
  const count = 11;

  for (let spike = 0; spike < count; spike += 1) {
    const angle = (spike / count) * TAU + noise(seed, spike) * 0.4;
    const round = reach * (1 + noise(seed, spike + 30) * 0.9);
    const tall =
      reach *
      (1.4 + noise(seed, spike + 10) * 1.8) *
      Math.min(1, grow * (1 + noise(seed, spike + 40)));

    if (tall <= 0) {
      continue;
    }
    const base = aside(kit, floor, Math.cos(angle) * round, 0, Math.sin(angle) * round * 0.7);
    // Leaning in over it
    const top = aside(kit, base, -Math.cos(angle) * reach * 0.35, tall * 1.6);
    const turn = kit.angleOn(base, top);

    // A streak is pointed at both ends, which is the spike's point
    kit.streak(toward(base, top, 0.5), tall * 0.8, reach * 0.34, turn, colour, alpha, {
      add: 0.25,
    });
    kit.streak(toward(base, top, 0.6), tall * 0.5, reach * 0.1, turn, '#ffffff', alpha * 0.8);
  }
}

/** A hexagon standing on the picture, turned by `turn` */
function hexagon(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  turn: number,
  width: number,
  colour: string,
  alpha: number,
): void {
  const path: Spot[] = [];

  for (let corner = 0; corner <= 6; corner += 1) {
    const angle = turn + (corner / 6) * TAU;

    path.push(aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  kit.ribbon(path, width, colour, alpha);
}

/** Kyurem's pair: a crown of ice round it, the element coming through, and the ice shattering */
function frozen(
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  colour: string,
  seed: number,
  weight: number,
  element: Types,
  spark: string,
): void {
  const at = landed(stage);
  const floor = floorOf(at);
  const reach = reachOf(stage, weight);
  const ice = lighten(colour, 0.4);
  const grow = settle(share * 3);
  const broken = Math.max(0, (share - KYUREM_BREAK) / (1 - KYUREM_BREAK));
  const kept = Math.min(1, share * 20) * decay(broken);
  const flick = Math.floor(share * 14);

  kit.pool(floor, reach * (1.2 + grow * 2), ice, kept * 0.5);
  kit.ripple(floor, reach * (0.8 + grow * 2.4), 0.08, '#ffffff', kept * 0.7);
  iceSpikes(kit, at, reach, grow, seed, ice, kept);
  smoke(kit, floor, reach * 2, 6, seed, share, '#eef6ff', kept * 0.5);
  if (element === Types.Electric) {
    for (let one = 0; one < 3; one += 1) {
      bolt(
        kit,
        aside(kit, at, (one - 1) * reach * 2, reach * 7),
        at,
        seed + flick * 7 + one,
        reach,
        reach * 0.18,
        spark,
        kept * (flick % 3 === 2 ? 0.4 : 1),
      );
    }
  } else {
    for (let one = 0; one < 5; one += 1) {
      const angle = (one / 5) * TAU + noise(seed, one + 60) * 0.5;

      jet(
        kit,
        [floor[0] + Math.cos(angle) * reach * 1.3, 0, floor[2] + Math.sin(angle) * reach * 0.9],
        reach * (2 + noise(seed, one + 70) * 1.5) * grow,
        reach * 0.22,
        spark,
        mix(spark, '#ffd84a', 0.6),
        kept,
        share * 12,
      );
    }
  }
  imbue(kit, at, reach * 1.2, share, seed, element, spark, 8);
  if (broken > 0) {
    debris(
      kit,
      aside(kit, floor, 0, reach),
      reach * 1.6,
      many(14, weight),
      seed,
      broken,
      ice,
      decay(broken),
    );
    kit.star(at, reach * 2.4 * decay(broken), 0, '#ffffff', decay(broken));
    sparks(kit, at, reach * 2, 10, seed, broken, spark, decay(broken));
  }
}

/** A great sword standing point down on `tip` */
function sword(
  kit: EffectBatch,
  tip: Spot,
  size: number,
  light: string,
  colour: string,
  alpha: number,
): void {
  const hilt = aside(kit, tip, 0, size * 3);
  const middle = toward(hilt, tip, 0.5);

  kit.glow(middle, size * 1.2, colour, alpha * 0.35, 0.3);
  kit.streak(middle, size * 1.5, size * 0.32, Math.PI / 2, colour, alpha, { add: 0.5 });
  kit.streak(middle, size * 1.5, size * 0.12, Math.PI / 2, '#ffffff', alpha);
  kit.streak(aside(kit, hilt, 0, -size * 0.4), size * 0.7, size * 0.12, 0, light, alpha);
  kit.streak(aside(kit, hilt, 0, size * 0.2), size * 0.35, size * 0.1, Math.PI / 2, light, alpha);
}

/** A gear on the picture: a ring with square teeth round it, turned by `turn` */
function gear(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  teeth: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  const steps = teeth * 4;
  const path: Spot[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const angle = turn + (step / steps) * TAU;
    // Two points out on a tooth and two back in the gap after it
    const out = step % 4 < 2 ? radius * 1.22 : radius;

    path.push(aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out));
  }
  kit.ribbon(path, radius * 0.14, colour, alpha, 0, { add: 0.4 });
  kit.ring(at, radius * 0.4, 0.2, colour, alpha);
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

  // Plasma gathered in turning hexagons on the caster, a hard beam with rings running down it, and hexagons ringing off the hit
  Techno(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.6);
    const flick = Math.floor(share * 14);

    if (share < TECHNO_FIRES) {
      const charge = share / TECHNO_FIRES;

      kit.glow(stage.source, reach * (0.4 + charge * 0.8), colour, charge * 0.8, 0.6);
      hexagon(
        kit,
        stage.source,
        reach * (1.6 - charge * 0.8),
        share * 6,
        reach * 0.08,
        light,
        charge,
      );
      hexagon(
        kit,
        stage.source,
        reach * (1.1 - charge * 0.5),
        -share * 8,
        reach * 0.06,
        light,
        charge,
      );
      gathering(kit, stage.source, reach * 1.8, 10, seed, share, light);
      return;
    }
    if (share < TECHNO_HITS + 0.12) {
      const drawn = Math.min(1, (share - TECHNO_FIRES) / (TECHNO_HITS - TECHNO_FIRES));
      const kept = share < TECHNO_HITS ? 1 : decay((share - TECHNO_HITS) / 0.12);
      const path = [stage.source, toward(stage.source, at, drawn)];

      kit.glow(stage.source, reach * 0.8, light, kept * 0.7);
      kit.ribbon(path, reach * 0.9, colour, kept * 0.5, share * 10);
      kit.ribbon(path, reach * 0.35, light, kept, share * 14);
      kit.ribbon(path, reach * 0.1, '#ffffff', kept);
      for (let band = 0; band < 3; band += 1) {
        const along = ((share * 4 + band / 3) % 1) * drawn;

        hexagon(
          kit,
          toward(stage.source, at, along),
          reach * 0.6,
          share * 6 + band,
          reach * 0.06,
          light,
          kept * 0.8,
        );
      }
    }
    if (share < TECHNO_HITS) {
      return;
    }
    const hit = (share - TECHNO_HITS) / (1 - TECHNO_HITS);

    kit.pool(floor, reach * (1.8 + hit * 2), colour, decay(hit) * 0.7);
    kit.glow(at, reach * (0.9 + hit * 1.4), light, decay(hit));
    kit.star(at, reach * (1.4 + hit * 1.6), 0, '#ffffff', decay(Math.min(1, hit * 2.5)));
    for (let band = 0; band < 3; band += 1) {
      const held = staged(hit, 1.6, band * 0.2);

      if (held > 0) {
        hexagon(
          kit,
          at,
          reach * (0.6 + held * 2.6),
          band * 0.5 + share,
          reach * 0.1,
          light,
          decay(held),
        );
      }
    }
    sparks(
      kit,
      at,
      reach * (1.4 + hit * 1.4),
      12,
      seed + flick,
      hit,
      colour,
      decay(hit) * (flick % 2 === 0 ? 1 : 0.5),
    );
  },

  // Wreathed in fire, then a great burning V driven down onto it and the ground going up in flames
  Victory(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.6);

    if (share < VICTORY_RISES) {
      const up = share / VICTORY_RISES;

      kit.glow(stage.source, reach * (0.6 + up * 1.2), colour, up * 0.8, 0.4);
      kit.glow(stage.source, reach * 0.6 * up, hot, up);
      imbue(kit, stage.source, reach * 1.2, up * 0.5, seed, Types.Fire, colour, 8);
      return;
    }
    const fall = Math.min(1, (share - VICTORY_RISES) / (VICTORY_LANDS - VICTORY_RISES));
    const point = aside(kit, at, 0, reach * 5 * (1 - fall) ** 2);
    const kept = late(share, VICTORY_LANDS);

    for (const side of [-1, 1]) {
      const arm = aside(kit, point, side * reach * 2.2, reach * 3);
      const middle = toward(arm, point, 0.5);
      const angle = kit.angleOn(arm, point);

      kit.streak(middle, reach * 1.9, reach * 0.55, angle, colour, kept, { add: 0.6 });
      kit.streak(middle, reach * 1.9, reach * 0.2, angle, hot, kept);
      for (let lick = 0; lick <= 5; lick += 1) {
        const spot = toward(arm, point, lick / 5);

        kit.glow(
          aside(kit, spot, 0, reach * 0.4 * swell((share * 6 + lick * 0.3) % 1)),
          reach * 0.35,
          hot,
          kept * 0.7,
          0.5,
        );
      }
    }
    if (share < VICTORY_LANDS) {
      kit.pool(floor, reach * (0.6 + fall * 1.6), colour, fall * 0.5);
      return;
    }
    const hit = (share - VICTORY_LANDS) / (1 - VICTORY_LANDS);
    const jets = many(5, weight);

    kit.pool(floor, reach * (2.4 + hit * 2), colour, decay(hit) * 0.8, { add: 0.5 });
    kit.glow(at, reach * (1.2 + hit * 2), hot, decay(Math.min(1, hit * 1.3)));
    kit.star(at, reach * (1.8 + hit * 2.4), 0, '#ffffff', decay(Math.min(1, hit * 3)));
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(hit, 1.5, wave * 0.3);

      if (held > 0) {
        kit.ring(at, reach * (0.6 + held * 3), 0.1, hot, decay(held));
        kit.ripple(floor, reach * (0.8 + held * 3), 0.1, colour, decay(held) * 0.8);
      }
    }
    for (let one = 0; one < jets; one += 1) {
      const angle = (one / jets) * TAU + noise(seed, one) * 0.5;

      jet(
        kit,
        [floor[0] + Math.cos(angle) * reach * 1.6, 0, floor[2] + Math.sin(angle) * reach * 1.6],
        reach * (2.4 + noise(seed, one + 10) * 2) * Math.min(1, hit * 3),
        reach * 0.3,
        colour,
        hot,
        late(hit, 0.4),
        share * 12,
      );
    }
    sparks(kit, at, reach * (1.6 + hit * 1.8), 16, seed, hit, hot, decay(hit));
    imbue(kit, at, reach * 1.6, hit, seed, Types.Fire, colour, 14);
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 1.3,
      many(10, weight),
      seed,
      hit,
      mix(colour, '#3a1a0a', 0.6),
      late(hit, 0.6),
    );
  },

  // Blue fire gathered on the caster, flung onto it, and a twisting column of it standing up white at the heart
  Azure(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const core = lighten(colour, 0.7);

    if (share < AZURE_FLIES) {
      const charge = share / AZURE_FLIES;

      kit.glow(stage.source, reach * (0.4 + charge), colour, charge * 0.8, 0.5);
      kit.glow(stage.source, reach * 0.5 * charge, core, charge);
      gathering(kit, stage.source, reach * 1.8, 12, seed, share, core);
      return;
    }
    if (share < AZURE_HITS) {
      const flight = (share - AZURE_FLIES) / (AZURE_HITS - AZURE_FLIES);
      const ball = arcing(stage.source, at, flight, reach * 1.5);

      kit.trail(
        arcing(stage.source, at, Math.max(0, flight - 0.25), reach * 1.5),
        ball,
        reach * 0.7,
        colour,
        0.6,
      );
      kit.glow(ball, reach * 1.2, colour, 0.8, 0.3);
      kit.glow(ball, reach * 0.6, core, 1);
      return;
    }
    const burn = (share - AZURE_HITS) / (1 - AZURE_HITS);
    const kept = late(burn, 0.55);
    const tall = reach * 6 * Math.min(1, burn * 4);

    kit.pool(floor, reach * (1.8 + burn * 1.4), colour, kept * 0.7, { add: 0.5 });
    for (let tongue = 0; tongue < 3; tongue += 1) {
      const path: Spot[] = [];

      for (let step = 0; step <= 10; step += 1) {
        const along = step / 10;
        const turn = along * TAU * 1.2 + share * TAU * 2 + tongue * 2.1;
        const round = reach * 0.6 * (1 - along * 0.6);

        path.push([
          floor[0] + Math.cos(turn) * round,
          along * tall,
          floor[2] + Math.sin(turn) * round,
        ]);
      }
      kit.ribbon(path, reach * 0.8, colour, kept * 0.6, share * 12);
      kit.ribbon(path, reach * 0.3, core, kept, share * 16);
    }
    kit.glow(at, reach * (1 + swell(burn)), core, kept * 0.9);
    for (let lick = 0; lick < many(12, weight); lick += 1) {
      const rise = (share * 1.8 + noise(seed, lick)) % 1;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, lick + 5) * reach * 1.4 * (1 - rise * 0.5),
          rise * tall,
          spread(seed, lick + 15) * reach * 0.6,
        ),
        reach * 0.4 * (1 - rise * 0.6),
        rise < 0.35 ? core : colour,
        swell(rise) * kept,
        rise < 0.35 ? 0.6 : 0.1,
      );
    }
    kit.ring(at, reach * (0.6 + burn * 3), 0.1, core, decay(burn));
    kit.ripple(floor, reach * (0.8 + burn * 3), 0.1, colour, decay(burn) * 0.8);
    sparks(kit, at, reach * (1.6 + burn * 1.6), 12, seed, burn, core, decay(burn));
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

  // A great ball of fire or lightning dropping out of the sky with a ring round it, and breaking open over the ground
  Fusion(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.6);

    if (share < FUSION_LANDS) {
      const fall = share / FUSION_LANDS;
      const place = (along: number): Spot =>
        aside(kit, at, reach * 2 * (1 - along), reach * 8 * (1 - along));
      const path: Spot[] = [];

      for (let step = 0; step <= 5; step += 1) {
        path.push(place(Math.max(0, fall - 0.4 + (step / 5) * 0.4)));
      }
      const ball = place(fall);

      kit.pool(floor, reach * (0.6 + fall * 1.8), colour, fall * 0.5);
      kit.ribbon(path, reach * 1.2, colour, 0.5, share * 10);
      kit.ribbon(path, reach * 0.45, light, 0.9, share * 14);
      kit.glow(ball, reach * 1.4, colour, 1, 0.3);
      kit.glow(ball, reach * 0.7, light, 1, 1);
      kit.oval(ball, reach * 1.2, reach * 0.4, share * 8, 0.08, light, 0.8);
      return;
    }
    const hit = (share - FUSION_LANDS) / (1 - FUSION_LANDS);
    const flick = Math.floor(share * 14);

    kit.pool(floor, reach * (2 + hit * 2.4), colour, decay(hit) * 0.8, { add: 0.4 });
    kit.glow(at, reach * (1.2 + hit * 1.8), light, decay(Math.min(1, hit * 1.4)));
    kit.star(at, reach * (1.6 + hit * 2.4), hit, '#ffffff', decay(Math.min(1, hit * 2.5)));
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(hit, 1.5, wave * 0.3);

      if (held > 0) {
        kit.ring(at, reach * (0.6 + held * 3), 0.1, colour, decay(held));
        kit.ripple(floor, reach * (0.8 + held * 3), 0.1, light, decay(held) * 0.8);
      }
    }
    for (let one = 0; one < 5; one += 1) {
      const angle = (one / 5) * TAU + noise(seed, one) * 0.5;

      if (type === Types.Electric) {
        bolt(
          kit,
          at,
          aside(kit, floor, Math.cos(angle) * reach * 3, reach * 0.1, Math.sin(angle) * reach * 2),
          seed + flick * 7 + one,
          reach,
          reach * 0.14,
          colour,
          decay(hit) * (flick % 3 === 2 ? 0.5 : 1),
        );
        continue;
      }
      jet(
        kit,
        [floor[0] + Math.cos(angle) * reach * 1.6, 0, floor[2] + Math.sin(angle) * reach * 1.6],
        reach * (2.2 + noise(seed, one + 10) * 1.8) * Math.min(1, hit * 3),
        reach * 0.28,
        colour,
        light,
        late(hit, 0.4),
        share * 12,
      );
    }
    imbue(kit, at, reach * 1.6, hit, seed, type, colour, 14);
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 1.2,
      many(8, weight),
      seed,
      hit,
      colour,
      late(hit, 0.6),
    );
  },

  // A crown of ice bursting up round it, lightning coming down through it, and the ice shattering
  Frostbolt(kit, stage, share, { paint, seed, weight }) {
    frozen(kit, stage, share, paint.color, seed, weight, Types.Electric, KYUREM_SPARK);
  },

  // A crown of ice bursting up round it, fire pouring up between the spikes, and the ice shattering
  Frostfire(kit, stage, share, { paint, seed, weight }) {
    frozen(kit, stage, share, paint.color, seed, weight, Types.Fire, KYUREM_FIRE);
  },

  // Frost racing across the ground, spikes of ice rising round it in a freezing wind, then breaking off
  Glaze(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const reached = settle(share * 2);
    const broken = Math.max(0, (share - 0.75) / 0.25);
    const kept = Math.min(1, share * 20) * decay(broken);
    const light = lighten(paint.color, 0.5);

    kit.pool(floor, reach * (1 + reached * 2.4), light, kept * 0.5);
    for (let band = 0; band < 3; band += 1) {
      kit.ripple(
        floor,
        reach * (0.6 + reached * (1.6 + band * 0.7)),
        0.06,
        light,
        kept * (0.8 - band * 0.2),
      );
    }
    iceSpikes(kit, at, reach * 0.8, settle(Math.max(0, share - 0.15) * 3), seed, light, kept);
    smoke(kit, floor, reach * 2.4, 6, seed, share, '#eef6ff', kept * 0.5);
    for (let crystal = 0; crystal < many(10, weight); crystal += 1) {
      const angle = noise(seed, crystal) * TAU;
      const out = reach * (0.4 + noise(seed, crystal + 10) * 2) * reached;

      kit.star(
        [floor[0] + Math.cos(angle) * out, 0.05, floor[2] + Math.sin(angle) * out],
        reach * 0.22,
        angle,
        '#ffffff',
        kept * swell((share * 2 + noise(seed, crystal + 20)) % 1),
      );
    }
    for (let gust = 0; gust < 10; gust += 1) {
      const held = (share * 2 + noise(seed, gust + 30)) % 1;

      kit.streak(
        aside(
          kit,
          at,
          -reach * 3 + held * reach * 6,
          spread(seed, gust + 40) * reach * 1.4,
          spread(seed, gust + 50) * reach,
        ),
        reach * 0.8,
        reach * 0.04,
        0,
        '#ffffff',
        swell(held) * kept * 0.7,
      );
    }
    if (broken > 0) {
      debris(
        kit,
        aside(kit, floor, 0, reach),
        reach * 1.4,
        many(12, weight),
        seed,
        broken,
        light,
        decay(broken),
      );
      sparks(kit, at, reach * 2, 10, seed, broken, '#ffffff', decay(broken));
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

  // Three great swords falling point first round it, the middle one through it, and the light of the strike left standing
  Smite(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.6);
    const kept = late(share, 0.65);

    for (const [right, away, scale, lands] of SMITE_BLADES) {
      const drop = Math.min(1, share / lands);
      const base = aside(kit, floor, right * reach, 0, away * reach);
      const tip = aside(kit, base, 0, reach * 9 * (1 - drop) ** 2 - reach * 0.3 * drop);

      sword(kit, tip, reach * scale, light, colour, kept);
      if (drop < 1) {
        kit.trail(
          aside(kit, tip, 0, reach * (3 * scale + 2)),
          aside(kit, tip, 0, reach * 3 * scale),
          reach * 0.3 * scale,
          colour,
          0.5,
        );
        continue;
      }
      const land = (share - lands) / (1 - lands);

      kit.pool(base, reach * 1.2 * scale, colour, decay(land) * 0.6);
      kit.ripple(base, reach * (0.3 + land * 1.6) * scale, 0.1, light, decay(land));
    }
    if (share < SMITE_LANDS) {
      return;
    }
    const hit = (share - SMITE_LANDS) / (1 - SMITE_LANDS);

    kit.glow(at, reach * (1 + hit * 1.6), light, decay(Math.min(1, hit * 1.3)));
    kit.star(at, reach * (1.6 + hit * 2), 0, '#ffffff', decay(Math.min(1, hit * 2.5)));
    kit.ring(at, reach * (0.6 + hit * 3), 0.08, light, decay(hit));
    kit.ripple(floor, reach * (1 + hit * 3), 0.1, colour, decay(hit) * 0.8);
    sparks(kit, at, reach * (1.4 + hit * 1.6), 12, seed, hit, light, decay(hit));
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 1.2,
      many(8, weight),
      seed,
      hit,
      mix(colour, '#5b4636', 0.5),
      late(hit, 0.6),
    );
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

  // Glittering wings fluttering up round it in a spiral
  Flutter(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = showing(share, 4, 0.8);

    for (let one = 0; one < many(6, weight); one += 1) {
      const held = (share * 1.3 + noise(seed, one)) % 1;
      const angle = held * TAU * 2 + one * 1.3;
      const round = reach * (1.2 - held * 0.4);
      const spot: Spot = [
        at[0] + Math.cos(angle) * round,
        at[1] - reach * 0.7 + held * reach * 2.4,
        at[2] + Math.sin(angle) * round,
      ];
      // Wings opening and closing, so the pair reads as a flutter rather than two leaves
      const beat = Math.abs(Math.sin(share * Math.PI * 10 + one));

      for (const side of [-1, 1]) {
        kit.leaf(
          aside(kit, spot, side * reach * 0.15 * beat),
          reach * 0.22,
          side * (0.4 + beat * 0.8),
          colour,
          swell(held) * shown,
        );
      }
    }
    for (let mote = 0; mote < 8; mote += 1) {
      kit.glow(
        aside(
          kit,
          at,
          spread(seed, mote + 40) * reach * 1.4 * (0.4 + share),
          spread(seed, mote + 50) * reach + share * reach * 0.7,
          spread(seed, mote + 60) * reach * 0.8,
        ),
        reach * 0.06,
        lighten(colour, 0.6),
        shown,
        0.8,
      );
    }
  },

  // Its shell straining and cracking, then bursting off in pieces with the light under it shining out
  Smash(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    if (share < SMASH_BREAKS) {
      const strain = share / SMASH_BREAKS;
      const centre = aside(kit, at, Math.sin(strain * Math.PI * 12) * reach * 0.04 * strain);
      const top = aside(kit, centre, 0, reach * 1.2);
      const end = aside(kit, centre, reach * 0.3 * strain, reach * (1.2 - 0.8 * strain));

      for (const side of [-1, 1]) {
        sickle(
          kit,
          centre,
          reach * 1.2,
          -Math.PI / 2,
          -Math.PI / 2 + side * Math.PI,
          reach * 0.45,
          colour,
          0.9,
          0.3,
        );
      }
      kit.streak(
        toward(top, end, 0.5),
        reach * 0.45 * strain,
        reach * 0.05,
        kit.angleOn(top, end),
        '#2a2018',
        strain,
        { add: 0 },
      );
      return;
    }
    const broken = (share - SMASH_BREAKS) / (1 - SMASH_BREAKS);

    kit.glow(at, reach * (0.8 + broken * 0.8), light, decay(broken));
    kit.ring(at, reach * (0.8 + broken * 1.6), 0.08, light, decay(broken));
    debris(kit, at, reach * 1.2, 10, seed, broken, colour, decay(broken));
  },

  // Two gears meshing over it, turning faster as they go
  Gears(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = showing(share, 5, 0.8);
    const turn = share * share * Math.PI * 6;

    kit.glow(at, reach * 1.1, colour, shown * 0.3, 0.2);
    gear(
      kit,
      aside(kit, at, -reach * 0.55, reach * 0.3),
      reach * 0.7,
      8,
      turn,
      lighten(colour, 0.3),
      shown,
    );
    gear(
      kit,
      aside(kit, at, reach * 0.55, -reach * 0.35),
      reach * 0.5,
      6,
      0.3 - turn * 1.4,
      lighten(colour, 0.5),
      shown,
    );
  },

  // A spiral winding up round its body and drawing tight
  Windup(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const shown = showing(share, 4, 0.8);
    const round = reach * (1.4 - settle(share * 1.5) * 0.5);
    const path: Spot[] = [];

    for (let step = 0; step <= 48; step += 1) {
      const along = step / 48;
      const angle = along * TAU * 3 + share * TAU;

      path.push([
        at[0] + Math.cos(angle) * round,
        Math.max(0.05, at[1] - reach * 0.9 + along * reach * 2.2),
        at[2] + Math.sin(angle) * round,
      ]);
    }
    kit.ribbon(path, reach * 0.1, lighten(colour, 0.3), shown);
    if (share > 0.6) {
      kit.glow(at, reach * 0.7, colour, swell((share - 0.6) / 0.4) * 0.6, 0.6);
    }
  },

  // Pieces of its body dropping away, and it streaking off lighter
  Shed(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    kit.glow(at, reach * 0.9, colour, swell(share) * 0.3, 0.2);
    for (let piece = 0; piece < 8; piece += 1) {
      const held = Math.min(1, share * 1.5 - noise(seed, piece) * 0.4);

      if (held <= 0) {
        continue;
      }
      const spot = aside(
        kit,
        at,
        spread(seed, piece + 10) * reach * 0.8,
        spread(seed, piece + 20) * reach * 0.6 - held * held * reach * 2.2,
        spread(seed, piece + 30) * reach * 0.4,
      );

      kit.shard(
        [spot[0], Math.max(0.05, spot[1]), spot[2]],
        reach * 0.14,
        held * 6 + piece,
        colour,
        decay(held),
      );
    }
    if (share < 0.4) {
      return;
    }
    const fast = Math.min(1, (share - 0.4) * 4) * decay((share - 0.4) / 0.6);

    for (let line = 0; line < 4; line += 1) {
      const held = (share * 3 + noise(seed, line + 30)) % 1;
      const x = -reach * 1.6 + held * reach * 3.2;
      const up = spread(seed, line + 40) * reach;

      kit.trail(
        aside(kit, at, x - reach * 0.9, up),
        aside(kit, at, x, up),
        reach * 0.05,
        light,
        fast * swell(held),
      );
    }
  },

  // A shadow spreading under it as something heavy comes down, then the ground giving way
  Tonnage(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;

    if (share < TONNAGE_LANDS) {
      const near = share / TONNAGE_LANDS;

      kit.pool(floor, reach * (0.6 + near * 1.2), '#140c08', near * 0.5, { add: 0 });
      return;
    }
    const hit = (share - TONNAGE_LANDS) / (1 - TONNAGE_LANDS);
    const dust = mix(colour, '#b9a58a', 0.6);

    for (let wave = 0; wave < 2; wave += 1) {
      kit.ripple(
        floor,
        reach * (0.6 + hit * (2.4 + wave)),
        0.1,
        colour,
        decay(hit) * (1 - wave * 0.4),
      );
    }
    for (let crack = 0; crack < 6; crack += 1) {
      const angle = (crack / 6) * TAU + noise(seed, crack);
      const length = reach * (0.8 + noise(seed, crack + 10) * 0.8) * Math.min(1, hit * 4);

      kit.ribbon(
        [
          [floor[0], 0.03, floor[2]],
          [floor[0] + Math.cos(angle) * length, 0.03, floor[2] + Math.sin(angle) * length],
        ],
        reach * 0.07,
        '#2a1a10',
        decay(hit),
        0,
        { add: 0 },
      );
    }
    smoke(kit, floor, reach, 6, seed, hit, dust, decay(hit) * 0.5);
    debris(kit, floor, reach * 0.8, 8, seed, hit, dust, decay(hit));
    imbue(kit, at, reach, hit, seed, type, colour, 6);
  },

  // A column of its element bursting up out of the ground under it: fire, a geyser, or a whirl of leaves
  Pledge(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);
    const shown = showing(share, 6, 0.7);
    const height = reach * 3.6 * settle(share * 3);

    kit.pool(floor, reach * (1 + swell(share) * 0.6), colour, shown * 0.6);
    kit.ripple(floor, reach * (1 + swell(share) * 0.6), 0.08, light, shown * 0.7);
    if (height > 0) {
      kit.ribbon(
        [floor, aside(kit, floor, 0, height)],
        reach * 1.8,
        colour,
        shown * 0.3,
        share * 6,
      );
    }
    for (let piece = 0; piece < many(10, weight); piece += 1) {
      const rise = (share * 1.8 + noise(seed, piece)) % 1;
      const spot = aside(
        kit,
        floor,
        spread(seed, piece + 10) * reach * 0.7,
        rise * height,
        spread(seed, piece + 30) * reach * 0.5,
      );
      const alpha = swell(rise) * shown;

      if (type === Types.Fire) {
        kit.glow(
          spot,
          reach * 0.35 * (1 - rise * 0.5),
          rise < 0.4 ? light : colour,
          alpha,
          rise < 0.4 ? 0.6 : 0.1,
        );
      } else if (type === Types.Water) {
        kit.bubble(spot, reach * 0.2 * (0.6 + noise(seed, piece + 20)), light, alpha);
      } else {
        const turn = rise * TAU * 2 + piece;

        kit.leaf(
          [
            floor[0] + Math.cos(turn) * reach * 0.7,
            rise * height,
            floor[2] + Math.sin(turn) * reach * 0.7,
          ],
          reach * 0.25,
          turn,
          colour,
          alpha,
        );
      }
    }
  },

  // Quick strikes swooping in on loops, from one side and then the other
  Aerial(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.5);

    for (let pass = 0; pass < 3; pass += 1) {
      const held = share * 3 - pass;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const side = pass % 2 === 0 ? -1 : 1;
      const swoop = Math.min(1, held * 2);
      const centre = aside(kit, at, side * reach * 0.8, reach * 0.8);
      const radius = reach * 1.13;
      // Round a circle that ends on it, so the loop comes down onto the target
      const end = Math.atan2(-reach * 0.8, -side * reach * 0.8);
      const start = end + side * Math.PI * 1.4;
      const path: Spot[] = [];

      for (let step = 0; step <= 12; step += 1) {
        const angle = start + (end - start) * (step / 12) * swoop;

        path.push(aside(kit, centre, Math.cos(angle) * radius, Math.sin(angle) * radius));
      }
      kit.ribbon(path, reach * 0.1, light, decay(held));
      if (swoop < 1) {
        continue;
      }
      const hit = (held - 0.5) / 0.5;

      kit.star(at, reach * (0.5 + hit * 0.5), side, '#ffffff', decay(hit));
      sparks(kit, at, reach * (0.4 + hit * 0.6), 5, seed + pass, hit, light, decay(hit));
    }
  },

  // Dropped from high above: wind streaking down past it, then the ground slammed
  Plummet(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    if (share < PLUMMET_LANDS) {
      const fall = share / PLUMMET_LANDS;

      for (let line = 0; line < 5; line += 1) {
        const across = (line - 2) * reach * 0.45;
        const up = reach * 4 * (1 - fall) + noise(seed, line) * reach * 0.6;

        kit.trail(
          aside(kit, at, across, up + reach * 1.6),
          aside(kit, at, across, up),
          reach * 0.05,
          light,
          fall,
        );
      }
      return;
    }
    const hit = (share - PLUMMET_LANDS) / (1 - PLUMMET_LANDS);

    for (let wave = 0; wave < 2; wave += 1) {
      kit.ripple(
        floor,
        reach * (0.6 + hit * (2 + wave)),
        0.1,
        colour,
        decay(hit) * (1 - wave * 0.4),
      );
    }
    sparks(kit, at, reach * (0.8 + hit), 8, seed, hit, light, decay(hit));
    smoke(kit, floor, reach, 6, seed, hit, mix(colour, '#b9a58a', 0.6), decay(hit) * 0.5);
  },

  // A great spiked wheel rolling in over it and pressing it into the ground
  Roller(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.4);
    const roll = Math.min(1, share * 1.6);
    const centre = backToward(at, stage.source, reach * 2.5 * (1 - roll));
    // Turning forward, toward whichever side it is rolling
    const way = Math.abs(kit.angleOn(stage.source, at)) < Math.PI / 2 ? -1 : 1;
    const turn = roll * TAU * 3 * way;
    const kept = late(share, 0.7);

    kit.ring(centre, reach * 0.9, 0.12, colour, kept);
    for (let spike = 0; spike < 10; spike += 1) {
      const angle = turn + (spike / 10) * TAU;

      kit.streak(
        aside(kit, centre, Math.cos(angle) * reach * 1.1, Math.sin(angle) * reach * 1.1),
        reach * 0.2,
        reach * 0.12,
        angle,
        light,
        kept,
      );
    }
    if (roll < 1) {
      return;
    }
    const hit = (share * 1.6 - 1) / 0.6;

    kit.ripple(floor, reach * (0.8 + hit * 1.6), 0.1, colour, decay(hit));
    smoke(kit, floor, reach, 5, seed, hit, mix(colour, '#b9a58a', 0.6), decay(hit) * 0.5);
  },

  // Its own strength drawn out of it in a ring of light and turned back on it in a dark blow
  Turnabout(kit, stage, share, { paint }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const dark = mix(paint.color, '#0a0610', 0.5);
    const light = lighten(paint.color, 0.6);

    if (share < TURN_BACK) {
      const pull = share / TURN_BACK;
      const out = reach * (0.4 + pull * 1.2);

      kit.ring(at, out, 0.1, dark, pull * 0.8, { add: 0 });
      for (let mote = 0; mote < 8; mote += 1) {
        const angle = (mote / 8) * TAU + pull * TAU;

        kit.glow(
          aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.7),
          reach * 0.14,
          light,
          swell(pull),
          0.8,
        );
      }
      return;
    }
    const hit = (share - TURN_BACK) / (1 - TURN_BACK);

    kit.glow(at, reach * (0.6 + hit * 1.2), dark, decay(hit) * 0.8, 0, { add: 0 });
    kit.ring(at, reach * (1.6 - hit * 1.2), 0.08, light, decay(hit));
    kit.star(at, reach * 0.9 * decay(hit), hit, light, decay(hit));
  },

  // A horn driven into it, and green light flowing back out of it to the pokemon that used it
  Leech(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.4);
    const stab = Math.min(1, share * 4);
    const drawing = Math.min(1, Math.max(0, (share - 0.2) * 5));
    const tail = backToward(at, stage.source, reach * (2.2 - stab * 0.8));
    const tip = backToward(at, stage.source, reach * (0.8 - stab * 0.8));

    // A streak is pointed at both ends, which is the horn's point
    kit.streak(
      toward(tail, tip, 0.5),
      reach * 0.7,
      reach * 0.22,
      kit.angleOn(tail, tip),
      light,
      Math.max(0, 1 - share * 2),
    );
    kit.ring(at, reach * (0.4 + share), 0.08, colour, decay(share));
    for (let mote = 0; mote < many(6, weight); mote += 1) {
      const held = (share * 1.3 + noise(seed, mote) * 0.5) % 1;

      kit.glow(
        aside(kit, toward(at, stage.source, held), 0, Math.sin(Math.PI * held) * reach * 0.5),
        reach * 0.12,
        light,
        swell(held) * drawing,
        0.8,
      );
    }
  },

  // Rushing in behind speed lines, a hard hit, and the jolt of it thrown back at the pokemon that rammed it
  Ram(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    if (share < RAM_HITS + 0.15) {
      const rush = Math.min(1, share / RAM_HITS);
      const front = backToward(at, stage.source, reach * (3 - rush * 2.4));
      const tail = backToward(at, stage.source, reach * (4.4 - rush * 2.4));
      const alpha = Math.max(0, 1 - Math.max(0, share - RAM_HITS) / 0.15);

      for (let line = 0; line < 5; line += 1) {
        const off = (line - 2) * reach * 0.35;

        kit.trail(aside(kit, tail, 0, off), aside(kit, front, 0, off), reach * 0.05, light, alpha);
      }
    }
    if (share < RAM_HITS) {
      return;
    }
    const hit = (share - RAM_HITS) / (1 - RAM_HITS);

    kit.pool(floorOf(at), reach * 2, colour, decay(hit) * 0.6);
    kit.star(at, reach * (1 + hit) * decay(hit), 0, '#ffffff', decay(hit));
    kit.ring(at, reach * (0.6 + hit * 1.8), 0.1, light, decay(hit));
    sparks(kit, at, reach * (1.2 + hit * 1.4), 12, seed, hit, light, decay(hit));
    sparks(
      kit,
      backToward(at, stage.source, reach * 1.2),
      reach * (0.4 + hit * 0.6),
      5,
      seed + 1,
      hit,
      light,
      decay(hit),
    );
  },

  // A ring of fire closing in on it and flaring up round it
  Blaze(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.6);
    const close = settle(share * 2);
    const shown = showing(share, 6, 0.75);
    const round = reach * (2 - close * 1.3);
    const count = many(14, weight);

    kit.pool(floor, round, colour, shown * 0.4);
    kit.ripple(floor, round, 0.1, colour, shown * 0.7);
    if (close > 0.8) {
      kit.glow(at, reach * (0.8 + swell(share) * 0.6), hot, shown * 0.6, 0.8);
    }
    for (let lick = 0; lick < count; lick += 1) {
      const angle = (lick / count) * TAU + share * TAU;
      const rise = (share * 2 + noise(seed, lick)) % 1;

      kit.glow(
        [
          floor[0] + Math.cos(angle) * round,
          reach * 0.2 + rise * reach * close * 2.2,
          floor[2] + Math.sin(angle) * round,
        ],
        reach * 0.35 * (1 - rise * 0.5),
        rise < 0.4 ? hot : colour,
        swell(rise) * shown,
        rise < 0.4 ? 0.6 : 0.1,
      );
    }
  },

  // Flames swirling in on it like wings in a dance, and flaring as they all arrive
  Firedance(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.6);
    const count = many(8, weight);
    const land = Math.max(0, (share - 0.6) / 0.4);

    for (let flame = 0; flame < count; flame += 1) {
      const held = share * 1.5 - (flame / count) * 0.5;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const angle = flame * 2.3 + held * Math.PI * 3;
      const round = reach * 2 * (1 - held);
      const spot: Spot = [
        at[0] + Math.cos(angle) * round,
        at[1] + Math.sin(held * Math.PI) * reach * 0.6,
        at[2] + Math.sin(angle) * round,
      ];

      kit.glow(spot, reach * 0.3, hot, 0.7, 0.5);
      kit.leaf(spot, reach * 0.35 * (1 - held * 0.4), angle * 2, flame % 2 === 0 ? hot : colour, 1);
    }
    if (land > 0) {
      kit.glow(at, reach * (0.6 + land * 0.8), hot, decay(land));
      kit.ring(at, reach * (0.5 + land * 1.6), 0.08, colour, decay(land));
    }
  },

  // A fireball bursting on it, flinging embers out to either side
  Spatter(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.6);

    kit.glow(at, reach * (0.6 + share * 1.2), hot, decay(share));
    kit.ring(at, reach * (0.4 + share * 1.6), 0.1, colour, decay(share));
    for (let ember = 0; ember < many(8, weight); ember += 1) {
      const side = ember % 2 === 0 ? -1 : 1;
      const out = reach * (0.6 + noise(seed, ember) * 2.4) * share;
      const lift = Math.sin(share * Math.PI) * reach * (0.6 + noise(seed, ember + 10) * 1.2);

      kit.glow(
        aside(
          kit,
          at,
          side * out,
          lift - share * reach * 0.6,
          spread(seed, ember + 20) * reach * 0.5,
        ),
        reach * 0.18 * (1 - share * 0.5),
        ember % 3 === 0 ? hot : colour,
        decay(share),
        0.6,
      );
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default unova;
