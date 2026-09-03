import Abilities from '../../data/ids/abilities';
import { ItemTypes, Items } from '../../data/ids/items';
import { getItemData } from '../../data/items';
import { Statuses } from '../../data/ids/status';
import PaintedVisual, { type Painter } from './moves/__painted';
import type { Point, Stage } from './stage';
import {
  type Painted,
  bolt,
  burst,
  chevrons,
  decay,
  fade,
  heart,
  motes,
  noise,
  orb,
  ring,
  shards,
  star,
  swell,
} from './moves/__paint';

/**
 * What the field says about a pokemon that is not a move: a status
 * landing or biting, an ability firing.
 *
 * These were played off the sheets under `public/sprites/effects` and
 * are now drawn, for the same reason moves are — the atlas was made
 * for another game, and the nearest sheet to "poisoned" is a picture
 * of somebody else's move. Drawn, a poisoning is bubbles in poison
 * purple over the pokemon that has it, every time, at any size.
 *
 * A cue is about **one** pokemon, so it is drawn on the stage's
 * source. It is small on purpose: whatever else is happening on the
 * field is the thing being watched, and a status that shouts over a
 * move is a status nobody can read past.
 */

/** How big a cue is, in canvas pixels before the field's scale. */
const REACH = 15;

/** How high above the body a mark hangs. */
const LIFT = 22;

/** One cue, as a picture. */
interface Cue {
  paint: (context: CanvasRenderingContext2D, stage: Stage, share: number, draw: Painted) => void;
  color: string;
  /** How long it takes, in milliseconds. */
  span: number;
}

function over(stage: Stage, lift = LIFT): Point {
  return [stage.source[0], stage.source[1] - lift * stage.scale];
}

/**
 * Something rising off the body: gas, embers, spores. What most of the
 * lasting statuses look like
 */
function rising(count: number, seed: number) {
  return (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted): void => {
    motes(context, stage.source, REACH * stage.scale * 1.4, count, seed, share, {
      ...paint,
      alpha: swell(share) * 0.9,
      width: 2.4 * stage.scale,
    });
  };
}

/** Marks turning over the head: what a pokemon is seeing rather than wearing. */
function orbiting(count: number) {
  return (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted): void => {
    const at = over(stage);
    const size = REACH * stage.scale;

    for (let mark = 0; mark < count; mark += 1) {
      const angle = share * Math.PI * 2 + (mark / count) * Math.PI * 2;

      star(
        context,
        [at[0] + Math.cos(angle) * size, at[1] + Math.sin(angle) * size * 0.45],
        size * 0.38,
        angle,
        { ...paint, alpha: swell(share) + 0.2 },
      );
    }
  };
}

const STATUS_CUES: Partial<Record<Statuses, Cue>> = {
  // Bubbles coming off it, in the colour the game already writes
  // poison in
  [Statuses.Poisoned]: { paint: rising(7, 3), color: '#9141cb', span: 620 },
  [Statuses.BadlyPoisoned]: { paint: rising(12, 5), color: '#6e2f9c', span: 720 },
  [Statuses.Burned]: {
    paint: (context, stage, share, paint) => {
      orb(context, stage.source, REACH * stage.scale * (0.5 + swell(share) * 0.4), {
        ...paint,
        alpha: swell(share) * 0.75,
      });
      motes(context, stage.source, REACH * stage.scale * 1.3, 6, 11, share, {
        ...paint,
        alpha: decay(share),
        width: 2.2 * stage.scale,
      });
    },
    color: '#e62829',
    span: 620,
  },
  [Statuses.Paralyzed]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let arc = 0; arc < 2; arc += 1) {
        const angle = noise(13, arc) * Math.PI * 2 + share * 2;

        bolt(
          context,
          [stage.source[0] - Math.cos(angle) * size, stage.source[1] - Math.sin(angle) * size],
          [stage.source[0] + Math.cos(angle) * size, stage.source[1] + Math.sin(angle) * size],
          arc + 1,
          { ...paint, alpha: decay(share) * 1.2, width: 2 * stage.scale },
        );
      }
    },
    color: '#fac000',
    span: 480,
  },
  [Statuses.Frozen]: {
    paint: (context, stage, share, paint) => {
      shards(context, stage.source, REACH * stage.scale * 1.2, 6, 7, share, {
        ...paint,
        alpha: swell(share),
        width: 2.6 * stage.scale,
      });
      ring(context, stage.source, REACH * stage.scale * (1 + share * 0.4), {
        ...paint,
        alpha: swell(share) * 0.7,
        width: 2 * stage.scale,
      });
    },
    color: '#3dcef3',
    span: 620,
  },
  // Rings lifting off the head, one after another, the way a snore is
  // drawn as a rising note
  [Statuses.Sleeping]: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);
      const size = REACH * stage.scale;

      for (let puff = 0; puff < 3; puff += 1) {
        const held = (share * 1.3 + puff * 0.33) % 1;

        ring(context, [at[0] + held * size * 0.6, at[1] - held * size * 1.2], size * 0.3 * held, {
          ...paint,
          alpha: swell(held) * 0.8,
          width: 2 * stage.scale,
        });
      }
    },
    color: '#8fa2d8',
    span: 900,
  },
  [Statuses.Confused]: { paint: orbiting(3), color: '#ef70ef', span: 900 },
  [Statuses.Flinched]: {
    paint: (context, stage, share, paint) => {
      burst(context, over(stage), REACH * stage.scale * (0.6 + share), 6, 23, {
        ...paint,
        alpha: decay(share),
        width: 2 * stage.scale,
      });
    },
    color: '#e6ecf5',
    span: 380,
  },
  [Statuses.Raging]: {
    paint: (context, stage, share, paint) => {
      burst(context, stage.source, REACH * stage.scale * (0.8 + share * 0.8), 8, 29, {
        ...paint,
        alpha: decay(share),
        width: 2.6 * stage.scale,
      });
    },
    color: '#ff5a3c',
    span: 520,
  },
  [Statuses.Infatuated]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let beat = 0; beat < 3; beat += 1) {
        const held = (share * 1.2 + beat * 0.3) % 1;
        const drift = (noise(31, beat) - 0.5) * size * 1.6;

        heart(
          context,
          [stage.source[0] + drift, stage.source[1] - held * size * 2],
          size * 0.4 * (0.6 + held * 0.5),
          { ...paint, alpha: swell(held) },
        );
      }
    },
    color: '#ef70ef',
    span: 820,
  },
  [Statuses.Seeding]: { paint: rising(6, 37), color: '#3fa129', span: 620 },
  // The doll standing in for it: a shell around the body
  [Statuses.Substituted]: {
    paint: (context, stage, share, paint) => {
      for (let shell = 0; shell < 2; shell += 1) {
        ring(
          context,
          stage.source,
          REACH * stage.scale * (1.2 + shell * 0.3) * (0.7 + share * 0.4),
          {
            ...paint,
            alpha: swell(share) * (0.9 - shell * 0.3),
            width: 2 * stage.scale,
          },
        );
      }
    },
    color: '#9a9a6a',
    span: 620,
  },
  // Coils drawn round the body, tightening as they arrive
  [Statuses.Trapped]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let coil = 0; coil < 3; coil += 1) {
        const held = (share * 1.2 + coil * 0.3) % 1;

        ring(
          context,
          [stage.source[0], stage.source[1] - (held - 0.5) * size],
          size * (1.3 - held * 0.5),
          {
            ...paint,
            alpha: swell(held) * 0.9,
            width: 2.4 * stage.scale,
          },
        );
      }
    },
    color: '#b8a038',
    span: 620,
  },
  // Nothing left in it: everything falls rather than rises
  [Statuses.Recharging]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let drop = 0; drop < 4; drop += 1) {
        const held = (share * 1.3 + noise(53, drop)) % 1;
        const drift = (noise(53, drop + 7) - 0.5) * size * 1.8;

        orb(context, [stage.source[0] + drift, stage.source[1] + held * size], 2.2 * stage.scale, {
          ...paint,
          alpha: decay(held) * 0.9,
        });
      }
    },
    color: '#8f9ba8',
    span: 520,
  },
  // Asleep on its feet: one slow ring settling over it
  [Statuses.Dormant]: {
    paint: (context, stage, share, paint) => {
      ring(context, stage.source, REACH * stage.scale * (1.8 - share * 0.7), {
        ...paint,
        alpha: swell(share) * 0.8,
        width: 3 * stage.scale,
      });
    },
    color: '#6a7fa8',
    span: 900,
  },
  // Taking it: rings drawn inward, since what a Bide does is keep
  // what it was hit with
  [Statuses.Biding]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let pull = 0; pull < 3; pull += 1) {
        const held = (share * 1.4 + pull * 0.33) % 1;

        ring(context, stage.source, size * 2 * (1 - held), {
          ...paint,
          alpha: swell(held) * 0.9,
          width: 2.4 * stage.scale,
        });
      }
    },
    color: '#c86a3c',
    span: 720,
  },
  [Statuses.FocusEnergy]: {
    paint: (context, stage, share, paint) => {
      chevrons(context, stage.source, REACH * stage.scale, 3, share, {
        ...paint,
        alpha: swell(share),
        width: 2.4 * stage.scale,
      });
    },
    color: '#fac000',
    span: 640,
  },

  // The Johto statuses. A guard is a shell, a brace is a stance, a
  // hold is a ring nothing crosses, and the ghost pair are marks that
  // hang rather than rise
  [Statuses.Protected]: {
    paint: (context, stage, share, paint) => {
      ring(context, stage.source, REACH * stage.scale * (1.6 + swell(share) * 0.3), {
        ...paint,
        alpha: swell(share),
        width: 3.2 * stage.scale,
      });
    },
    color: '#6fa8c9',
    span: 520,
  },
  [Statuses.Enduring]: {
    paint: (context, stage, share, paint) => {
      chevrons(context, stage.source, REACH * stage.scale, 2, 1 - share, {
        ...paint,
        alpha: swell(share),
        width: 3 * stage.scale,
      });
    },
    color: '#b98a4a',
    span: 520,
  },
  // Drawn under it rather than over it: what a hold takes away is the
  // ground it would have walked off on
  [Statuses.Cornered]: {
    paint: (context, stage, share, paint) => {
      ring(
        context,
        [stage.source[0], stage.source[1] + REACH * stage.scale * 0.4],
        REACH * stage.scale * (1.9 - share * 0.5),
        {
          ...paint,
          alpha: swell(share) * 0.9,
          width: 2.6 * stage.scale,
        },
      );
    },
    color: '#6a5a7a',
    span: 620,
  },
  [Statuses.Nightmared]: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);
      const size = REACH * stage.scale;

      orb(context, at, size * (0.6 + swell(share) * 0.5), { ...paint, alpha: swell(share) * 0.8 });
      motes(context, at, size * 1.4, 6, 83, share, {
        ...paint,
        alpha: decay(share) * 0.8,
        width: 2.2 * stage.scale,
      });
    },
    color: '#4a3f6a',
    span: 720,
  },
  // A count rather than a condition: rings arriving one after another
  [Statuses.Perishing]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let beat = 0; beat < 3; beat += 1) {
        const held = (share * 1.3 + beat * 0.33) % 1;

        ring(context, over(stage), size * (0.5 + held * 1.4), {
          ...paint,
          alpha: decay(held) * 0.9,
          width: 2.2 * stage.scale,
        });
      }
    },
    color: '#8a4a6a',
    span: 820,
  },
  // Two of them tied together, which is the whole of what it says
  [Statuses.Bonded]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let knot = 0; knot < 2; knot += 1) {
        ring(context, [stage.source[0] + (knot - 0.5) * size * 1.2, stage.source[1]], size * 0.8, {
          ...paint,
          alpha: swell(share) * 0.9,
          width: 2.6 * stage.scale,
        });
      }
    },
    color: '#5a4a7a',
    span: 620,
  },
  [Statuses.Cursed]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      // A nail driven down into it, which is what the mainline draws
      context.strokeStyle = fade(paint.color, swell(share));
      context.lineWidth = 3 * stage.scale;
      context.beginPath();
      context.moveTo(stage.source[0], stage.source[1] - size * (2.2 - share * 1.2));
      context.lineTo(stage.source[0], stage.source[1] - size * 0.2);
      context.stroke();
      ring(context, stage.source, size * (1.4 - share * 0.4), {
        ...paint,
        alpha: swell(share) * 0.8,
        width: 2.2 * stage.scale,
      });
    },
    color: '#6a2f5a',
    span: 720,
  },
  [Statuses.Encored]: {
    paint: (context, stage, share, paint) => {
      chevrons(context, over(stage), REACH * stage.scale * 0.9, 3, share, {
        ...paint,
        alpha: swell(share),
        width: 2.2 * stage.scale,
      });
    },
    color: '#c98ab0',
    span: 620,
  },
  // Pointed out: a mark that opens over it and stays open
  [Statuses.Identified]: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);
      const size = REACH * stage.scale;

      ring(context, at, size * (0.4 + share * 0.6), {
        ...paint,
        alpha: swell(share),
        width: 2.4 * stage.scale,
      });
      orb(context, at, size * 0.22, { ...paint, alpha: swell(share) });
    },
    color: '#a8a8a8',
    span: 560,
  },
  // Hoenn. Most of these forbid something rather than hurt it, so the
  // mark is a shape held on the body rather than something rising off
  // it
  [Statuses.Taunted]: {
    paint: (context, stage, share, paint) => {
      chevrons(context, over(stage), REACH * stage.scale * 0.8, 2, 1 - share, {
        ...paint,
        alpha: swell(share),
        width: 3 * stage.scale,
      });
    },
    color: '#705848',
    span: 560,
  },
  // The same thing twice, refused: a ring over the head that closes
  [Statuses.Tormented]: {
    paint: (context, stage, share, paint) => {
      ring(context, over(stage), REACH * stage.scale * (1.2 - share * 0.8), {
        ...paint,
        alpha: swell(share),
        width: 2.8 * stage.scale,
      });
    },
    color: '#5a4a58',
    span: 620,
  },
  // Bars across it, which is what being shut out of its own moves is
  [Statuses.Imprisoned]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      context.strokeStyle = fade(paint.color, swell(share) * 0.9);
      context.lineWidth = 2.4 * stage.scale;
      context.beginPath();
      for (let bar = 0; bar < 3; bar += 1) {
        const along = stage.source[0] + (bar - 1) * size * 0.7;

        context.moveTo(along, stage.source[1] - size * 1.1);
        context.lineTo(along, stage.source[1] + size * 0.9);
      }
      context.stroke();
    },
    color: '#f85888',
    span: 620,
  },
  // Down into the floor, where the recovery comes from
  [Statuses.Rooted]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      shards(
        context,
        [stage.source[0], stage.source[1] + size * 0.7],
        size * (0.6 + share * 0.8),
        4,
        29,
        share,
        { ...paint, alpha: swell(share), width: 2.6 * stage.scale },
      );
    },
    color: '#3fa129',
    span: 620,
  },
  // The bubble the mainline draws, swelling until it goes
  [Statuses.Drowsy]: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);

      orb(context, at, REACH * stage.scale * (0.3 + share * 0.7), {
        ...paint,
        alpha: swell(share) * 0.8,
      });
    },
    color: '#8fa2d8',
    span: 700,
  },
  // Everything coming to it: rings closing in rather than going out
  [Statuses.Centered]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let pull = 0; pull < 2; pull += 1) {
        const held = (share * 1.3 + pull * 0.5) % 1;

        ring(context, stage.source, size * (2.2 - held * 1.5), {
          ...paint,
          alpha: swell(held) * 0.9,
          width: 2.6 * stage.scale,
        });
      }
    },
    color: '#f8d030',
    span: 620,
  },
  // A shell, and what came at it going back out
  [Statuses.Coated]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      ring(context, stage.source, size * 1.7, {
        ...paint,
        alpha: swell(share) * 0.8,
        width: 3 * stage.scale,
      });
      chevrons(context, over(stage, LIFT * 1.4), size * 0.7, 1, share, {
        ...paint,
        alpha: swell(share),
        width: 2.6 * stage.scale,
      });
    },
    color: '#f85888',
    span: 620,
  },
  // Waiting to take it: a mark over the head that darts aside
  [Statuses.Snatching]: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);
      const size = REACH * stage.scale;

      star(context, [at[0] + share * size * 1.4, at[1]], size * 0.4, share * 4, {
        ...paint,
        alpha: swell(share),
      });
    },
    color: '#705848',
    span: 520,
  },
  // Held under it, waiting on whatever knocks it out
  [Statuses.Grudging]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;
      const at: Point = [stage.source[0], stage.source[1] + size * 0.6];

      ring(context, at, size * (1.4 - swell(share) * 0.4), {
        ...paint,
        alpha: swell(share) * 0.9,
        width: 2.6 * stage.scale,
      });
      motes(context, at, size * 1.2, 5, 101, share, {
        ...paint,
        alpha: decay(share) * 0.8,
        width: 2.2 * stage.scale,
      });
    },
    color: '#6a4a7a',
    span: 660,
  },
  // Heard rather than worn: rings leaving it, the way the move lands
  [Statuses.Uproaring]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let pulse = 0; pulse < 3; pulse += 1) {
        const held = (share * 1.4 + pulse * 0.33) % 1;

        ring(context, stage.source, size * (0.5 + held * 1.8), {
          ...paint,
          alpha: decay(held) * 0.9,
          width: 2.4 * stage.scale,
        });
      }
    },
    color: '#c8b070',
    span: 720,
  },
  // A hand under the next move, lifting it
  [Statuses.Helped]: {
    paint: (context, stage, share, paint) => {
      chevrons(context, stage.source, REACH * stage.scale * 0.9, 2, share, {
        ...paint,
        alpha: swell(share),
        width: 3 * stage.scale,
      });
    },
    color: '#f8d030',
    span: 560,
  },
  // Asleep and staying asleep: the sleeping puffs, held steady rather
  // than drifting off
  [Statuses.Comatose]: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);
      const size = REACH * stage.scale;

      for (let puff = 0; puff < 2; puff += 1) {
        ring(context, [at[0] + puff * size * 0.6, at[1] - puff * size * 0.5], size * 0.3, {
          ...paint,
          alpha: swell(share) * 0.8,
          width: 2 * stage.scale,
        });
      }
    },
    color: '#7a6a9a',
    span: 820,
  },
};

/** How much quieter a status is each time it bites than when it landed. */
const TICK_ALPHA = 0.7;
const TICK_SCALE = 0.75;

/**
 * A pokemon that tried and could not: the bar over the head, drawn
 * over whatever the status itself is doing.
 *
 * Landing and biting are different events and were drawing the same
 * picture at two sizes, so a sleep that blocked a cast looked like a
 * sleep landing again. This is what all the blocking statuses share —
 * the refusal — and each one keeps its own mark underneath
 */
function stalled(
  under?: (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted) => void,
) {
  return (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted): void => {
    under?.(context, stage, share, paint);

    const at = over(stage);
    const size = REACH * stage.scale * 0.7;
    // Snaps to full size and holds, rather than swelling: a refusal is
    // instant, and a mark that grows reads as something arriving
    const alpha = share < 0.15 ? share / 0.15 : decay((share - 0.15) / 0.85);

    ring(context, at, size, { ...paint, alpha, width: 3 * stage.scale });
    context.strokeStyle = fade(paint.color, alpha);
    context.lineWidth = 3 * stage.scale;
    context.beginPath();
    context.moveTo(at[0] - size * 0.7, at[1] - size * 0.7);
    context.lineTo(at[0] + size * 0.7, at[1] + size * 0.7);
    context.stroke();
  };
}

/**
 * Health coming off on the status's own clock: everything falls, and
 * the body it fell from flashes. The opposite of the landing cues,
 * which rise
 */
function bitten(count: number, seed: number) {
  return (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted): void => {
    const size = REACH * stage.scale;

    ring(context, stage.source, size * (0.8 + share * 0.6), {
      ...paint,
      alpha: decay(share) * 0.7,
      width: 2 * stage.scale,
    });
    for (let drip = 0; drip < count; drip += 1) {
      const held = (share * 1.4 + noise(seed, drip)) % 1;
      const drift = (noise(seed, drip + 11) - 0.5) * size * 1.8;

      orb(
        context,
        [stage.source[0] + drift, stage.source[1] - size * 0.6 + held * size * 1.8],
        2.6 * stage.scale,
        { ...paint, alpha: decay(held) },
      );
    }
  };
}

/**
 * What a status looks like the moment it **does** something: the cast
 * it refused, the health it took, the hit it kept.
 *
 * Anything with no entry falls back to a quieter copy of its landing
 * cue, which is what everything used to do
 */
const STATUS_TRIGGERS: Partial<Record<Statuses, Cue>> = {
  // A snore going up with it, so a blocked cast is not mistaken for
  // falling asleep a second time
  [Statuses.Sleeping]: {
    paint: stalled((context, stage, share, paint) => {
      const at = over(stage, LIFT * 1.7);
      const size = REACH * stage.scale * (0.5 + share * 0.4);

      // A Z, drawn as its three strokes
      context.strokeStyle = fade(paint.color, swell(share));
      context.lineWidth = 2.4 * stage.scale;
      context.beginPath();
      context.moveTo(at[0] - size, at[1] - size);
      context.lineTo(at[0] + size, at[1] - size);
      context.lineTo(at[0] - size, at[1] + size);
      context.lineTo(at[0] + size, at[1] + size);
      context.stroke();
    }),
    color: '#8fa2d8',
    span: 720,
  },

  // The whole body crackling rather than two arcs across it
  [Statuses.Paralyzed]: {
    paint: stalled((context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let arc = 0; arc < 4; arc += 1) {
        const angle = (arc / 4) * Math.PI * 2 + share;

        bolt(
          context,
          stage.source,
          [
            stage.source[0] + Math.cos(angle) * size * 1.6,
            stage.source[1] + Math.sin(angle) * size * 1.2,
          ],
          arc + 3,
          { ...paint, alpha: decay(share) * 1.3, width: 2.2 * stage.scale },
        );
      }
    }),
    color: '#fac000',
    span: 520,
  },

  // Frozen solid: the shards stop moving and the block round it holds
  [Statuses.Frozen]: {
    paint: stalled((context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let face = 0; face < 2; face += 1) {
        ring(context, stage.source, size * (1.1 + face * 0.35), {
          ...paint,
          alpha: (share < 0.7 ? 1 : decay((share - 0.7) / 0.3)) * (0.9 - face * 0.3),
          width: 2.6 * stage.scale,
        });
      }
    }),
    color: '#3dcef3',
    span: 560,
  },

  [Statuses.Flinched]: { paint: stalled(), color: '#e6ecf5', span: 420 },
  [Statuses.Recharging]: { paint: stalled(), color: '#8f9ba8', span: 480 },
  [Statuses.Dormant]: { paint: stalled(), color: '#6a7fa8', span: 620 },

  // It went for somebody it likes instead
  [Statuses.Infatuated]: {
    paint: stalled((context, stage, share, paint) => {
      heart(context, over(stage, LIFT * 1.6), REACH * stage.scale * 0.45 * swell(share), {
        ...paint,
        alpha: swell(share),
      });
    }),
    color: '#ef70ef',
    span: 640,
  },

  // It hit itself: the picture belongs on the body, not over the head
  [Statuses.Confused]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      burst(context, stage.source, size * (0.6 + share * 1.2), 7, 17, {
        ...paint,
        alpha: decay(share),
        width: 2.6 * stage.scale,
      });
      for (let mark = 0; mark < 3; mark += 1) {
        const angle = share * Math.PI * 2 + (mark / 3) * Math.PI * 2;

        star(
          context,
          [
            stage.source[0] + Math.cos(angle) * size * 1.4,
            stage.source[1] - LIFT * stage.scale + Math.sin(angle) * size * 0.5,
          ],
          size * 0.34,
          angle,
          { ...paint, alpha: swell(share) },
        );
      }
    },
    color: '#ef70ef',
    span: 560,
  },

  // The squeeze, rather than the coils arriving
  [Statuses.Trapped]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let coil = 0; coil < 3; coil += 1) {
        const off = (coil - 1) * size * 0.5;

        ring(context, [stage.source[0], stage.source[1] + off], size * (1.4 - swell(share) * 0.7), {
          ...paint,
          alpha: 0.9,
          width: 2.6 * stage.scale,
        });
      }
    },
    color: '#b8a038',
    span: 480,
  },

  // What it kept, drawn going in
  [Statuses.Biding]: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      for (let mote = 0; mote < 6; mote += 1) {
        const held = (share * 1.5 + noise(59, mote)) % 1;
        const angle = noise(59, mote + 13) * Math.PI * 2;
        const reach = size * 2.2 * (1 - held);

        orb(
          context,
          [
            stage.source[0] + Math.cos(angle) * reach,
            stage.source[1] + Math.sin(angle) * reach * 0.7,
          ],
          2.6 * stage.scale,
          { ...paint, alpha: swell(held) },
        );
      }
    },
    color: '#c86a3c',
    span: 620,
  },

  // The residuals: health leaving on the status's own clock
  [Statuses.Cursed]: { paint: bitten(7, 89), color: '#6a2f5a', span: 620 },
  [Statuses.Nightmared]: { paint: bitten(7, 97), color: '#4a3f6a', span: 620 },
  [Statuses.Poisoned]: { paint: bitten(6, 61), color: '#9141cb', span: 560 },
  [Statuses.BadlyPoisoned]: { paint: bitten(9, 67), color: '#6e2f9c', span: 620 },
  [Statuses.Burned]: { paint: bitten(6, 71), color: '#e62829', span: 560 },
  [Statuses.Seeding]: { paint: bitten(5, 73), color: '#3fa129', span: 560 },
};

function played(cue: Cue, scale = 1, alpha = 1): PaintedVisual {
  const paint: Painted = { color: cue.color, alpha };
  const painter: Painter = (context, stage, share) => {
    cue.paint(context, { ...stage, scale: stage.scale * scale }, share, paint);
  };

  return new PaintedVisual(cue.span, painter);
}

/** The moment a status lands. */
export function statusCueFor(status: Statuses): PaintedVisual | null {
  const cue = STATUS_CUES[status];

  return cue == null ? null : played(cue);
}

/**
 * The moment a status does something: its own picture where it has
 * one, and a quieter copy of the landing where it has not
 */
export function statusTriggerFor(status: Statuses): PaintedVisual | null {
  const trigger = STATUS_TRIGGERS[status];

  if (trigger != null) {
    return played(trigger);
  }
  const cue = STATUS_CUES[status];

  return cue == null ? null : played(cue, TICK_SCALE, TICK_ALPHA);
}

/**
 * What an ability looks like when it fires.
 *
 * An ability is the quietest thing in a fight — no cast, no flight,
 * and the only sign of one is a number that came out different — so
 * **every** trigger draws something. The default is a ring and a
 * sparkle over the head, which says "that was the ability" without
 * claiming to say which; the kinds below are for the ones where the
 * shape can say more than that
 */
type CueKind =
  | 'Pulse'
  | 'Rise'
  | 'Mend'
  | 'Menace'
  | 'Spark'
  | 'Ail'
  | 'Rush'
  | 'Notice'
  | 'Berry'
  | 'Guard'
  | 'Barb';

const CUE_KINDS: Record<CueKind, Cue> = {
  Pulse: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);

      ring(context, at, REACH * stage.scale * (0.4 + share * 1.1), {
        ...paint,
        alpha: decay(share),
        width: 2 * stage.scale,
      });
      star(context, at, REACH * stage.scale * 0.3 * swell(share), share * 3, { ...paint });
    },
    color: '#e6ecf5',
    span: 480,
  },
  Rise: {
    paint: (context, stage, share, paint) => {
      chevrons(context, stage.source, REACH * stage.scale, 3, share, {
        ...paint,
        alpha: swell(share),
        width: 2.4 * stage.scale,
      });
    },
    color: '#f0d264',
    span: 560,
  },
  Mend: {
    paint: (context, stage, share, paint) => {
      for (let mote = 0; mote < 6; mote += 1) {
        const held = (share + noise(41, mote)) % 1;
        const drift = (noise(41, mote + 9) - 0.5) * REACH * stage.scale * 2;

        orb(
          context,
          [stage.source[0] + drift, stage.source[1] - held * REACH * stage.scale * 2],
          2.4 * stage.scale,
          { ...paint, alpha: swell(held) },
        );
      }
    },
    color: '#4cc46a',
    span: 640,
  },
  Menace: {
    paint: (context, stage, share, paint) => {
      ring(context, stage.source, REACH * stage.scale * (1.6 - share * 1.1), {
        ...paint,
        alpha: swell(share),
        width: 3 * stage.scale,
      });
    },
    color: '#624d4e',
    span: 520,
  },
  Spark: {
    paint: (context, stage, share, paint) => {
      burst(context, stage.source, REACH * stage.scale * (0.5 + share), 6, 53, {
        ...paint,
        alpha: decay(share),
        width: 2 * stage.scale,
      });
    },
    color: '#fac000',
    span: 420,
  },
  Ail: { paint: rising(6, 59), color: '#9141cb', span: 560 },
  Rush: {
    paint: (context, stage, share, paint) => {
      const size = REACH * stage.scale;

      context.strokeStyle = '';
      for (let streak = 0; streak < 3; streak += 1) {
        const held = (share * 1.5 + streak * 0.3) % 1;

        ring(
          context,
          [stage.source[0] + (held - 0.5) * size * 3, stage.source[1] - streak * size * 0.5],
          size * 0.14,
          { ...paint, alpha: swell(held) * 0.9, width: 2 * stage.scale },
        );
      }
    },
    color: '#81b9ef',
    span: 420,
  },
  Notice: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);

      star(context, at, REACH * stage.scale * 0.5 * (0.5 + swell(share)), 0, {
        ...paint,
        alpha: swell(share) + 0.2,
      });
    },
    color: '#fac000',
    span: 480,
  },
  // Something eaten: it is held over the head, and then it is not
  Berry: {
    paint: (context, stage, share, paint) => {
      const at = over(stage);
      const size = REACH * stage.scale;

      if (share < 0.45) {
        orb(context, at, size * 0.42 * (0.6 + share), { ...paint, alpha: 1 });
      } else {
        motes(context, at, size * 1.3, 6, 67, share, {
          ...paint,
          alpha: decay(share) * 1.6,
          width: 2.2 * stage.scale,
        });
      }
    },
    color: '#e0566a',
    span: 520,
  },
  // Something held that took the blow: a shell flashing where it was
  // hit and going again
  Guard: {
    paint: (context, stage, share, paint) => {
      for (let shell = 0; shell < 2; shell += 1) {
        ring(context, stage.source, REACH * stage.scale * (1.1 + shell * 0.3), {
          ...paint,
          alpha: swell(Math.max(0, share * 1.4 - shell * 0.25)),
          width: 2.6 * stage.scale,
        });
      }
    },
    color: '#c8d2e0',
    span: 460,
  },
  // Something held that hurt whoever touched it
  Barb: {
    paint: (context, stage, share, paint) => {
      shards(context, stage.source, REACH * stage.scale * 1.2, 5, 71, share, {
        ...paint,
        alpha: decay(share),
        width: 2.6 * stage.scale,
      });
    },
    color: '#8a5a4a',
    span: 440,
  },
};

const ABILITY_CUES: Partial<Record<Abilities, CueKind>> = {
  // What the toucher catches
  [Abilities.Static]: 'Spark',
  [Abilities.LightningRod]: 'Spark',
  [Abilities.FlashFire]: 'Spark',
  [Abilities.FlameBody]: 'Ail',
  [Abilities.PoisonPoint]: 'Ail',
  [Abilities.PoisonTouch]: 'Ail',
  [Abilities.LiquidOoze]: 'Ail',
  [Abilities.Stench]: 'Ail',
  [Abilities.EffectSpore]: 'Ail',
  [Abilities.CuteCharm]: 'Ail',
  [Abilities.RoughSkin]: 'Barb',

  // Something rose
  [Abilities.AngerPoint]: 'Rise',
  [Abilities.Moxie]: 'Rise',
  [Abilities.Justified]: 'Rise',
  [Abilities.Defiant]: 'Rise',
  [Abilities.Competitive]: 'Rise',
  [Abilities.Download]: 'Rise',

  // Something got faster
  [Abilities.Rattled]: 'Rush',
  [Abilities.Steadfast]: 'Rush',
  [Abilities.Unburden]: 'Rush',
  [Abilities.WeakArmor]: 'Rush',
  [Abilities.RunAway]: 'Rush',
  [Abilities.SwiftSwim]: 'Rush',
  [Abilities.Chlorophyll]: 'Rush',

  // Something mended
  [Abilities.Regenerator]: 'Mend',
  [Abilities.RainDish]: 'Mend',
  [Abilities.IceBody]: 'Mend',
  [Abilities.DrySkin]: 'Mend',
  [Abilities.ShedSkin]: 'Mend',
  [Abilities.NaturalCure]: 'Mend',
  [Abilities.Healer]: 'Mend',

  // Something was noticed before it happened
  [Abilities.Anticipation]: 'Notice',
  [Abilities.Forewarn]: 'Notice',
  [Abilities.Frisk]: 'Notice',
  [Abilities.Trace]: 'Notice',
  [Abilities.Pickup]: 'Notice',
  [Abilities.Harvest]: 'Notice',

  // Something weighs on the other side of the field
  [Abilities.Pressure]: 'Menace',
  [Abilities.Unnerve]: 'Menace',
  [Abilities.NeutralizingGas]: 'Menace',
  [Abilities.MoldBreaker]: 'Menace',
  [Abilities.Intimidate]: 'Menace',
  [Abilities.CursedBody]: 'Menace',
  [Abilities.BadDreams]: 'Menace',
  [Abilities.Boss]: 'Menace',
};

export default function abilityCueFor(ability: Abilities): PaintedVisual {
  return played(CUE_KINDS[ABILITY_CUES[ability] ?? 'Pulse']);
}

/**
 * The gear whose trigger the item's own kind cannot describe. A berry
 * is eaten whatever it does, but a held thing does one of several
 * things and the shape should say which
 */
const ITEM_CUES: Partial<Record<Items, CueKind>> = {
  // It took the hit so the holder did not
  [Items.FocusBand]: 'Guard',
  [Items.FocusSash]: 'Guard',
  [Items.AirBalloon]: 'Guard',
  [Items.EjectButton]: 'Guard',
  // It hurt whoever touched it
  [Items.RockyHelmet]: 'Barb',
  [Items.StickyBarb]: 'Barb',
  [Items.DestinyKnot]: 'Barb',
  [Items.RingTarget]: 'Barb',
  // It got there first
  [Items.QuickClaw]: 'Rush',
  [Items.ChoiceScarf]: 'Rush',
};

/**
 * What an item looks like when it goes off.
 *
 * Held items are the quietest thing on the field after abilities — a
 * berry is eaten and a number comes out different — so every trigger
 * draws, and what it draws comes off the item's own kind when nothing
 * more specific is known
 */
export function itemCueFor(item: Items): PaintedVisual {
  const named = ITEM_CUES[item];

  if (named != null) {
    return played(CUE_KINDS[named]);
  }
  try {
    // Eaten rather than worn: berries are the one kind whose trigger
    // is always the same event
    return played(CUE_KINDS[getItemData(item).type === ItemTypes.Berry ? 'Berry' : 'Pulse']);
  } catch {
    // An item with no entry is still an item that fired
    return played(CUE_KINDS.Pulse);
  }
}
