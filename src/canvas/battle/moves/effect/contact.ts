import { Types } from '../../../../data/constants/types';
import type { Point } from '../../stage';
import {
  type Painted,
  beam,
  between,
  bolt,
  bone,
  burst,
  decay,
  edge,
  jaw,
  lash,
  lighten,
  mix,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  shards,
  sickle,
  slash,
  spiral,
  spread,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { IMBUED, REACH, STRIKES, landing, many } from './shapes';

/** How many blows a rampage lands */
export const RAMPAGE_BLOWS = 3;

/** The colour of Petal Dance's petals, which the Grass type's green is not */
export const PETAL = '#f2a0c8';

/** The dark purple Giga Impact is wrapped in */
export const CRASH_AURA = '#7a3ad0';

/** Focus Punch: the share spent charging the fist before the blow */
export const HAYMAKER_CHARGE = 0.35;

/** How many quick blows Close Combat lands before its last one */
export const FLURRY_BLOWS = 7;

/** Fury Cutter: how many cuts it lands, each bigger than the last */
export const CUTTER_CUTS = 3;

/** A blow's element breaking off where it lands: flames, frost or sparks, and plain spokes for any other type */
export function imbue(
  context: CanvasRenderingContext2D,
  at: Point,
  size: number,
  share: number,
  seed: number,
  paint: Painted,
  type: Types,
  scale: number,
): void {
  const fade = decay(share);

  if (type === Types.Fire || type === Types.Flying) {
    // Flying's fire burns pale rather than yellow
    const hot = type === Types.Fire ? mix(paint.color, '#ffd84a', 0.6) : lighten(paint.color, 0.7);

    for (let lick = 0; lick < 5; lick += 1) {
      const rise = (share * 1.6 + noise(seed, lick)) % 1;

      orb(
        context,
        [at[0] + spread(seed, lick + 5) * size * 0.6, at[1] + size * 0.3 - rise * size * 1.6],
        size * 0.35 * (1 - rise * 0.6),
        { color: rise < 0.4 ? hot : paint.color, alpha: swell(rise) * fade },
      );
    }
    return;
  }
  if (type === Types.Ice) {
    shards(context, at, size * 1.4, 7, seed, share, {
      color: lighten(paint.color, 0.45),
      alpha: fade,
      width: 2.6 * scale,
    });
    return;
  }
  if (type === Types.Electric) {
    const flick = Math.floor(share * 16);

    for (let arc = 0; arc < 3; arc += 1) {
      const angle = noise(seed + flick, arc) * Math.PI * 2;

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * size * 1.3, at[1] + Math.sin(angle) * size * 1.3],
        seed + flick * 7 + arc,
        { ...paint, alpha: fade * (flick % 3 === 2 ? 0.5 : 1), width: 2 * scale },
      );
    }
    return;
  }
  burst(context, at, size * (0.5 + share * 0.8), 6, seed, {
    ...paint,
    alpha: fade,
    width: 2.4 * scale,
  });
}

/** A point `distance` back from `at` toward the caster */
export function backToward(at: Point, from: Point, distance: number): Point {
  const dx = from[0] - at[0];
  const dy = from[1] - at[1];
  const length = Math.max(1, Math.hypot(dx, dy));

  return [at[0] + (dx / length) * distance, at[1] + (dy / length) * distance];
}

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
  Jaws(context, stage, share, { paint, seed, weight, type }) {
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
    // A bite in an element breaks it off as the jaws meet
    if (share > 0.6 && IMBUED.has(type)) {
      imbue(context, at, size, (share - 0.6) / 0.4, seed, paint, type, stage.scale);
    }
  },

  // A rampage: heavy blows landing on it one after another, and petals flying where the move is a dance of them
  Rampage(context, stage, share, { paint, seed, weight, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let blow = 0; blow < RAMPAGE_BLOWS; blow += 1) {
      const held = share * RAMPAGE_BLOWS - blow;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const angle = noise(seed, blow) * Math.PI * 2;
      const spot: Point = [
        at[0] + Math.cos(angle) * size * 0.5,
        at[1] + Math.sin(angle) * size * 0.4,
      ];

      burst(context, spot, size * (0.5 + held * 0.7), many(6, weight), seed + blow, {
        ...paint,
        alpha: decay(held),
        width: 3.4 * stage.scale,
      });
      ring(context, spot, size * (0.3 + held), {
        ...paint,
        alpha: decay(held),
        width: 3 * stage.scale,
      });
    }
    ripple(context, [at[0], at[1] + size * 0.9], size * (0.6 + share * 2), {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 3 * stage.scale,
    });
    if (type !== Types.Grass) {
      return;
    }
    for (let one = 0; one < many(8, weight); one += 1) {
      const angle = noise(seed, one + 20) * Math.PI * 2;
      const out = size * (0.4 + share * 1.8) * (0.5 + noise(seed, one + 30) * 0.5);

      petal(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.7],
        size * 0.2,
        share * 6 + one,
        { color: PETAL, alpha: decay(share) },
      );
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

      edge(
        context,
        [at[0] - size * 0.9 + off, at[1] - size * 0.9],
        [at[0] + size * 0.9 + off, at[1] + size * 0.9],
        size * 0.16,
        size * 0.12,
        { ...paint, alpha: decay(held) },
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

  // Out and back: something thrown that hits and returns to where it
  // was thrown from, which is the whole shape of a U-turn. The strike
  // is at the far end, where it turns
  Dart(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    // Out for the first half, home for the second
    const held = share < 0.5 ? share * 2 : (1 - share) * 2;
    const spot = between(stage.source, at, held);

    orb(context, spot, size * 0.4, paint);
    // The trail behind it, which is what says travelling rather than
    // a dot that moved. Behind is toward the caster on the way out and
    // toward the target on the way home
    const way = share < 0.5 ? 1 : -1;

    for (let step = 1; step <= 3; step += 1) {
      const behind = Math.min(1, Math.max(0, held - step * 0.08 * way));

      orb(context, between(stage.source, at, behind), size * 0.3 * (1 - step * 0.22), {
        ...paint,
        alpha: 0.45 - step * 0.12,
      });
    }
    // One burst as it arrives, at the turn
    const since = (share - 0.45) / 0.2;

    if (since > 0 && since < 1) {
      burst(context, at, size * (0.5 + since), 6, 41, {
        ...paint,
        alpha: decay(since),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Two cuts across each other. The second comes a beat after the
  // first and both are held until they go together, so what is read
  // is an X rather than two separate rakes
  Cross(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const cuts: [from: Point, to: Point][] = [
      [
        [at[0] - size, at[1] - size],
        [at[0] + size, at[1] + size],
      ],
      [
        [at[0] + size, at[1] - size],
        [at[0] - size, at[1] + size],
      ],
    ];

    for (const [cut, [from, to]] of cuts.entries()) {
      // The second cut waits, and neither fades until the pair is up
      const held = share - cut * 0.18;

      if (held <= 0) {
        continue;
      }
      edge(context, from, to, size * 0.15, size * 0.06, {
        ...paint,
        alpha: share < 0.6 ? 1 : Math.min(1, decay(share) * 2.5),
      });
    }
  },

  // A fist that lands with its element breaking off it
  Punch(context, stage, share, { paint, seed, weight, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const out = Math.min(1, share * 2.5);

    orb(context, at, size * 0.4 * decay(out), { ...paint, alpha: decay(share) });
    ring(context, at, size * (0.2 + out * 0.8), {
      ...paint,
      alpha: decay(share),
      width: 3.6 * stage.scale,
    });
    imbue(context, at, size, share, seed, paint, type, stage.scale);
  },

  // A ring of fire rolled in from the caster's side, bursting as it arrives
  Wheel(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const roll = Math.min(1, share * 2);
    const centre = backToward(at, stage.source, size * 2.5 * (1 - roll));
    const rim = share < 0.5 ? 1 : decay((share - 0.5) * 2);
    const hot = mix(paint.color, '#ffd84a', 0.6);
    // Turning forward, toward whichever side the target is on
    const way = at[0] < stage.source[0] ? -1 : 1;

    for (let lick = 0; lick < 10; lick += 1) {
      const angle = (lick / 10) * Math.PI * 2 + share * Math.PI * 6 * way;

      orb(
        context,
        [centre[0] + Math.cos(angle) * size * 0.8, centre[1] + Math.sin(angle) * size * 0.8],
        size * 0.24,
        { color: lick % 2 === 0 ? hot : paint.color, alpha: rim * 0.9 },
      );
    }
    if (roll < 1) {
      return;
    }
    const hit = (share - 0.5) * 2;

    ring(context, at, size * (0.8 + hit * 1.6), {
      color: hot,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 1.6, many(8, weight), seed, hit, {
      color: hot,
      alpha: decay(hit),
      width: 2.2 * stage.scale,
    });
  },

  // A column of water driven up through it from the ground, and the spray coming back down
  Torrent(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.8];

    beam(
      context,
      foot,
      [at[0], at[1] - size * 3.2],
      Math.min(1, share * 2.5),
      size * 0.6 * (1 - share * 0.4),
      { ...paint, alpha: decay(share) },
    );
    ripple(context, foot, size * (0.5 + share * 1.6), {
      ...paint,
      alpha: decay(share),
      width: 3 * stage.scale,
    });
    motes(context, [at[0], at[1] - size * 1.6], size * 1.8, many(10, weight), seed, share, {
      color: lighten(paint.color, 0.4),
      alpha: decay(share) * 0.9,
      width: 2.2 * stage.scale,
    });
  },

  // The whole body arriving wrapped in its element, with the rush that brought it still behind it
  Rush(context, stage, share, { paint, seed, weight, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const tail = backToward(at, stage.source, size * 3);
    const head = backToward(at, stage.source, size * 0.8);
    const dx = head[0] - tail[0];
    const dy = head[1] - tail[1];
    const length = Math.max(1, Math.hypot(dx, dy));

    for (let line = 0; line < 4; line += 1) {
      const off = (line - 1.5) * size * 0.4;
      const ox = (-dy / length) * off;
      const oy = (dx / length) * off;

      lash(context, [tail[0] + ox, tail[1] + oy], [head[0] + ox, head[1] + oy], 0, {
        ...paint,
        alpha: decay(Math.min(1, share * 2.5)) * 0.8,
        width: 2 * stage.scale,
      });
    }
    orb(context, at, size * (0.8 + swell(share) * 0.5), { ...paint, alpha: decay(share) * 0.7 });
    ripple(context, at, size * (0.5 + share * 2.2), {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 3.4 * stage.scale,
    });
    imbue(context, at, size * 1.3, share, seed, paint, type, stage.scale);
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
  // Everything it has thrown into one blow: wrapped in a dark aura, and the floor answering with a wide wave
  Crash(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const tail = backToward(at, stage.source, size * 3.4);
    const head = backToward(at, stage.source, size * 0.6);

    for (let line = 0; line < 5; line += 1) {
      const off = (line - 2) * size * 0.4;

      lash(context, [tail[0], tail[1] + off], [head[0], head[1] + off], 0, {
        color: CRASH_AURA,
        alpha: decay(Math.min(1, share * 2.5)) * 0.8,
        width: 2.4 * stage.scale,
      });
    }
    orb(context, at, size * (1.2 + swell(share) * 0.8), {
      color: CRASH_AURA,
      alpha: decay(share) * 0.7,
    });
    orb(context, at, size * (0.5 + share * 0.6), {
      color: lighten(paint.color, 0.6),
      alpha: decay(Math.min(1, share * 2)),
    });
    ripple(context, [at[0], at[1] + size * 0.9], size * (0.6 + share * 3.2), {
      color: lighten(CRASH_AURA, 0.4),
      alpha: decay(share) * 0.9,
      width: 3.4 * stage.scale,
    });
    burst(context, at, size * (0.6 + share * 1.2), many(8, weight), seed, {
      color: lighten(CRASH_AURA, 0.5),
      alpha: decay(share),
      width: 3 * stage.scale,
    });
  },

  // A fist charged until it glows, then a blow that goes off like a blast
  Haymaker(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);

    if (share < HAYMAKER_CHARGE) {
      const charge = share / HAYMAKER_CHARGE;

      orb(context, at, size * (0.2 + charge * 0.5), { color: light, alpha: 0.4 + charge * 0.6 });
      ring(context, at, size * (1.4 - charge), {
        ...paint,
        alpha: charge,
        width: 2.4 * stage.scale,
      });
      return;
    }
    const hit = (share - HAYMAKER_CHARGE) / (1 - HAYMAKER_CHARGE);

    orb(context, at, size * (0.6 + hit * 1.4), { color: light, alpha: decay(hit) });
    ring(context, at, size * (0.5 + hit * 2.4), {
      color: light,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    ripple(context, [at[0], at[1] + size * 0.9], size * (0.6 + hit * 2.8), {
      ...paint,
      alpha: decay(hit) * 0.9,
      width: 3 * stage.scale,
    });
    shards(context, at, size * 1.8, many(7, weight), seed, hit, {
      ...paint,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A flurry of quick blows all over it, then a last one that throws it back
  Flurry(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const light = lighten(paint.color, 0.5);

    for (let blow = 0; blow < FLURRY_BLOWS; blow += 1) {
      const held = (share - (blow / FLURRY_BLOWS) * 0.7) / 0.15;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const spot: Point = [
        at[0] + spread(seed, blow) * size * 0.7,
        at[1] + spread(seed, blow + 5) * size * 0.6,
      ];

      burst(context, spot, size * (0.3 + held * 0.4), 5, seed + blow, {
        color: light,
        alpha: decay(held),
        width: 2.4 * stage.scale,
      });
      orb(context, spot, size * 0.3 * decay(held), { color: light, alpha: decay(held) });
    }
    if (share > 0.75) {
      const last = (share - 0.75) / 0.25;

      orb(context, at, size * (0.8 + last), { color: light, alpha: decay(last) });
      ring(context, at, size * (0.5 + last * 2), {
        color: light,
        alpha: decay(last),
        width: 3 * stage.scale,
      });
    }
  },

  // Kicks landing from alternating sides, one a strike, each swinging in on its own arc
  Kicks(context, stage, share, { paint, seed, hits = 2 }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const light = lighten(paint.color, 0.5);
    const count = Math.max(2, Math.round(hits));

    for (let kick = 0; kick < count; kick += 1) {
      const held = share * count - kick;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const side = kick % 2 === 0 ? -1 : 1;
      // Each one harder than the last, the way Triple Kick's power climbs
      const big = size * (1 + kick * 0.25);
      const start: Point = [at[0] + side * big * 1.4, at[1] + big * 0.5];
      const swing = Math.min(1, held * 2.5);

      lash(context, start, between(start, at, swing), side * big * 0.5, {
        color: light,
        alpha: decay(held) * 0.9,
        width: 3 * stage.scale,
      });
      if (swing >= 1) {
        const hit = (held - 0.4) / 0.6;

        burst(context, at, big * (0.5 + hit * 0.5), 6, seed + kick, {
          color: light,
          alpha: decay(hit),
          width: 2.6 * stage.scale,
        });
      }
    }
  },

  // One long blade drawn across it, shedding leaves off the cut
  Sweep(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const drawn = Math.min(1, share * 3);
    const shown = share < 0.55 ? 1 : decay((share - 0.55) / 0.45);
    const from: Point = [at[0] - size * 1.5, at[1] - size * 0.7];
    const tip = between(from, [at[0] + size * 1.5, at[1] + size * 0.7], drawn);

    edge(context, from, tip, size * 0.24, -size * 0.3 * drawn, { ...paint, alpha: shown });
    edge(context, from, tip, size * 0.08, -size * 0.3 * drawn, {
      color: lighten(paint.color, 0.7),
      alpha: shown,
    });
    for (let one = 0; one < many(6, weight); one += 1) {
      const along = noise(seed, one);
      // Shed only once the blade has passed that point
      const held = (share - along / 3) / (1 - along / 3);

      if (held <= 0 || along > drawn) {
        continue;
      }
      const spot = between(from, [at[0] + size * 1.5, at[1] + size * 0.7], along);

      petal(
        context,
        [
          spot[0] + spread(seed, one + 10) * size * held,
          spot[1] + size * (held * 1.6 - 0.5) * held,
        ],
        size * 0.2,
        held * 6 + one,
        { color: paint.color, alpha: decay(held) },
      );
    }
  },

  // A dark crescent swept round it in one stroke, with a pale edge
  Crescent(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const cut = Math.min(1, share / 0.3);
    const shown = share < 0.55 ? 1 : decay((share - 0.55) / 0.45);
    const start = -Math.PI * 0.85;
    const end = start + Math.PI * 1.2 * cut;
    const dark = mix(paint.color, '#0a0610', 0.55);

    sickle(context, at, size * 1.2, start, end, size * 0.6, { color: dark, alpha: shown * 0.9 });
    sickle(context, at, size * 1.38, start, end, size * 0.16, {
      color: lighten(paint.color, 0.6),
      alpha: shown,
    });
    if (cut >= 1) {
      const since = (share - 0.3) / 0.7;

      burst(context, at, size * (0.8 + since * 1.2), 8, seed, {
        color: lighten(paint.color, 0.5),
        alpha: decay(since),
        width: 2.4 * stage.scale,
      });
      motes(context, at, size * 1.4, many(6, weight), seed, since, {
        color: dark,
        alpha: decay(since) * 0.8,
        width: 2.6 * stage.scale,
      });
    }
  },

  // Crescent blades thrown from the pokemon: psychic ones spin, wind ones fly flat with air trailing
  Sickles(context, stage, share, { paint, seed, weight, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.4);
    const heading = Math.atan2(at[1] - stage.source[1], at[0] - stage.source[0]);
    const spins = type !== Types.Flying;

    for (let blade = 0; blade < 3; blade += 1) {
      const held = Math.max(0, Math.min(1, share * 1.6 - blade * 0.25));

      if (held <= 0) {
        continue;
      }
      const travel = Math.min(1, held * 1.6);

      if (travel < 1) {
        const off = spread(seed, blade) * size * 0.7 * (1 - travel);
        const spot = between(stage.source, at, travel);
        const centre: Point = [
          spot[0] - Math.sin(heading) * off,
          spot[1] + Math.cos(heading) * off,
        ];
        const turn = spins ? heading + travel * Math.PI * 4 : heading;

        sickle(context, centre, size * 0.55, turn - 1, turn + 1, size * 0.3, {
          color: light,
          alpha: 0.95,
        });
        if (!spins) {
          for (const side of [-1, 1]) {
            const [x, y] = [
              centre[0] + Math.sin(heading) * side * size * 0.3,
              centre[1] - Math.cos(heading) * side * size * 0.3,
            ];

            edge(
              context,
              [x - Math.cos(heading) * size * 0.2, y - Math.sin(heading) * size * 0.2],
              [x - Math.cos(heading) * size * 1.4, y - Math.sin(heading) * size * 1.4],
              size * 0.05,
              0,
              { color: '#ffffff', alpha: 0.5 },
            );
          }
        }
        continue;
      }
      const hit = (held - 1 / 1.6) / (1 - 1 / 1.6);

      edge(
        context,
        [at[0] - size * (0.9 - blade * 0.2), at[1] - size * 0.6],
        [at[0] + size * (0.9 - blade * 0.2), at[1] + size * 0.6],
        size * 0.14,
        0,
        { color: light, alpha: decay(hit) },
      );
      burst(context, at, size * (0.5 + hit * 0.8), 6, seed + blade, {
        color: light,
        alpha: decay(hit),
        width: 2.2 * stage.scale,
      });
    }
  },

  // Cuts that come round again and again, each bigger and brighter than the last
  Cutter(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let cut = 0; cut < CUTTER_CUTS; cut += 1) {
      const held = share * CUTTER_CUTS - cut;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const big = size * (0.7 + cut * 0.35);
      const way = cut % 2 === 0 ? 1 : -1;
      const start = way > 0 ? -Math.PI * 0.9 : -Math.PI * 0.1;
      const drawn = Math.min(1, held * 3);

      sickle(context, at, big, start, start + way * Math.PI * 1.1 * drawn, big * 0.35, {
        color: lighten(paint.color, 0.2 + cut * 0.2),
        alpha: decay(held),
      });
      if (cut === CUTTER_CUTS - 1 && drawn >= 1) {
        burst(context, at, big * (0.6 + held), 8, seed, {
          color: lighten(paint.color, 0.6),
          alpha: decay(held),
          width: 2.6 * stage.scale,
        });
      }
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default contact;
