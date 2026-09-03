import { MoveAffects, MoveCategories, MoveFlags, Moves } from '../../../data/ids/moves';
import { TYPE_COLORS, Types } from '../../../data/constants/types';
import { getMoveData } from '../../../data/moves';
import { MULTI_HIT_MOVES } from '../../../battle/moves/multi-hit';
import PaintedVisual, { type Painter } from './__painted';
import type { Point, Stage } from '../stage';
import {
  type Painted,
  beam,
  between,
  bolt,
  bone,
  bubble,
  burst,
  chevrons,
  decay,
  fade,
  heart,
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
  spread,
  star,
  swell,
} from './__paint';

/**
 * What a move looks like where it lands.
 *
 * This is the second half of a move. The first half — the gap the
 * engine holds it open for — is [`delay.ts`](./delay.ts); this is the
 * moment the engine says the effect resolved, drawn on whatever it
 * resolved on. The two are separate because they are separate events,
 * and a move that is a slow burrow and a sharp hit should not have to
 * pick one picture for both.
 *
 * Almost nothing here is per-move. A move already says what it is —
 * its type, whether it is physical, special or status, whether it
 * touches, and how hard it hits — and that is enough to choose a
 * shape, colour it and size it. The table at the bottom is only for
 * the ones the data cannot tell apart: a beam that should look like a
 * beam, an explosion that takes the caster with it.
 */

/** How big an effect is, in canvas pixels before the field's scale. */
const REACH = 26;

/**
 * How many strikes a barrage is drawn as. The engine rolls two to five
 * and this is the middle of it: the picture says "several, in a row",
 * which is the part a player reads
 */
const STRIKES = 4;

/** Every way a move can land. */
export type EffectShape =
  | 'Impact'
  | 'Blast'
  | 'Bloom'
  | 'Beam'
  | 'Zap'
  | 'Strike'
  | 'Flame'
  | 'Splash'
  | 'Bubbles'
  | 'Frost'
  | 'Leafy'
  | 'Haze'
  | 'Mark'
  | 'Mend'
  | 'Ward'
  | 'Quake'
  | 'Drain'
  | 'Volley'
  | 'Boomerang'
  | 'Dazzle'
  | 'Jaws'
  | 'Claw'
  | 'Coil'
  | 'Wave'
  | 'Spike'
  | 'Drill'
  | 'Swirl'
  | 'Trance'
  | 'Rocks'
  | 'Warp'
  | 'Lash'
  | 'Boost'
  | 'Chasm'
  | 'Leaves'
  | 'Stars'
  | 'Blow'
  | 'Shade'
  | 'Hearts'
  | 'Caltrops'
  | 'Whiff';

/** How long each of them takes at ordinary weight, in milliseconds. */
const SPANS: Record<EffectShape, number> = {
  Impact: 400,
  Blast: 700,
  Bloom: 520,
  Beam: 560,
  Zap: 400,
  Strike: 420,
  Flame: 620,
  Splash: 520,
  Bubbles: 640,
  Frost: 620,
  Leafy: 480,
  Haze: 700,
  Mark: 560,
  Mend: 700,
  Ward: 620,
  Quake: 780,
  Drain: 700,
  Volley: 900,
  Boomerang: 760,
  Dazzle: 440,
  Jaws: 420,
  Claw: 380,
  Coil: 620,
  Wave: 560,
  Spike: 380,
  Drill: 560,
  Swirl: 620,
  Trance: 760,
  Rocks: 620,
  Warp: 620,
  Lash: 420,
  Boost: 560,
  Chasm: 720,
  Leaves: 560,
  Stars: 620,
  Blow: 620,
  Shade: 660,
  Hearts: 680,
  Caltrops: 560,
  Whiff: 320,
};

/**
 * How hard the move hits, as a multiplier on everything drawn.
 *
 * A Tackle and a Hyper Beam were the same picture in two colours,
 * which is the one thing a player watching a fight most needs to tell
 * apart. Power is what the game already knows about that, so it is
 * what decides how big the shape is, how much comes off it, and how
 * long it hangs about.
 *
 * A move with no power at all is one of two things, and they are
 * opposites: a status move, which is quiet, or a one-hit knockout,
 * which is the loudest thing in the game
 */
export function weightOf(move: Moves): number {
  const data = getMoveData(move);

  if (data.category === MoveCategories.Status) {
    return 0.85;
  }
  if (data.power == null) {
    return 1.75;
  }
  // 40 power lands at about 0.9 and 150 at about 1.6, so the range a
  // player actually sees is spread across the whole scale
  return 0.62 + Math.min(1, data.power / 150) * 0.98;
}

/** What a painter is handed besides the stage. */
interface Draw {
  paint: Painted;
  seed: number;
  /** How hard it hits, from about 0.85 to 1.75. */
  weight: number;
}

/** A count scaled by weight, never below one. */
function many(count: number, weight: number): number {
  return Math.max(1, Math.round(count * weight));
}

/** Where the effect is happening: the first thing it landed on. */
function landing(stage: Stage): Point {
  return stage.targets[0] ?? stage.source;
}

const PAINTERS: Record<
  EffectShape,
  (context: CanvasRenderingContext2D, stage: Stage, share: number, draw: Draw) => void
> = {
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

  // A hit that takes the ground with it
  Blast(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    orb(context, at, size * (0.3 + share * 1.4), { ...paint, alpha: decay(share) });
    ring(context, at, size * (0.6 + share * 2.2), {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 3 * stage.scale,
    });
    shards(context, at, size * 1.8, many(7, weight), seed, share, {
      ...paint,
      alpha: decay(share),
      width: 2.4 * stage.scale,
    });
  },

  // Something special going off: a core, and a ring leaving it
  Bloom(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    orb(context, at, size * (0.5 + swell(share) * 0.6), { ...paint, alpha: 0.85 * decay(share) });
    ring(context, at, size * (0.5 + share * 1.6), {
      ...paint,
      alpha: decay(share),
      width: 2.5 * stage.scale,
    });
    motes(context, at, size * 1.4, many(6, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2 * stage.scale,
    });
  },

  // A beam arriving and holding for an instant
  Beam(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    // Out fast, held, then gone: a beam that fades as it travels is a
    // beam nobody sees arrive
    const reach = Math.min(1, share * 3);
    const fading = share < 0.7 ? 1 : decay(share) * 3;

    beam(context, stage.source, at, reach, size * 0.28 * fading, { ...paint, alpha: fading });
    if (reach >= 1) {
      orb(context, at, size * (0.6 + swell(share) * 0.5), { ...paint, alpha: decay(share) });
    }
  },

  // Lightning, from whoever fired it
  Zap(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    // Bright for most of it and then gone: lightning does not dim
    bolt(context, stage.source, at, seed, {
      ...paint,
      alpha: Math.min(1, decay(share) * 2.2),
      width: 3 * stage.scale * weight,
    });
    // A strong one forks
    if (weight > 1.15) {
      bolt(context, stage.source, at, seed + 17, {
        ...paint,
        alpha: Math.min(1, decay(share) * 1.6),
        width: 1.6 * stage.scale,
      });
    }
    burst(context, at, size * (0.5 + share), many(6, weight), seed, {
      ...paint,
      alpha: decay(share),
      width: 2 * stage.scale,
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

  // Fire: a core, and embers coming off it
  Flame(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    orb(context, [at[0], at[1] - size * share * 0.4], size * (0.7 + swell(share) * 0.5), {
      ...paint,
      alpha: 0.9 * decay(share),
    });
    motes(context, at, size * 1.6, many(8, weight), seed, share, {
      ...paint,
      alpha: decay(share),
      width: 2.2 * stage.scale,
    });
    // A big one throws a wall of it rather than a puff
    if (weight > 1.25) {
      for (let tongue = 0; tongue < 3; tongue += 1) {
        const angle = -Math.PI / 2 + (tongue - 1) * 0.7;
        const reach = size * (1 + share * 1.4);

        orb(
          context,
          [at[0] + Math.cos(angle) * reach * 0.6, at[1] + Math.sin(angle) * reach * 0.6],
          size * 0.5 * decay(share * 0.6),
          { ...paint, alpha: decay(share) * 0.8 },
        );
      }
    }
  },

  // Water: it lands, it spreads, it runs off
  Splash(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    ripple(context, at, size * (0.4 + share * 1.8), {
      ...paint,
      alpha: decay(share),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 1.5, many(10, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 2 * stage.scale,
    });
  },

  // Ice: it arrives in pieces, sweeps through and hangs about
  Frost(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    // The cold coming through, rather than a scatter standing still:
    // a wall of crystals crosses whatever it landed on
    for (let gust = 0; gust < many(2, weight); gust += 1) {
      const held = Math.max(0, Math.min(1, share * 1.5 - gust * 0.25));

      if (held > 0) {
        slash(context, at, size * (0.9 + gust * 0.4), Math.PI * (0.15 + gust * 0.2), {
          ...paint,
          alpha: swell(held) * 0.9,
          width: 3 * stage.scale,
        });
      }
    }
    shards(context, at, size * 1.5, many(7, weight), seed, share, {
      ...paint,
      alpha: decay(share),
      width: 2.6 * stage.scale,
    });
    // Left behind: the frost that does not blow away with the rest
    ring(context, at, size * (0.7 + share * 0.9), {
      ...paint,
      alpha: swell(share) * 0.7,
      width: 2 * stage.scale,
    });
  },

  // Grass: cuts and leaves
  Leafy(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let cut = 0; cut < many(2, weight); cut += 1) {
      const angle = noise(seed, cut) * Math.PI * 2;
      const held = Math.max(0, Math.min(1, share * 2 - cut * 0.25));

      if (held > 0) {
        slash(context, at, size * (0.7 + cut * 0.25), angle, {
          ...paint,
          alpha: decay(share),
          width: 3 * stage.scale,
        });
      }
    }
    motes(context, at, size * 1.3, many(5, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2 * stage.scale,
    });
  },

  // Powder, gas, anything that hangs in the air
  Haze(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    motes(context, at, size * 1.6, many(12, weight), seed, share, {
      ...paint,
      alpha: swell(share) * 0.8,
      width: 2.6 * stage.scale,
    });
  },

  // A status arriving: rings closing on whatever it was aimed at
  Mark(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let step = 0; step < 2; step += 1) {
      const held = Math.max(0, Math.min(1, share * 1.6 - step * 0.3));

      ring(context, at, size * (1.6 - held * 1.1), {
        ...paint,
        alpha: swell(held) * 0.9,
        width: 2.5 * stage.scale,
      });
    }
  },

  // Health coming back: motes rising into the body
  Mend(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let mote = 0; mote < many(9, weight); mote += 1) {
      const held = (share + noise(seed, mote)) % 1;
      const angle = noise(seed, mote + 20) * Math.PI * 2;
      const x = at[0] + Math.cos(angle) * size * (1 - held) * 1.2;
      const y = at[1] + size * 0.8 - held * size * 1.8;

      orb(context, [x, y], 2.5 * stage.scale, { ...paint, alpha: swell(held) });
    }
    ring(context, at, size * (1.2 - swell(share) * 0.3), {
      ...paint,
      alpha: swell(share) * 0.5,
      width: 2 * stage.scale,
    });
  },

  // Something put up: a wall the caster stands behind
  Ward(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    for (let shell = 0; shell < 3; shell += 1) {
      ring(context, at, size * (1.3 + shell * 0.22) * (0.6 + swell(share) * 0.5), {
        ...paint,
        alpha: swell(share) * (0.8 - shell * 0.2),
        width: 2 * stage.scale,
      });
    }
  },

  // The ground itself
  Quake(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let wave = 0; wave < many(2, weight); wave += 1) {
      const held = Math.max(0, Math.min(1, share * 1.4 - wave * 0.22));

      if (held > 0) {
        ripple(context, at, size * held * 3.2, {
          ...paint,
          alpha: decay(held) * 0.9,
          width: 3 * stage.scale,
        });
      }
    }
    shards(context, at, size * 1.6, many(6, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2.4 * stage.scale,
    });
  },

  // What it takes, going home: the point of a drain is where the
  // health ends up, so the motes cross back to the caster
  Drain(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    ring(context, at, size * (1.2 - swell(share) * 0.6), {
      ...paint,
      alpha: decay(share),
      width: 2.5 * stage.scale,
    });
    for (let mote = 0; mote < many(6, weight); mote += 1) {
      const held = (share * 1.3 + noise(seed, mote) * 0.5) % 1;
      const drift = between(at, stage.source, held);

      orb(context, [drift[0], drift[1] - Math.sin(Math.PI * held) * size * 0.4], 3 * stage.scale, {
        ...paint,
        alpha: swell(held) * 0.9,
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

  // A barrage: bubbles crowd whatever they hit and pop one after
  // another. The run of pops is the picture — all of them going at
  // once would read as a single splash
  Bubbles(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const count = many(9, weight);

    for (let one = 0; one < count; one += 1) {
      const held = Math.min(1, share * 1.6 - (one / count) * 0.6);

      if (held <= 0) {
        continue;
      }
      const angle = noise(seed, one) * Math.PI * 2;
      const reach = size * (0.3 + noise(seed, one + 20) * 0.8);
      const radius = size * 0.2 * (0.6 + noise(seed, one + 40) * 0.8);
      // Flattened sideways and lifted as it goes, since a bubble rises
      const spot: Point = [
        at[0] + Math.cos(angle) * reach,
        at[1] + Math.sin(angle) * reach * 0.7 - size * held * 0.35,
      ];

      if (held < 0.7) {
        bubble(context, spot, radius * (0.55 + held * 0.6), {
          ...paint,
          alpha: 0.9,
          width: 1.8 * stage.scale,
        });
        continue;
      }
      // Popped: what is left where it was, for the rest of its turn
      ring(context, spot, radius * (1 + (held - 0.7) * 4), {
        ...paint,
        alpha: decay((held - 0.7) / 0.3) * 0.85,
        width: 1.6 * stage.scale,
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

  // A light in the eyes: it whites out and is gone. Nothing travels
  // and nothing lands, which is what separates this from a shockwave
  Dazzle(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    // Up almost at once and down slowly, the way a bright light is
    // seen: half the phase is the eye recovering
    const glare = share < 0.15 ? share / 0.15 : decay((share - 0.15) / 0.85);

    orb(context, at, size * (0.6 + glare * 1.9), { ...paint, alpha: glare });
    burst(context, at, size * (1 + glare * 2.4), 10, seed, {
      ...paint,
      alpha: glare * 0.9,
      width: 2 * stage.scale,
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

  // A sound: rings leaving the caster and washing over what heard it
  Wave(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.3 + pulse * 0.28) % 1;
      const along = between(stage.source, at, held);

      ring(context, along, size * (0.3 + held * 0.9), {
        ...paint,
        alpha: decay(held) * 0.9,
        width: 2.4 * stage.scale,
      });
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

  // Wind: rings turning around the point rather than closing on it
  Swirl(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let turn = 0; turn < 3; turn += 1) {
      const angle = share * Math.PI * 3 + turn * 2;

      slash(context, at, size * (0.7 + turn * 0.3), angle, {
        ...paint,
        alpha: swell(share) * 0.9,
        width: 2.6 * stage.scale,
      });
    }
    motes(context, at, size * 1.5, many(5, weight), seed, share, {
      ...paint,
      alpha: swell(share) * 0.7,
      width: 2 * stage.scale,
    });
  },

  // A spiral winding down: what the sleeping and the confusing moves
  // have always looked like
  Trance(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    spiral(context, at, size * 1.6 * (1 - share * 0.3), 2.5, share, {
      ...paint,
      alpha: swell(share) + 0.2,
      width: 2.4 * stage.scale,
    });
  },

  // Rocks coming down on it
  Rocks(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    const falling = many(4, weight);

    // Staggered by index rather than by the scatter, so the first one
    // is already on its way at the first frame: a picture that starts
    // empty reads as a move that did nothing
    for (let rock = 0; rock < falling; rock += 1) {
      const held = Math.max(0, Math.min(1, share * 1.6 - (rock / falling) * 0.55));
      const off = (noise(seed, rock + 12) - 0.5) * size * 2;

      if (held <= 0) {
        continue;
      }
      shards(
        context,
        [at[0] + off, at[1] - size * 3 * (1 - held)],
        size * 0.4,
        1,
        seed + rock,
        held,
        { ...paint, alpha: 1, width: 3.4 * stage.scale },
      );
    }
    if (share > 0.6) {
      ripple(context, at, size * (share - 0.6) * 3, {
        ...paint,
        alpha: decay(share) * 1.6,
        width: 2.4 * stage.scale,
      });
    }
  },

  // The air bending: rings that do not leave, they distort
  Warp(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let shell = 0; shell < 3; shell += 1) {
      const held = (share * 1.2 + shell * 0.3) % 1;

      context.save();
      context.translate(at[0], at[1]);
      context.rotate(held * Math.PI);
      ring(context, [0, 0], size * (0.5 + held), {
        ...paint,
        alpha: swell(held) * 0.9,
        width: 2.6 * stage.scale,
      });
      context.restore();
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

  // Something about the pokemon itself went up
  Boost(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;

    chevrons(context, at, size, 3, share, {
      ...paint,
      alpha: swell(share) + 0.2,
      width: 2.8 * stage.scale,
    });
  },

  // The ground splitting open underneath it. What a one-hit knockout
  // by burial looks like is a hole, not a hit
  Chasm(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const open = Math.min(1, share * 1.8);

    // A crack drawn as two lips parting: the dark between them is the
    // whole of the picture, so it widens rather than moving
    context.beginPath();
    for (const lip of [-1, 1]) {
      context.moveTo(at[0] - size * 2, at[1]);
      for (let step = 1; step <= 6; step += 1) {
        const along = step / 6;

        context.lineTo(
          at[0] - size * 2 + along * size * 4,
          at[1] + lip * open * size * 0.6 * Math.sin(Math.PI * along) + spread(seed, step) * 2,
        );
      }
    }
    context.strokeStyle = fade(paint.color, 0.9);
    context.lineWidth = 2.5 * stage.scale;
    context.stroke();
    shards(context, at, size * 1.6, many(5, weight), seed, share, {
      ...paint,
      alpha: decay(share),
      width: 2.6 * stage.scale,
    });
  },

  // Leaves crossing it, edge on. They arrive in a line rather than
  // landing in one place, which is what tells a volley of them from a
  // pair of claw marks
  Leaves(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const flying = many(4, weight);

    for (let leaf = 0; leaf < flying; leaf += 1) {
      const held = Math.max(0, Math.min(1, share * 1.7 - (leaf / flying) * 0.7));

      if (held <= 0 || held >= 1) {
        continue;
      }
      const drift = (noise(seed, leaf) - 0.5) * size * 1.6;

      slash(
        context,
        [at[0] - size * 1.6 + held * size * 3.2, at[1] + drift],
        size * 0.45,
        held * 6 + leaf,
        { ...paint, alpha: 1, width: 2.6 * stage.scale },
      );
    }
  },

  // A stream of stars, which is the one move that says it never
  // misses by looking like it is being aimed for you
  Stars(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let mark = 0; mark < many(5, weight); mark += 1) {
      const held = (share * 1.4 + mark * 0.17) % 1;
      const along = between(stage.source, at, held);
      const drift = (noise(seed, mark) - 0.5) * size * 0.8;

      star(context, [along[0] + drift, along[1] + drift * 0.4], size * 0.3, held * 5, {
        ...paint,
        alpha: swell(held) + 0.25,
      });
    }
    if (share > 0.6) {
      burst(context, at, size * (share - 0.6) * 2.5, 6, seed, {
        ...paint,
        alpha: decay(share) * 2,
        width: 2 * stage.scale,
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

  // It went past. Drawn small and grey on purpose: a miss is news,
  // and a miss that looks like a hit is worse than nothing
  // Ghost: a dark thing gathering, wisping off, and closing in on it
  Shade(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    orb(context, at, size * (0.45 + swell(share) * 0.75), {
      ...paint,
      alpha: swell(share) * 0.85,
    });
    motes(context, at, size * 1.7, many(6, weight), seed, share, {
      ...paint,
      alpha: decay(share) * 0.9,
      width: 2.4 * stage.scale,
    });
    // Inward rather than out: what a ghost move does is close on it
    ring(context, at, size * (1.9 - share * 1.2), {
      ...paint,
      alpha: swell(share) * 0.7,
      width: 2.2 * stage.scale,
    });
  },
  // What a pokemon is feeling rather than what it was hit with
  Hearts(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const rising = many(4, weight);

    for (let one = 0; one < rising; one += 1) {
      const held = Math.max(0, Math.min(1, share * 1.4 - (one / rising) * 0.5));

      if (held <= 0) {
        continue;
      }
      heart(
        context,
        [at[0] + spread(seed, one) * size * 0.9, at[1] - size * 2 * held],
        size * 0.42,
        { ...paint, alpha: decay(held) },
      );
    }
  },
  // Laid on the ground rather than thrown at anybody, so they settle
  // along it instead of scattering from a point
  Caltrops(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const laid = 5;

    for (let one = 0; one < laid; one += 1) {
      const held = Math.max(0, Math.min(1, share * 1.5 - (one / laid) * 0.4));

      if (held <= 0) {
        continue;
      }
      const along = (one / (laid - 1) - 0.5) * size * 3.2;

      shards(
        context,
        [at[0] + along, at[1] + size * 0.5 - size * (1 - held)],
        size * 0.26,
        1,
        seed + one,
        held,
        { ...paint, alpha: 1, width: 2.6 * stage.scale },
      );
    }
  },
  Whiff(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const drift = share * size * 0.8;

    slash(context, [at[0] + drift, at[1] - drift * 0.4], size * 0.9, -0.5, {
      ...paint,
      alpha: decay(share) * 0.8,
      width: 2 * stage.scale,
    });
  },
};

/**
 * Which shape a type reaches for when the move has not asked for one.
 * A special move's picture is mostly its element, and this is what
 * each element does when it arrives
 */
const BY_TYPE: Partial<Record<Types, EffectShape>> = {
  [Types.Fire]: 'Flame',
  [Types.Water]: 'Splash',
  [Types.Ice]: 'Frost',
  [Types.Electric]: 'Zap',
  [Types.Grass]: 'Leafy',
  [Types.Poison]: 'Haze',
  [Types.Ground]: 'Quake',
  [Types.Rock]: 'Impact',
  [Types.Flying]: 'Leafy',
};

/**
 * What each move looks like where the shape should say the **name**.
 *
 * The rules underneath answer with the move's element and category,
 * which is honest but wide: every Normal physical move landed as the
 * same burst, so Bite, Scratch and Wrap were one picture in three
 * sizes. A player watching should be able to say which move that was,
 * so anything with a shape of its own is named here — teeth close,
 * claws rake, coils tighten, sound washes over, a drill turns.
 *
 * Moves that share a shape are still told apart by what the shape is
 * given: Scratch rakes three thin marks and Slash one heavy one,
 * because the count and the width come off the move's power
 */
const NAMED: Partial<Record<Moves, EffectShape>> = {
  // Beams: the picture is the line between the two of them
  [Moves.HyperBeam]: 'Beam',
  [Moves.SolarBeam]: 'Beam',
  [Moves.Psybeam]: 'Beam',
  [Moves.IceBeam]: 'Beam',
  [Moves.AuroraBeam]: 'Beam',
  [Moves.Flamethrower]: 'Beam',
  [Moves.HydroPump]: 'Beam',

  // Not beams. A bubble move is a spray of them in the mainline, and
  // this was drawing a solid jet after a thrown orb — two pictures,
  // neither of them the move
  [Moves.Bubble]: 'Bubbles',
  [Moves.BubbleBeam]: 'Bubbles',

  // Teeth
  [Moves.Bite]: 'Jaws',
  [Moves.HyperFang]: 'Jaws',
  [Moves.SuperFang]: 'Jaws',
  [Moves.Crabhammer]: 'Jaws',
  [Moves.ViceGrip]: 'Jaws',
  [Moves.Clamp]: 'Jaws',
  [Moves.Guillotine]: 'Jaws',

  // Claws and blades, which differ by how many marks and how big
  [Moves.Scratch]: 'Claw',
  [Moves.FurySwipes]: 'Claw',
  [Moves.Slash]: 'Claw',
  [Moves.Cut]: 'Claw',
  [Moves.RazorWind]: 'Claw',
  [Moves.WingAttack]: 'Claw',

  // Wound round it
  [Moves.Wrap]: 'Coil',
  [Moves.Bind]: 'Coil',
  [Moves.Constrict]: 'Coil',
  [Moves.FireSpin]: 'Coil',
  [Moves.LeechSeed]: 'Coil',

  // Heard rather than felt
  [Moves.Growl]: 'Wave',
  [Moves.Roar]: 'Wave',
  [Moves.Screech]: 'Wave',
  [Moves.Sing]: 'Wave',
  [Moves.Supersonic]: 'Wave',
  [Moves.SonicBoom]: 'Wave',

  // A point driven in
  [Moves.Peck]: 'Spike',
  [Moves.HornAttack]: 'Spike',
  [Moves.PoisonSting]: 'Spike',
  [Moves.Absorb]: 'Drain',
  [Moves.MegaDrain]: 'Drain',
  [Moves.LeechLife]: 'Drain',
  [Moves.DreamEater]: 'Drain',

  // The same point, turning
  [Moves.HornDrill]: 'Drill',
  [Moves.DrillPeck]: 'Drill',

  // What the mainline draws for these, rather than what their type
  // and category would have picked
  [Moves.Fissure]: 'Chasm',
  [Moves.RazorLeaf]: 'Leaves',
  [Moves.Swift]: 'Stars',
  [Moves.SandAttack]: 'Haze',
  [Moves.ThunderWave]: 'Wave',
  [Moves.Whirlwind]: 'Blow',
  [Moves.Haze]: 'Haze',
  [Moves.Mist]: 'Haze',

  // Wind
  [Moves.Gust]: 'Swirl',
  [Moves.Sandstorm]: 'Swirl',

  // Something turning in front of its eyes
  [Moves.Hypnosis]: 'Trance',
  [Moves.ConfuseRay]: 'Trance',
  [Moves.Confusion]: 'Trance',
  [Moves.Psywave]: 'Trance',
  [Moves.LovelyKiss]: 'Trance',
  [Moves.Spore]: 'Trance',
  [Moves.SleepPowder]: 'Trance',

  // Rock and earth arriving from above
  [Moves.RockSlide]: 'Rocks',
  [Moves.RockThrow]: 'Rocks',
  [Moves.Barrage]: 'Volley',
  [Moves.SeismicToss]: 'Rocks',

  // The air bending
  [Moves.Psychic]: 'Warp',
  [Moves.NightShade]: 'Warp',
  [Moves.Amnesia]: 'Warp',
  [Moves.Kinesis]: 'Warp',
  [Moves.Teleport]: 'Warp',

  // Reaching out and striking with something long
  [Moves.VineWhip]: 'Lash',
  [Moves.Slam]: 'Lash',
  [Moves.Lick]: 'Lash',

  // Thrown and coming back. Nothing else in the game does this, and
  // as a lash it read as a whip rather than as a bone in the air
  [Moves.Bonemerang]: 'Boomerang',

  // Something lobbed that goes off where it lands, rather than debris
  // falling out of the sky onto it
  [Moves.EggBomb]: 'Blast',

  // Light, seen rather than felt: no wave crossing anything
  [Moves.Flash]: 'Dazzle',

  // Something about the pokemon itself went up
  [Moves.SwordsDance]: 'Boost',
  [Moves.Growth]: 'Boost',
  [Moves.Agility]: 'Boost',
  [Moves.Sharpen]: 'Boost',
  [Moves.Meditate]: 'Boost',
  [Moves.DoubleTeam]: 'Boost',
  [Moves.FocusEnergy]: 'Boost',
  [Moves.Minimize]: 'Boost',

  // The rest: moves whose one picture the data cannot describe
  [Moves.Thunder]: 'Strike',
  [Moves.Explosion]: 'Blast',
  [Moves.SelfDestruct]: 'Blast',
  [Moves.Earthquake]: 'Quake',
  [Moves.Recover]: 'Mend',
  [Moves.Rest]: 'Mend',
  [Moves.SoftBoiled]: 'Mend',
  [Moves.Reflect]: 'Ward',
  [Moves.LightScreen]: 'Ward',
  [Moves.Barrier]: 'Ward',
  [Moves.Withdraw]: 'Ward',
  [Moves.Harden]: 'Ward',
  [Moves.AcidArmor]: 'Ward',
  [Moves.Substitute]: 'Ward',
  [Moves.Surf]: 'Splash',
  [Moves.Blizzard]: 'Frost',
  [Moves.FireBlast]: 'Flame',

  // Johto. Most of them are answered by the rules underneath: what is
  // named here is what those rules would have drawn wrong
  [Moves.Aeroblast]: 'Beam',
  [Moves.DragonBreath]: 'Beam',
  [Moves.Twister]: 'Swirl',
  [Moves.RapidSpin]: 'Swirl',
  [Moves.Whirlpool]: 'Coil',
  [Moves.SpiderWeb]: 'Coil',
  [Moves.Megahorn]: 'Spike',
  [Moves.CrossChop]: 'Claw',
  [Moves.IronTail]: 'Lash',
  [Moves.ExtremeSpeed]: 'Strike',
  [Moves.Spark]: 'Zap',
  [Moves.AncientPower]: 'Rocks',
  [Moves.MudSlap]: 'Haze',
  [Moves.Octazooka]: 'Blast',
  [Moves.SludgeBomb]: 'Blast',
  [Moves.Present]: 'Blast',
  [Moves.GigaDrain]: 'Drain',
  [Moves.PainSplit]: 'Drain',
  [Moves.MilkDrink]: 'Mend',
  [Moves.MorningSun]: 'Mend',
  [Moves.Synthesis]: 'Mend',
  [Moves.Moonlight]: 'Mend',
  [Moves.HiddenPower]: 'Dazzle',

  // Heard: a song, a bell, a snore, and the sound a Johto pokemon
  // makes to hold something still
  [Moves.PerishSong]: 'Wave',
  [Moves.HealBell]: 'Wave',
  [Moves.Snore]: 'Wave',
  [Moves.ScaryFace]: 'Wave',

  // Ghost: something closing on it rather than something thrown
  [Moves.ShadowBall]: 'Shade',
  [Moves.Nightmare]: 'Shade',
  [Moves.Curse]: 'Shade',
  [Moves.DestinyBond]: 'Shade',
  [Moves.Spite]: 'Shade',

  // What the target is feeling
  [Moves.Attract]: 'Hearts',
  [Moves.SweetKiss]: 'Hearts',
  [Moves.Charm]: 'Hearts',

  // Laid on the ground for whatever walks in next
  [Moves.Spikes]: 'Caltrops',

  // Something the pokemon itself did
  [Moves.BellyDrum]: 'Boost',
  [Moves.BatonPass]: 'Boost',
  [Moves.Swagger]: 'Boost',

  // Something turning in front of its eyes, or behind them
  [Moves.MeanLook]: 'Trance',
  [Moves.SleepTalk]: 'Trance',
  [Moves.PsychUp]: 'Trance',
  [Moves.FutureSight]: 'Warp',
  [Moves.Conversion2]: 'Warp',
};

/**
 * The shapes that are about something other than the move's element.
 *
 * A move is coloured by its type, which is right for anything it
 * throws — but health coming back is about health whatever move sent
 * it, and a miss is about nothing at all
 */
const BY_SHAPE: Partial<Record<EffectShape, string>> = {
  // The colour of the health bar, which is what it is refilling
  Mend: '#4cc46a',
  // Gold, the way the mainline has always drawn them — a Normal-type
  // grey would be a picture of nothing
  Stars: '#f0d264',
  Ward: '#9ad8ff',
  // The light itself. A Normal-type grey would be a picture of a
  // shadow rather than of a flash
  Dazzle: '#fff2b4',
  Whiff: '#c8ccd4',
};

/**
 * The moves whose first step does nothing to anybody — a charge, a
 * burrow, a climb. The engine still resolves an effect on that step
 * (it is what puts the caster underground), and drawing a hit on
 * whatever the move is aimed at would be a lie about what happened
 */
const WINDING_UP = new Set<Moves>([
  Moves.SolarBeam,
  Moves.SkyAttack,
  Moves.SkullBash,
  Moves.RazorWind,
  Moves.Dig,
  Moves.Fly,
  Moves.Teleport,
  Moves.Bide,
]);

/** What this move does when it lands. */
export function effectShapeFor(move: Moves): EffectShape {
  const named = NAMED[move];

  if (named != null) {
    return named;
  }
  // A move that strikes several times looks like several strikes,
  // whatever else it is
  if (MULTI_HIT_MOVES[move] != null) {
    return 'Volley';
  }
  const data = getMoveData(move);

  if (data.category === MoveCategories.Status) {
    // One on the caster's own side is something put up rather than
    // done to anybody
    if ((data.affects & MoveAffects.Enemy) === 0) {
      return 'Ward';
    }
    // A powder is a powder whether or not it does damage: what a
    // pokemon standing in one sees is the cloud
    return (data.flags & MoveFlags.Powder) !== 0 || data.type === Types.Poison ? 'Haze' : 'Mark';
  }
  // Two of the flags are already a picture: what bites closes teeth
  // and what cuts rakes an edge, whatever else the move is
  if ((data.flags & MoveFlags.Bite) !== 0) {
    return 'Jaws';
  }
  if ((data.flags & MoveFlags.Slicing) !== 0) {
    return 'Claw';
  }
  if (data.category === MoveCategories.Physical) {
    return (data.flags & MoveFlags.Contact) === 0 ? (BY_TYPE[data.type] ?? 'Impact') : 'Impact';
  }
  return BY_TYPE[data.type] ?? 'Bloom';
}

function painted(shape: EffectShape, move: Moves, weight: number): PaintedVisual {
  const paint: Painted = { color: BY_SHAPE[shape] ?? TYPE_COLORS[getMoveData(move).type] };
  const painter: Painter = (context, stage, share) => {
    // Once per pokemon it reached. A move aimed at a whole team lands
    // on all of them at once, and the shape has no idea how many that
    // is — it draws one landing and this runs it for each. The seed
    // moves with the target so a spread move scatters differently on
    // each of them rather than stamping the same picture out
    const landings = stage.targets.length > 0 ? stage.targets : [stage.source];

    for (let at = 0; at < landings.length; at += 1) {
      PAINTERS[shape](
        context,
        { ...stage, targets: [landings[at]] },
        share,
        // The move itself, so a scatter is the same scatter every time
        // it goes off: two Embers look like the same move rather than
        // like two accidents
        { paint, seed: move + 1 + at * 97, weight },
      );
    }
  };

  // A heavy hit hangs about longer than a light one, but not in
  // proportion: doubling the power should not double the wait
  return new PaintedVisual(SPANS[shape] * (0.8 + weight * 0.3), painter);
}

/**
 * The picture of this move landing, or nothing where the step that
 * resolved was only the wind-up
 */
export default function moveEffectVisual(move: Moves, steps = 0): PaintedVisual | null {
  if (steps > 0 && WINDING_UP.has(move)) {
    return null;
  }
  return painted(effectShapeFor(move), move, weightOf(move));
}

/**
 * The picture of a move going past.
 *
 * A miss used to draw nothing at all, which reads as a move that
 * never happened — and for the one-hit knockouts, which miss far more
 * often than they land, that is nearly every cast
 */
export function moveMissVisual(move: Moves): PaintedVisual {
  return painted('Whiff', move, 1);
}
