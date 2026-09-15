import { Types } from '../../../../data/constants/types';
import type { Spot } from '../../../three/effect-batch';
import {
  CRASH_AURA,
  CUTTER_CUTS,
  FLURRY_BLOWS,
  HAYMAKER_CHARGE,
  PETAL,
  RAMPAGE_BLOWS,
} from '../effect/contact';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, IMBUED, STRIKES, many } from '../effect/shapes';
import { TAU, bolt, bone, debris, gathering, imbue, sickle, smoke, sparks, spiral } from './pieces';
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

/** A spot `distance` back from `at` along the ground toward the caster */
export function backToward(at: Spot, from: Spot, distance: number): Spot {
  const dx = from[0] - at[0];
  const dz = from[2] - at[2];
  const length = Math.max(1e-3, Math.hypot(dx, dz));

  return [at[0] + (dx / length) * distance, at[1], at[2] + (dz / length) * distance];
}

/**
 * The blows that touch, in the battle scene: the same shapes as the
 * painted ones, with the floor answering the heavy ones.
 */
const contact = {
  // A hit: a flash, sparks and chips leaving the point at once
  Impact(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const fade = decay(share);

    kit.glow(
      at,
      reach * (0.35 + share * 0.5),
      lighten(colour, 0.4),
      decay(Math.min(1, share * 2.2)),
      0.8,
    );
    kit.star(
      at,
      reach * (0.7 + share * 0.4),
      noise(seed, 1) * 0.8,
      lighten(colour, 0.6),
      decay(Math.min(1, share * 1.6)),
    );
    sparks(
      kit,
      at,
      reach * (0.9 + share * 0.3),
      many(7, weight),
      seed,
      share,
      lighten(colour, 0.5),
      fade,
    );
    debris(
      kit,
      at,
      reach * 0.6,
      many(4, weight),
      seed,
      share,
      mix(colour, '#cfc6b8', 0.3),
      fade * 0.9,
    );
    // Only a heavy hit shakes the ground it landed on
    if (weight > 1.2) {
      kit.ripple(floorOf(at), reach * (0.5 + share * 1.5), 0.08, lighten(colour, 0.3), fade * 0.5);
    }
  },

  // Over before it opened: out at once rather than growing
  Jab(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const out = Math.min(1, share * 3);
    const fade = decay(share);

    kit.glow(at, reach * 0.35 * fade, lighten(colour, 0.5), fade);
    kit.star(at, reach * (0.3 + out * 0.4), 0.4, lighten(colour, 0.6), fade);
    sparks(kit, at, reach * (0.4 + out * 0.4), 3, seed, out, lighten(colour, 0.4), fade);
  },

  // The whole body arriving: the floor answers with a wave and dust
  Slam(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const fade = decay(share);

    kit.pool(floor, reach * 1.6, '#1a120c', swell(share) * 0.35, { add: 0 });
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(share, 1.3, wave * 0.25);

      if (held > 0) {
        kit.ripple(
          floor,
          reach * (0.5 + held * 2.2),
          0.09,
          lighten(colour, 0.3),
          decay(held) * 0.9,
        );
      }
    }
    kit.glow(
      at,
      reach * (0.4 + share * 0.5),
      lighten(colour, 0.4),
      decay(Math.min(1, share * 2)),
      0.7,
    );
    sparks(
      kit,
      at,
      reach * (0.7 + share * 0.5),
      many(5, weight),
      seed,
      share,
      lighten(colour, 0.5),
      fade,
    );
    smoke(kit, floor, reach, 5, seed, share, mix(colour, '#b9a58a', 0.6), swell(share) * 0.45);
    debris(
      kit,
      floor,
      reach * 0.8,
      many(6, weight),
      seed,
      share,
      mix(colour, '#6b5440', 0.45),
      fade,
    );
  },

  // A fist or a foot, with the swing that brought it still behind it
  Brawl(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const fade = decay(share);

    if (share < 0.4) {
      // Square to where it came from, so the blow reads as thrown
      const swing = kit.angleOn(stage.source, at) + Math.PI / 2;
      const radius = reach * (1.4 - share);
      const path: Spot[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const turn = -0.9 + (step / 8) * 1.8;
        const x = Math.cos(turn) * radius;
        const y = Math.sin(turn) * radius * 0.75;

        path.push(
          aside(
            kit,
            at,
            x * Math.cos(swing) - y * Math.sin(swing),
            x * Math.sin(swing) + y * Math.cos(swing),
          ),
        );
      }
      kit.ribbon(path, reach * 0.12, lighten(colour, 0.3), (0.4 - share) * 2);
    }
    kit.glow(at, reach * 0.5, colour, decay(Math.min(1, share * 2)) * 0.8, 0.8);
    kit.ring(at, reach * (0.2 + Math.min(1, share * 2.4) * 0.8), 0.12, lighten(colour, 0.4), fade);
    sparks(
      kit,
      at,
      reach * (0.6 + share * 0.4),
      many(5, weight),
      seed,
      share,
      lighten(colour, 0.5),
      fade,
    );
  },

  // Lightning, from the sky
  Strike(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const flick = Math.floor(share * 14);
    const bright = (share < 0.5 ? 1 : decay(share) * 2) * (flick % 3 === 2 ? 0.55 : 1);

    bolt(
      kit,
      [at[0], at[1] + reach * 9, at[2]],
      at,
      seed + flick * 11,
      reach,
      reach * 0.22 * weight,
      colour,
      bright,
    );
    kit.pool(floor, reach * 2, colour, bright * 0.6);
    kit.ripple(floor, reach * (0.4 + share * 1.6), 0.08, lighten(colour, 0.4), decay(share));
    kit.glow(at, reach * 0.8, lighten(colour, 0.4), bright * 0.7);
    sparks(kit, at, reach, many(6, weight), seed, share, lighten(colour, 0.5), decay(share));
  },

  // A mouth closing on it: two rows of teeth that meet
  Jaws(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const gap = reach * (1 - share) * 0.9 + reach * 0.12;
    const bite = share < 0.8 ? 1 : decay(share) * 5;
    const tooth = mix(colour, '#ffffff', 0.7);

    for (const side of [-1, 1]) {
      for (let one = 0; one < 4; one += 1) {
        kit.shard(
          aside(kit, at, (one / 3 - 0.5) * reach * 1.5, side * gap),
          reach * 0.26,
          side > 0 ? Math.PI : 0,
          tooth,
          bite,
          { add: 0.2 },
        );
      }
      const gum = side * (gap + reach * 0.28);

      kit.ribbon(
        [
          aside(kit, at, -reach * 0.95, gum),
          aside(kit, at, 0, gum + side * reach * 0.08),
          aside(kit, at, reach * 0.95, gum),
        ],
        reach * 0.12,
        colour,
        bite,
        0,
        { add: 0.5 },
      );
    }
    if (share > 0.75) {
      const snap = (share - 0.75) / 0.25;

      kit.star(at, reach * (0.4 + snap), 0.3, lighten(colour, 0.6), decay(snap));
      sparks(kit, at, reach * (0.5 + snap * 0.5), 5, 3, snap, lighten(colour, 0.5), decay(snap));
    }
    // A bite in an element breaks it off as the jaws meet
    if (share > 0.6 && IMBUED.has(type)) {
      imbue(kit, at, reach, (share - 0.6) / 0.4, seed, type, colour, many(8, weight));
    }
  },

  // A rampage: heavy blows landing on it one after another, and petals flying where the move is a dance of them
  Rampage(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;

    kit.pool(floor, reach * 1.8, '#1a120c', swell(share) * 0.35, { add: 0 });
    for (let blow = 0; blow < RAMPAGE_BLOWS; blow += 1) {
      const held = share * RAMPAGE_BLOWS - blow;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const angle = noise(seed, blow) * TAU;
      const spot = aside(kit, at, Math.cos(angle) * reach * 0.5, Math.sin(angle) * reach * 0.4);

      kit.glow(
        spot,
        reach * (0.5 + held * 0.5),
        lighten(colour, 0.5),
        decay(Math.min(1, held * 2)),
        0.9,
      );
      kit.star(spot, reach * (0.7 + held * 0.6), angle, lighten(colour, 0.6), decay(held));
      kit.ring(spot, reach * (0.3 + held), 0.12, lighten(colour, 0.4), decay(held));
      kit.ripple(floor, reach * (0.5 + held * 2), 0.09, lighten(colour, 0.3), decay(held) * 0.9);
      sparks(
        kit,
        spot,
        reach * (0.8 + held * 0.4),
        many(6, weight),
        seed + blow,
        held,
        lighten(colour, 0.5),
        decay(held),
      );
    }
    if (type !== Types.Grass) {
      return;
    }
    for (let one = 0; one < many(10, weight); one += 1) {
      kit.leaf(
        thrown(at, seed, one + 20, share, reach * 2, reach * 1.2),
        reach * 0.2,
        noise(seed, one + 5) * TAU + share * 7,
        PETAL,
        late(share, 0.6),
      );
    }
  },

  // Claws raked across it: parallel cuts, one after another
  Claw(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const cuts = many(3, weight);
    const edge = lighten(paint.color, 0.45);

    for (let one = 0; one < cuts; one += 1) {
      const held = staged(share, cuts, one);

      if (held <= 0) {
        continue;
      }
      const off = (one - (cuts - 1) / 2) * reach * 0.42;
      const from = aside(kit, at, -reach * 0.9 + off, reach * 0.9);
      const to = aside(kit, at, reach * 0.9 + off, -reach * 0.9);
      const drawn = Math.min(1, held * 2.5);
      const path: Spot[] = [];

      for (let step = 0; step <= 6; step += 1) {
        const along = (step / 6) * drawn;
        const bow = Math.sin(Math.PI * along) * reach * 0.25;

        path.push(aside(kit, toward(from, to, along), bow * 0.7, bow * 0.7));
      }
      kit.ribbon(path, reach * 0.14, edge, decay(held));
    }
  },

  // One point driven in: a beak, a horn, a needle
  Spike(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const out = Math.min(1, share * 2.2);

    kit.ribbon(
      [toward(stage.source, at, Math.max(0, out - 0.35)), toward(stage.source, at, out)],
      reach * 0.16,
      lighten(colour, 0.4),
      Math.min(1, decay(share) * 1.4),
    );
    if (share > 0.4) {
      const hit = (share - 0.4) / 0.6;

      kit.star(at, reach * (0.5 + hit * 0.6), 0.2, lighten(colour, 0.6), decay(hit));
      sparks(kit, at, reach * (0.3 + hit), 5, 5, hit, colour, decay(hit));
    }
  },

  // The same point, turning
  Drill(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;

    kit.glow(at, reach * 0.4, colour, 0.6, 0.8);
    spiral(
      kit,
      at,
      reach * (1 - share * 0.5),
      3,
      share * 2,
      lighten(colour, 0.35),
      0.9,
      reach * 0.1,
    );
    if (share > 0.6) {
      const bore = (share - 0.6) / 0.4;

      sparks(kit, at, reach * (0.3 + bore * 1.2), 7, 9, bore, lighten(colour, 0.5), decay(bore));
    }
  },

  // A whip: it reaches, it cracks, it is gone
  Lash(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const out = Math.min(1, share * 2.5);
    const bow = reach * (1 - share) * 1.2;
    const path: Spot[] = [];

    for (let step = 0; step <= 10; step += 1) {
      path.push(
        aside(
          kit,
          toward(stage.source, at, (step / 10) * out),
          0,
          Math.sin((Math.PI * step) / 10) * bow,
        ),
      );
    }
    kit.ribbon(path, reach * 0.12, colour, Math.min(1, decay(share) * 1.5), 0, { add: 0.3 });
    if (out >= 1) {
      kit.star(at, reach * 0.8, 0.5, lighten(colour, 0.6), Math.min(1, decay(share) * 1.5));
      sparks(kit, at, reach * 0.7, 4, 11, share, lighten(colour, 0.5), decay(share));
    }
  },

  // Wound round it, tightening: level rings the pokemon hides the back of
  Coil(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const band = lighten(paint.color, 0.2);

    for (let loop = 0; loop < 4; loop += 1) {
      const along = loop / 3;
      const held = staged(share, 1.6, along * 0.4);

      if (held <= 0) {
        continue;
      }
      kit.ripple(
        [at[0], at[1] - reach * 0.8 + along * reach * 1.6, at[2]],
        reach * (1 - share * 0.35) * 0.8,
        0.14,
        band,
        Math.min(1, swell(held) + 0.25),
      );
    }
  },

  // Thrown, hits, and comes back hitting again
  Boomerang(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const held = share < 0.5 ? share * 2 : (1 - share) * 2;
    const spot = aside(
      kit,
      toward(stage.source, at, held),
      0,
      Math.sin(Math.PI * held) * reach * 0.6,
    );

    bone(kit, spot, reach * 1.1, share * Math.PI * 6, lighten(colour, 0.2), 1, reach * 0.14);
    // One strike as it arrives and one as it passes back through
    for (const beat of [0.5, 0.85]) {
      const since = (share - beat) / 0.15;

      if (since <= 0 || since >= 1) {
        continue;
      }
      kit.star(at, reach * (0.5 + since * 0.5), beat, lighten(colour, 0.6), decay(since));
      sparks(
        kit,
        at,
        reach * (0.5 + since),
        5,
        beat * 100,
        since,
        lighten(colour, 0.4),
        decay(since),
      );
    }
  },

  // A fist that lands with its element breaking off it
  Punch(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const out = Math.min(1, share * 2.5);

    kit.glow(
      at,
      reach * (0.4 + out * 0.4),
      lighten(colour, 0.5),
      decay(Math.min(1, share * 2)),
      0.9,
    );
    kit.ring(at, reach * (0.2 + out * 0.8), 0.14, lighten(colour, 0.4), decay(share));
    kit.star(
      at,
      reach * (0.6 + out * 0.5),
      0.4,
      lighten(colour, 0.6),
      decay(Math.min(1, share * 1.6)),
    );
    imbue(kit, at, reach, share, seed, type, colour, many(8, weight));
  },

  // A ring of fire rolled in from the caster's side, bursting as it arrives
  Wheel(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const hot = mix(colour, '#ffd84a', 0.6);
    const roll = Math.min(1, share * 2);
    const centre = backToward(at, stage.source, reach * 2.5 * (1 - roll));
    const rim = share < 0.5 ? 1 : decay((share - 0.5) * 2);
    // Turning forward, toward whichever side of the picture the target is on
    const way = Math.cos(kit.angleOn(stage.source, at)) < 0 ? 1 : -1;

    kit.glow(centre, reach * 0.9, colour, rim * 0.35, 0.2);
    kit.ring(centre, reach * 0.8, 0.18, hot, rim * 0.8);
    for (let lick = 0; lick < 12; lick += 1) {
      const angle = (lick / 12) * TAU + share * TAU * 3 * way;

      kit.glow(
        aside(kit, centre, Math.cos(angle) * reach * 0.8, Math.sin(angle) * reach * 0.8),
        reach * 0.3,
        lick % 2 === 0 ? hot : colour,
        rim * 0.9,
        0.4,
      );
    }
    if (roll < 1) {
      return;
    }
    const hit = (share - 0.5) * 2;

    kit.pool(floorOf(at), reach * 1.6, colour, decay(hit) * 0.6);
    kit.ring(at, reach * (0.8 + hit * 1.6), 0.1, hot, decay(hit));
    sparks(kit, at, reach * 1.4, many(8, weight), seed, hit, hot, decay(hit));
  },

  // A column of water driven up through it from the ground, and the spray coming back down
  Torrent(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const foam = lighten(colour, 0.55);
    const up = Math.min(1, share * 2.5);
    const fade = late(share, 0.55);
    const top: Spot = [floor[0], reach * 4.2 * up, floor[2]];
    const width = reach * 0.7 * (1 - share * 0.3);
    const fall = Math.max(0, (share - 0.25) / 0.75);
    const path: Spot[] = [];

    for (let step = 0; step <= 8; step += 1) {
      path.push(toward(floor, top, step / 8));
    }
    kit.pool(floor, reach * (1 + share * 1.2), colour, fade * 0.5, { add: 0.4 });
    kit.ribbon(path, width * 2, colour, fade * 0.35, share * 12);
    kit.ribbon(path, width, lighten(colour, 0.25), fade, share * 16);
    kit.glow(top, reach * 0.6 * up, foam, fade * 0.6, 0.6);
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(share, 1.4, wave * 0.3);

      if (held > 0) {
        kit.ripple(floor, reach * (0.4 + held * 2), 0.1, foam, decay(held) * 0.9);
      }
    }
    for (let drop = 0; drop < many(12, weight); drop += 1) {
      kit.trail(
        thrown(top, seed, drop, Math.max(0, fall - 0.07), reach * 1.8, reach * 0.8),
        thrown(top, seed, drop, fall, reach * 1.8, reach * 0.8),
        reach * 0.06,
        foam,
        late(fall, 0.6) * 0.9 * Math.min(1, fall * 10),
      );
    }
  },

  // The whole body arriving wrapped in its element, with the rush that brought it still behind it
  Rush(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const fade = decay(share);
    const tail = backToward(at, stage.source, reach * 3);
    const head = backToward(at, stage.source, reach * 0.8);

    for (let line = 0; line < 4; line += 1) {
      const up = (line - 1.5) * reach * 0.4;

      kit.trail(
        aside(kit, tail, 0, up),
        aside(kit, head, 0, up),
        reach * 0.05,
        lighten(colour, 0.4),
        decay(Math.min(1, share * 2.5)) * 0.8,
      );
    }
    kit.pool(floor, reach * 1.6, '#1a120c', swell(share) * 0.35, { add: 0 });
    kit.ripple(floor, reach * (0.5 + share * 2.2), 0.09, lighten(colour, 0.3), fade * 0.9);
    kit.glow(at, reach * (0.9 + swell(share) * 0.5), colour, fade * 0.5, 0.3);
    debris(
      kit,
      floor,
      reach * 0.8,
      many(6, weight),
      seed,
      share,
      mix(colour, '#6b5440', 0.45),
      fade,
    );
    imbue(kit, at, reach * 1.3, share, seed, type, colour, many(10, weight));
  },

  // Several strikes rather than one, each landing a little apart
  Volley(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;

    for (let strike = 0; strike < STRIKES; strike += 1) {
      const held = share * STRIKES - strike;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const angle = noise(seed, strike) * TAU;
      const spot = aside(kit, at, Math.cos(angle) * reach * 0.5, Math.sin(angle) * reach * 0.4);

      kit.glow(spot, reach * 0.4 * decay(held), lighten(colour, 0.4), decay(held), 0.9);
      kit.star(spot, reach * (0.3 + held * 0.4), angle, lighten(colour, 0.6), decay(held));
      sparks(
        kit,
        spot,
        reach * (0.3 + held * 0.5),
        6,
        seed + strike,
        held,
        lighten(colour, 0.4),
        decay(held),
      );
    }
  },

  // Blown off the field: everything streams one way, away from whoever let it go
  Blow(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const dx = at[0] - stage.source[0];
    const dz = at[2] - stage.source[2];
    const length = Math.max(1e-3, Math.hypot(dx, dz));
    const ux = dx / length;
    const uz = dz / length;
    const gust = lighten(paint.color, 0.4);

    for (let streak = 0; streak < many(6, weight); streak += 1) {
      const held = (share * 1.5 + noise(seed, streak)) % 1;
      const off = spread(seed, streak + 20) * reach;
      const out = held * reach * 3;
      const from: Spot = [
        at[0] + ux * out - uz * off,
        Math.max(0.1, at[1] + spread(seed, streak + 40) * reach * 0.6),
        at[2] + uz * out + ux * off,
      ];

      kit.trail(
        from,
        [from[0] + ux * reach * 0.8, from[1], from[2] + uz * reach * 0.8],
        reach * 0.06,
        gust,
        swell(held) * 0.9,
      );
    }
  },

  // Out and back: thrown, strikes where it turns, and comes home
  Dart(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const held = share < 0.5 ? share * 2 : (1 - share) * 2;
    // Behind it is toward the caster on the way out and toward the target on the way home
    const behind = Math.min(1, Math.max(0, held - (share < 0.5 ? 0.24 : -0.24)));

    kit.trail(
      toward(stage.source, at, behind),
      toward(stage.source, at, held),
      reach * 0.3,
      lighten(colour, 0.2),
      0.45,
    );
    kit.glow(toward(stage.source, at, held), reach * 0.4, colour, 1, 0.7);

    const since = (share - 0.45) / 0.2;

    if (since > 0 && since < 1) {
      kit.star(at, reach * (0.5 + since), 0.3, lighten(colour, 0.6), decay(since));
      sparks(kit, at, reach * (0.5 + since), 6, 41, since, lighten(colour, 0.4), decay(since));
    }
  },

  // Two cuts across each other, held until they go together so an X is read rather than two rakes
  Cross(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const edge = lighten(paint.color, 0.45);
    const alpha = share < 0.6 ? 1 : Math.min(1, decay(share) * 2.5);

    for (const [cut, way] of [
      [0, 1],
      [1, -1],
    ] as const) {
      if (share - cut * 0.18 <= 0) {
        continue;
      }
      // A streak is pointed at both ends, which is the blade's taper
      const angle = kit.angleOn(
        aside(kit, at, -reach * way, reach),
        aside(kit, at, reach * way, -reach),
      );

      kit.streak(at, reach * 1.41, reach * 0.15, angle, edge, alpha);
    }
  },
  // Everything it has thrown into one blow: wrapped in a dark aura, and the floor answering with a wide wave
  Crash(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const fade = decay(share);
    const tail = backToward(at, stage.source, reach * 3.4);
    const head = backToward(at, stage.source, reach * 0.6);

    for (let line = 0; line < 5; line += 1) {
      const up = (line - 2) * reach * 0.4;

      kit.trail(
        aside(kit, tail, 0, up),
        aside(kit, head, 0, up),
        reach * 0.08,
        CRASH_AURA,
        decay(Math.min(1, share * 2.5)) * 0.8,
      );
    }
    kit.pool(floor, reach * 2.2, '#140a1c', swell(share) * 0.5, { add: 0 });
    kit.glow(at, reach * (1.2 + swell(share) * 0.8), CRASH_AURA, fade * 0.7, 0.2);
    kit.glow(
      at,
      reach * (0.5 + share * 0.6),
      lighten(colour, 0.6),
      decay(Math.min(1, share * 2)),
      1,
    );
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(share, 1.3, wave * 0.2);

      if (held > 0) {
        kit.ripple(
          floor,
          reach * (0.6 + held * 3.2),
          0.08,
          lighten(CRASH_AURA, 0.4),
          decay(held) * 0.9,
        );
      }
    }
    debris(kit, floor, reach, many(10, weight), seed, share, mix(colour, '#6b5440', 0.45), fade);
    sparks(kit, at, reach * 1.6, many(8, weight), seed, share, lighten(CRASH_AURA, 0.5), fade);
  },

  // A fist charged until it glows, then a blow that goes off like a blast
  Haymaker(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    if (share < HAYMAKER_CHARGE) {
      const charge = share / HAYMAKER_CHARGE;

      gathering(kit, at, reach * 1.8, 12, seed, share * 2, light);
      kit.glow(at, reach * (0.2 + charge * 0.5), light, 0.4 + charge * 0.6, 0.9);
      kit.ring(at, reach * (1.4 - charge), 0.08, colour, charge);
      return;
    }
    const hit = (share - HAYMAKER_CHARGE) / (1 - HAYMAKER_CHARGE);

    kit.pool(floor, reach * (1.6 + hit * 1.4), colour, decay(hit) * 0.7);
    kit.glow(at, reach * (0.6 + hit * 1.4), light, decay(hit), 0.9);
    kit.star(at, reach * (1 + hit * 1.5), 0.4, '#ffffff', decay(Math.min(1, hit * 1.5)));
    kit.ring(at, reach * (0.5 + hit * 2.4), 0.07, light, decay(hit));
    kit.ripple(floor, reach * (0.6 + hit * 2.8), 0.07, lighten(colour, 0.3), decay(hit) * 0.9);
    smoke(kit, at, reach, 4, seed, hit, mix(colour, '#2a2424', 0.8), swell(hit) * 0.4);
    debris(kit, at, reach, many(8, weight), seed, hit, mix(colour, '#5b4636', 0.5), decay(hit));
    sparks(kit, at, reach * 1.6, many(8, weight), seed, hit, lighten(colour, 0.6), decay(hit));
  },

  // A flurry of quick blows all over it, then a last one that throws it back
  Flurry(kit, stage, share, { paint, seed }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    for (let blow = 0; blow < FLURRY_BLOWS; blow += 1) {
      const held = (share - (blow / FLURRY_BLOWS) * 0.7) / 0.15;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const spot = aside(
        kit,
        at,
        spread(seed, blow) * reach * 0.7,
        spread(seed, blow + 5) * reach * 0.6,
      );

      kit.glow(spot, reach * 0.4 * decay(held), light, decay(held), 0.9);
      kit.star(spot, reach * (0.4 + held * 0.4), blow, '#ffffff', decay(held));
      sparks(kit, spot, reach * (0.4 + held * 0.4), 4, seed + blow, held, light, decay(held));
    }
    if (share <= 0.75) {
      return;
    }
    const last = (share - 0.75) / 0.25;

    kit.glow(at, reach * (0.8 + last), light, decay(last), 0.9);
    kit.ring(at, reach * (0.5 + last * 2), 0.1, light, decay(last));
    kit.ripple(floor, reach * (0.6 + last * 2.4), 0.08, lighten(colour, 0.3), decay(last) * 0.9);
  },

  // Kicks landing from alternating sides, one a strike, each swinging in on its own arc
  Kicks(kit, stage, share, { paint, seed, hits = 2 }) {
    const at = landed(stage);
    const reach = reachOf(stage);
    const colour = paint.color;
    const light = lighten(colour, 0.5);
    const count = Math.max(2, Math.round(hits));

    for (let kick = 0; kick < count; kick += 1) {
      const held = share * count - kick;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const side = kick % 2 === 0 ? -1 : 1;
      // Each one harder than the last, the way Triple Kick's power climbs
      const big = reach * (1 + kick * 0.25);
      const swing = Math.min(1, held * 2.5);
      const path: Spot[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const along = (step / 8) * swing;

        path.push(
          aside(
            kit,
            at,
            side * big * 1.4 * (1 - along),
            big * (-0.5 + along * 0.5) - Math.sin(along * Math.PI) * big * 0.4,
          ),
        );
      }
      kit.ribbon(path, big * 0.14, light, decay(held) * 0.8);
      if (swing < 1) {
        continue;
      }
      const hit = (held - 0.4) / 0.6;

      kit.glow(at, big * 0.5, light, decay(hit), 0.9);
      kit.star(at, big * (0.6 + hit * 0.5), side, lighten(colour, 0.6), decay(hit));
      sparks(kit, at, big * (0.6 + hit * 0.5), 5, seed + kick, hit, light, decay(hit));
    }
  },

  // One long blade drawn across it, shedding leaves off the cut
  Sweep(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const drawn = Math.min(1, share * 3);
    const shown = late(share, 0.55);
    const from = aside(kit, at, -reach * 1.5, reach * 0.7);
    const to = aside(kit, at, reach * 1.5, -reach * 0.7);
    const middle = toward(from, toward(from, to, drawn), 0.5);
    const angle = kit.angleOn(from, to);

    // A streak is pointed at both ends, which is the blade's taper
    kit.streak(middle, reach * 1.65 * drawn, reach * 0.24, angle, colour, shown, { add: 0.4 });
    kit.streak(middle, reach * 1.65 * drawn, reach * 0.08, angle, lighten(colour, 0.7), shown);
    for (let one = 0; one < many(6, weight); one += 1) {
      const along = noise(seed, one);
      // Shed only once the blade has passed that point
      const held = (share - along / 3) / (1 - along / 3);

      if (held <= 0 || along > drawn) {
        continue;
      }
      kit.leaf(
        aside(
          kit,
          toward(from, to, along),
          spread(seed, one + 10) * reach * held,
          -reach * (held * 1.6 - 0.5) * held,
        ),
        reach * 0.2,
        held * 6 + one,
        colour,
        decay(held),
      );
    }
  },

  // A dark crescent swept round it in one stroke, with a pale edge
  Crescent(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const cut = Math.min(1, share / 0.3);
    const shown = late(share, 0.55);
    const start = Math.PI * 0.85;
    const end = start - Math.PI * 1.2 * cut;
    const dark = mix(colour, '#0a0610', 0.55);

    sickle(kit, at, reach * 1.2, start, end, reach * 0.6, dark, shown * 0.9, 0);
    sickle(kit, at, reach * 1.38, start, end, reach * 0.16, lighten(colour, 0.6), shown);
    if (cut >= 1) {
      const since = (share - 0.3) / 0.7;

      kit.star(at, reach * (0.8 + since), 0.4, lighten(colour, 0.6), decay(since));
      sparks(
        kit,
        at,
        reach * (0.8 + since * 1.2),
        8,
        seed,
        since,
        lighten(colour, 0.5),
        decay(since),
      );
      smoke(kit, at, reach * 0.6, 4, seed, since, dark, decay(since) * 0.5);
    }
  },

  // Crescent blades thrown from the pokemon: psychic ones spin, wind ones fly flat with air trailing
  Sickles(kit, stage, share, { paint, seed, weight, type }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.4);
    const heading = kit.angleOn(stage.source, at);
    const spins = type !== Types.Flying;

    for (let blade = 0; blade < 3; blade += 1) {
      const held = staged(share, 1.6, blade * 0.25);

      if (held <= 0) {
        continue;
      }
      const travel = Math.min(1, held * 1.6);

      if (travel < 1) {
        const centre = aside(
          kit,
          toward(stage.source, at, travel),
          0,
          spread(seed, blade) * reach * 0.7 * (1 - travel),
        );
        const turn = spins ? heading + travel * TAU * 2 : heading;

        sickle(kit, centre, reach * 0.55, turn - 1, turn + 1, reach * 0.3, light, 0.95);
        if (!spins) {
          kit.trail(
            aside(kit, centre, -Math.cos(heading) * reach * 1.4, -Math.sin(heading) * reach * 1.4),
            centre,
            reach * 0.05,
            '#ffffff',
            0.5,
          );
        }
        continue;
      }
      const hit = (held - 1 / 1.6) / (1 - 1 / 1.6);

      kit.streak(at, reach * (1.1 - blade * 0.25), reach * 0.14, 0.6, light, decay(hit));
      kit.glow(at, reach * 0.5, light, decay(hit) * 0.6, 0.8);
      sparks(kit, at, reach * (0.5 + hit * 0.8), 6, seed + blade, hit, light, decay(hit));
    }
  },

  // Cuts that come round again and again, each bigger and brighter than the last
  Cutter(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;

    for (let cut = 0; cut < CUTTER_CUTS; cut += 1) {
      const held = share * CUTTER_CUTS - cut;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const big = reach * (0.7 + cut * 0.35);
      const way = cut % 2 === 0 ? 1 : -1;
      const start = way > 0 ? Math.PI * 0.9 : Math.PI * 0.1;
      const drawn = Math.min(1, held * 3);

      sickle(
        kit,
        at,
        big,
        start,
        start - way * Math.PI * 1.1 * drawn,
        big * 0.35,
        lighten(colour, 0.2 + cut * 0.2),
        decay(held),
      );
      if (cut === CUTTER_CUTS - 1 && drawn >= 1) {
        kit.star(at, big * (0.6 + held), 0.3, lighten(colour, 0.6), decay(held));
        sparks(kit, at, big * (0.6 + held), 8, seed, held, lighten(colour, 0.6), decay(held));
      }
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default contact;
