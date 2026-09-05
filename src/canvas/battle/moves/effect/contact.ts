import type { Point } from '../../stage';
import {
  between,
  bolt,
  bone,
  burst,
  decay,
  jaw,
  lash,
  motes,
  noise,
  orb,
  ring,
  ripple,
  shards,
  slash,
  spiral,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, STRIKES, landing, many } from './shapes';

/**
 * The shapes a blow lands as when it touches: a fist, a tooth, a
 * claw, a thrown thing coming back
 */
const contact = {
  // A hit: everything leaves the point it landed on at once
  Impact(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    burst(context, at, size * (0.4 + share * 0.9), many(7, weight), seed, {
      ...paint,
      alpha: decay(share),
      width: 2.5 * stage.scale * weight,
    });
    shards(context, at, size, many(4, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 2 * stage.scale * weight,
    });
    // Only a heavy hit shakes the ground it landed on
    if (weight > 1.2) {
      ripple(context, at, size * (0.5 + share * 1.5), {
        ...paint,
        alpha: decay(share) * 0.5,
        width: 2 * stage.scale,
      });
    }
  },

  // A hit that is over before it opened: the moves whose whole point
  // is that they land first
  Jab(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    // Out at once rather than growing, which is the difference a
    // player reads between a jab and a swing
    const out = Math.min(1, share * 3);

    burst(context, at, size * (0.3 + out * 0.5), 3, seed, {
      ...paint,
      alpha: decay(share),
      width: 2 * stage.scale,
    });
    orb(context, at, size * 0.22 * decay(share), { ...paint, alpha: decay(share) });
  },

  // The whole body arriving. What says it is heavy is the floor
  // answering, not a bigger version of the same burst
  Slam(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    ripple(context, at, size * (0.5 + share * 2.2), {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 3.4 * stage.scale,
    });
    burst(context, at, size * (0.5 + share * 0.7), many(5, weight), seed, {
      ...paint,
      alpha: decay(share),
      width: 3.6 * stage.scale * weight,
    });
    // Kicked up rather than thrown off: the dust of something big
    // coming down on the floor
    motes(context, at, size * 1.9, many(8, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.7,
      width: 2.4 * stage.scale,
    });
  },

  // A fist or a foot: one point hit hard, with the swing that brought
  // it in still drawn behind it
  Brawl(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    // Square to where it came from, so the blow reads as thrown
    // rather than as something that happened on the spot
    const swing = Math.atan2(at[1] - stage.source[1], at[0] - stage.source[0]) + Math.PI / 2;

    if (share < 0.4) {
      slash(context, at, size * (1.4 - share), swing, {
        ...paint,
        alpha: (0.4 - share) * 2,
        width: 3 * stage.scale,
      });
    }
    ring(context, at, size * (0.2 + Math.min(1, share * 2.4) * 0.8), {
      ...paint,
      alpha: decay(share),
      width: 4 * stage.scale * weight,
    });
    burst(context, at, size * (0.4 + share * 0.6), many(4, weight), seed, {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 3 * stage.scale * weight,
    });
  },

  // Lightning, from the sky
  Strike(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const above: Point = [at[0], at[1] - size * 9];

    bolt(context, above, at, seed, {
      ...paint,
      alpha: share < 0.5 ? 1 : decay(share) * 2,
      width: 4 * stage.scale * weight,
    });
    ripple(context, at, size * (0.4 + share * 1.6), {
      ...paint,
      alpha: decay(share),
      width: 2.5 * stage.scale,
    });
  },

  // A mouth closing on it. The two halves start apart and meet, which
  // is the whole of what a bite is
  Jaws(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const gap = size * (1 - share) * 0.9;

    for (const side of [-1, 1]) {
      jaw(context, [at[0], at[1] + gap * side], size, side > 0 ? Math.PI : 0, {
        ...paint,
        alpha: share < 0.8 ? 1 : decay(share) * 5,
        width: 2.6 * stage.scale,
      });
    }
    if (share > 0.75) {
      burst(context, at, size * (share - 0.75) * 3, 5, 3, {
        ...paint,
        alpha: (1 - share) * 4,
        width: 2 * stage.scale,
      });
    }
  },

  // Claws raked across it: parallel cuts, one after another
  Claw(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const cuts = many(3, weight);

    for (let cut = 0; cut < cuts; cut += 1) {
      const held = Math.max(0, Math.min(1, share * cuts - cut));

      if (held <= 0) {
        continue;
      }
      const off = (cut - (cuts - 1) / 2) * size * 0.42;

      lash(
        context,
        [at[0] - size * 0.9 + off, at[1] - size * 0.9],
        [at[0] + size * 0.9 + off, at[1] + size * 0.9],
        size * 0.35,
        { ...paint, alpha: decay(held), width: 3 * stage.scale },
      );
    }
  },

  // One point driven in: a beak, a horn, a needle
  Spike(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const from = between(stage.source, at, Math.min(1, share * 2.2));

    lash(context, from, at, 0, {
      ...paint,
      alpha: decay(share) * 1.4,
      width: 3.4 * stage.scale,
    });
    if (share > 0.4) {
      burst(context, at, size * (share - 0.4), 5, 5, {
        ...paint,
        alpha: decay(share),
        width: 2 * stage.scale,
      });
    }
  },

  // The same point, turning: what a drill does that a horn does not
  Drill(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    spiral(context, at, size * (1 - share * 0.5), 3, share * 2, {
      ...paint,
      alpha: 0.9,
      width: 3 * stage.scale,
    });
    if (share > 0.6) {
      burst(context, at, size * (share - 0.6) * 2.5, 7, 9, {
        ...paint,
        alpha: decay(share) * 2,
        width: 2.4 * stage.scale,
      });
    }
  },

  // A whip: it reaches, it lands, it is gone
  Lash(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const reach = Math.min(1, share * 2.5);

    lash(context, stage.source, between(stage.source, at, reach), size * (1 - share) * 1.2, {
      ...paint,
      alpha: decay(share) * 1.5,
      width: 3 * stage.scale,
    });
    if (reach >= 1) {
      burst(context, at, size * 0.7, 4, 11, {
        ...paint,
        alpha: decay(share) * 1.5,
        width: 2 * stage.scale,
      });
    }
  },

  // Something wound round it, tightening
  Coil(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let loop = 0; loop < 4; loop += 1) {
      const along = loop / 3;
      const held = Math.max(0, Math.min(1, share * 1.6 - along * 0.4));

      if (held <= 0) {
        continue;
      }
      ring(context, [at[0], at[1] - size * 0.8 + along * size * 1.6], size * (1 - share * 0.35), {
        ...paint,
        alpha: swell(held) + 0.25,
        width: 3 * stage.scale,
      });
    }
  },

  // Thrown, hits, and comes back hitting again. Both strikes land on
  // the same pokemon — the return pass is the second one — so the
  // picture is one bone tumbling out and back, not a whip
  Boomerang(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    // Out for the first half, back for the second
    const held = share < 0.5 ? share * 2 : (1 - share) * 2;
    const spot = between(stage.source, at, held);

    bone(context, spot, size * 1.1, share * Math.PI * 6, {
      ...paint,
      alpha: 1,
      width: 3 * stage.scale,
    });
    // One strike as it arrives and one as it passes back through
    for (const beat of [0.5, 0.85]) {
      const since = (share - beat) / 0.15;

      if (since <= 0 || since >= 1) {
        continue;
      }
      burst(context, at, size * (0.5 + since), 5, beat * 100, {
        ...paint,
        alpha: decay(since),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Several strikes rather than one: the move lands two to five
  // times, a quarter of a second apart, and one picture for the lot of
  // them says the wrong thing about what just happened
  Volley(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let strike = 0; strike < STRIKES; strike += 1) {
      const held = Math.max(0, Math.min(1, share * STRIKES - strike));

      if (held <= 0 || held >= 1) {
        continue;
      }
      const angle = noise(seed, strike) * Math.PI * 2;
      const off: Point = [
        at[0] + Math.cos(angle) * size * 0.5,
        at[1] + Math.sin(angle) * size * 0.4,
      ];

      burst(context, off, size * (0.3 + held * 0.5), 6, seed + strike, {
        ...paint,
        alpha: decay(held),
        width: 2.2 * stage.scale,
      });
      shards(context, off, size * 0.8, 3, seed + strike, held, {
        ...paint,
        alpha: decay(held) * 0.8,
        width: 1.8 * stage.scale,
      });
    }
  },

  // Blown off the field: everything goes one way, away from whoever
  // let it go
  Blow(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dx = at[0] - stage.source[0];
    const dy = at[1] - stage.source[1];
    const length = Math.max(1, Math.hypot(dx, dy));

    for (let streak = 0; streak < many(5, weight); streak += 1) {
      const held = (share * 1.5 + noise(seed, streak)) % 1;
      const off = (noise(seed, streak + 20) - 0.5) * size * 2;
      const from: Point = [
        at[0] + (dx / length) * held * size * 3 - (dy / length) * off,
        at[1] + (dy / length) * held * size * 3 + (dx / length) * off,
      ];

      slash(context, from, size * 0.7, Math.atan2(dy, dx), {
        ...paint,
        alpha: swell(held) * 0.9,
        width: 2.4 * stage.scale,
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default contact;
