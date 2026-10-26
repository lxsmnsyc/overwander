import type { Moves } from '../data/ids/moves';
import { MAX_LEVEL } from '../data/constants/levels';
import { getMovesLearnedAt, getMovesLearnedBetween } from '../data/species';
import type { CaughtPokemon } from './caught-record';
import { isEgg } from './egg';

/**
 * The moves the level just reached has to offer.
 *
 * The species' list for **that level exactly**, minus anything it
 * knows already, so a candy bringing a pokemon back to a level it has
 * been at before does not offer the same move twice. A move from any
 * earlier level is the Move Reminder's trade and costs a Heart Scale
 */
export function getLevelMoves(caught: CaughtPokemon, level: number): Moves[] {
  if (isEgg(caught)) {
    return [];
  }

  const knows = new Set(caught.moves);

  const offered: Moves[] = [];

  for (const learned of getMovesLearnedAt(caught.species, level)) {
    if (!knows.has(learned)) {
      offered.push(learned);
    }
  }
  return offered;
}

/**
 * The same, for every level in a run of them: what a pokemon fed
 * twenty candies at once passed through, in the order it grew.
 *
 * A jump is not a level: the candy button gathers a run of presses
 * into one feeding, and the moves of the levels it went **through**
 * are as much the pokemon's as the one it stopped on. `from` and `to`
 * are both inclusive, so a grow from 5 to 25 asks for 6 through 25.
 *
 * A move listed at two of those levels is offered once, since being
 * asked the same question twice in one run is the same nuisance as
 * being asked about a move the pokemon already knows.
 *
 * It is the run the server judges a level-up move against, so both
 * read `getMovesLearnedBetween` rather than each walking the levels
 * their own way
 */
export function getLevelMovesBetween(caught: CaughtPokemon, from: number, to: number): Moves[] {
  if (isEgg(caught)) {
    return [];
  }

  const knows = new Set(caught.moves);

  const offered: Moves[] = [];

  for (const learned of getMovesLearnedBetween(caught.species, from, to)) {
    if (!knows.has(learned)) {
      offered.push(learned);
    }
  }
  return offered;
}

/**
 * The next level that would ask a question: the lowest one above
 * `above` where the species learns something this pokemon does not
 * know, or null where the rest of the way to the cap asks nothing.
 *
 * It is what lets a run of candy presses be batched at all. The store
 * teaches a levelled move only while the pokemon is standing on the
 * level that offers it, so a call that crosses several offers can
 * teach the last of them and no more. A stretch with no offer in it
 * has nothing to lose, and goes over in one call
 */
export function nextOfferLevel(caught: CaughtPokemon, above: number): number | null {
  if (isEgg(caught)) {
    return null;
  }

  const knows = new Set(caught.moves);

  for (let level = above + 1; level <= MAX_LEVEL; level++) {
    for (const move of getMovesLearnedAt(caught.species, level)) {
      if (!knows.has(move)) {
        return level;
      }
    }
  }
  return null;
}
