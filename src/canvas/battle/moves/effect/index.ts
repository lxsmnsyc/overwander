import { MoveAffects, MoveCategories, MoveFlags, Moves } from '../../../../data/ids/moves';
import { Types } from '../../../../data/constants/types';
import { getMoveData } from '../../../../data/moves';
import { MULTI_HIT_MOVES } from '../../../../battle/moves/multi-hit';
import { getStageMoveEffect } from '../../../../battle/moves/stage';
import PaintedVisual, { type Painter } from '../__painted';
import type { Painted } from '../__paint';
import care from './care';
import colorOf from './colors';
import contact from './contact';
import elements from './elements';
import minds from './minds';
import { BY_TYPE, NAMED } from './named';

import {
  type EffectShape,
  OVER_A_SIDE,
  SPANS,
  type ShapePainter,
  middle,
  weightOf,
} from './shapes';

export type { EffectShape } from './shapes';
export { weightOf } from './shapes';

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

/**
 * Where a contact hit stops being a jab and where it becomes a whole
 * body arriving, by weight
 */
const JAB = 0.95;
const SLAM = 1.4;

/**
 * What a landing is coloured. A move is its own type, except where
 * the shape is about something else: health coming back is the health
 * bar's green, and a stat is whichever stat it was
 */
/**
 * The two screens, by what each holds off: the same blue and green
 * the Defense and Sp. Defense stages are drawn in, so a screen and
 * the stat it stands in for read as one thing
 */

/**
 * Which shape a move lands as, and what it is coloured and sized
 * with. The shapes themselves are beside this file, grouped by what
 * they are a picture of
 */

const PAINTERS: Record<EffectShape, ShapePainter> = {
  ...contact,
  ...elements,
  ...minds,
  ...care,
};

/**
 * What a contact hit looks like.
 *
 * It is the commonest thing in the game, and one burst for all of it
 * left a Quick Attack and a Double Edge as the same picture at two
 * sizes. What separates them is how the hit was thrown, which the
 * move's type and power already say
 */
function contactShape(move: Moves, type: Types): EffectShape {
  // A fist or a foot rather than a body, whatever it weighs
  if (type === Types.Fighting) {
    return 'Brawl';
  }
  const weight = weightOf(move);

  if (weight >= SLAM) {
    return 'Slam';
  }
  return weight <= JAB ? 'Jab' : 'Impact';
}

/** What this move does when it lands. */
export function effectShapeFor(move: Moves): EffectShape {
  // A move that moves a stat is drawn by what it did to it, ahead of
  // anything else it looks like: one picture for every rise and the
  // same turned over for every drop, on whoever it landed on. What
  // the move was, a growl or a flash, is the gap it crossed
  const stage = getStageMoveEffect(move);

  if (stage != null) {
    return stage.value > 0 ? 'Boost' : 'Drop';
  }
  const named = NAMED[move];

  if (named != null) {
    return named;
  }

  const data = getMoveData(move);

  // Heard rather than seen, whatever else the move is. Unlike the bite
  // and the edge below, this one answers status moves too: a song that
  // puts something to sleep is still a song
  if ((data.flags & MoveFlags.Sound) !== 0) {
    return 'Wave';
  }
  // A move that strikes several times looks like several strikes,
  // whatever else it is
  if (MULTI_HIT_MOVES[move] != null) {
    return 'Volley';
  }
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
    return (data.flags & MoveFlags.Contact) === 0
      ? (BY_TYPE[data.type] ?? 'Impact')
      : contactShape(move, data.type);
  }
  return BY_TYPE[data.type] ?? 'Bloom';
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

function painted(shape: EffectShape, move: Moves, weight: number): PaintedVisual {
  const paint: Painted = { color: colorOf(move, shape) };
  const painter: Painter = (context, stage, share) => {
    // Once per pokemon it reached. A move aimed at a whole team lands
    // on all of them at once, and the shape has no idea how many that
    // is — it draws one landing and this runs it for each. The seed
    // moves with the target so a spread move scatters differently on
    // each of them rather than stamping the same picture out
    const landings = stage.targets.length > 0 ? stage.targets : [stage.source];

    if (OVER_A_SIDE.has(shape)) {
      PAINTERS[shape](context, { ...stage, targets: [middle(landings)] }, share, {
        paint,
        seed: move + 1,
        weight,
      });
      return;
    }

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
