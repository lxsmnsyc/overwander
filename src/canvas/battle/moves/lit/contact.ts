import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, STRIKES, many } from '../effect/shapes';
import { TAU, bolt, bone, debris, smoke, sparks, spiral } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, reachOf, staged, toward } from './shapes';

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
  Jaws(kit, stage, share, { paint, weight }) {
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
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default contact;
