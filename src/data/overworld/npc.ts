import { countsAgainstSlots } from '../constants/slots';
import { MAX_FRIENDSHIP } from '../constants/friendship';
import { MAX_IV } from '../constants/stats';
import type Abilities from '../ids/abilities';
import { Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import type { Species } from '../ids/species';
import {
  getLevelUpMoves,
  getSpeciesAbilities,
  getSpeciesData,
  getTeachableMoves,
} from '../species';
import { isTutorOnlyMove } from '../moves/tutor-only';

import Npc from '../ids/npcs';

export default Npc;

export {
  EXECUTIVE_CHARSETS,
  EXECUTIVE_HONORS,
  EXECUTIVE_NAMES,
  EXECUTIVE_QUOTES,
  Executive,
} from './syndicate';

/**
 * What the breeder charges for an egg. It is dear on purpose: an egg
 * bred from two pokemon a player already owns inherits their stats,
 * which is worth more than anything a nest leaves lying around
 */
export const BREEDING_FEE = 5000;

/**
 * What the daycare lady charges to push an egg along
 */
export const DAYCARE_FEE = 2500;

/**
 * What the groomer charges. It is the daycare lady's price for the
 * daycare lady's trade: half of what is left, bought rather than
 * walked for
 */
export const GROOMING_FEE = 2500;

/**
 * What the Move Reminder charges, and the only thing he takes. He is
 * the one wanderer whose price is not gold: a scale is dug out of the
 * ground and nothing sells one, so what paces him is walking rather
 * than a purse.
 *
 * One move costs **one** of them. There is no constant for the count
 * because there is no choice in it: `learnMove` spends a single item
 * whatever the item is, so a second figure here would only be
 * something to fall out of step with it
 */
export const REMINDER_FEE = Items.HeartScale;

/**
 * What the reminder can put back on a pokemon: everything its line has
 * learned by levelling up to its level, pre-evolutions included, minus
 * the ones it still knows. Earlier stages come first.
 *
 * The list is read off the species rather than the pokemon's history,
 * since a record keeps only the moves it knows now. The chain is walked
 * because an evolved species does not relist its pre-evolutions' moves.
 */
export function getRecallableMoves(
  species: Species,
  level: number,
  known: Iterable<Moves>,
): Moves[] {
  const knows = new Set(known);
  const moves: Moves[] = [];
  const line: Species[] = [];

  for (let stage: Species | undefined = species; stage != null;) {
    line.unshift(stage);
    const previous: Species | undefined = getSpeciesData(stage).evolvesFrom;
    stage = previous === stage ? undefined : previous;
  }
  for (const stage of line) {
    for (const move of getLevelUpMoves(stage, level)) {
      if (!knows.has(move)) {
        knows.add(move);
        moves.push(move);
      }
    }
  }
  return moves;
}

/**
 * What the tutor charges per lesson: the reminder's own price. One
 * scale, one lesson, and gold is no use to either of them
 */
export const TUTOR_FEE = Items.HeartScale;

/**
 * What the tutor can put on a pokemon: everything on its species'
 * teachable list, minus the moves it already knows. The list is the
 * machines' own — he teaches nothing a machine could not — so what he
 * sells is the lesson without the hunt for the disc
 */
/**
 * Whether the tutor turns this lesson down: a signature move of his
 * own is taught only to a pokemon at the most friendship it can have
 */
export function tutorRefuses(move: Moves, friendship: number): boolean {
  return isTutorOnlyMove(move) && friendship < MAX_FRIENDSHIP;
}

export function getTutorableMoves(species: Species, known: Iterable<Moves>): Moves[] {
  const knows = new Set(known);
  const moves: Moves[] = [];

  for (const move of getTeachableMoves(species)) {
    if (!knows.has(move)) {
      moves.push(move);
    }
  }
  return moves;
}

/**
 * What the Channeler charges: the reminder's own price. A scale is
 * dug out of the ground and nothing sells one, so what paces her is
 * walking rather than a purse
 */
export const CHANNELER_FEE = Items.HeartScale;

/** What the Hyper Trainer charges for each point a value is trained up */
export const HYPER_TRAINING_PER_POINT = 10_000;

/** What training this value to the top costs: every point it has left to climb */
export function hyperTrainingCost(iv: number): number {
  return Math.max(0, MAX_IV - iv) * HYPER_TRAINING_PER_POINT;
}

/** How many pokemon the trader has on offer at once */
export const TRADER_OFFERS = 6;

/** What the Dojo Master charges for one more move slot: the same scale */
export const DOJO_MASTER_FEE = Items.HeartScale;

/**
 * What she can still draw out of the pokemon: everything it could ever
 * come to have, minus what it already carries.
 *
 * The pool walks up the chain and stops there, so a Magikarp is never
 * offered what only a Gyarados knows. The special tier is left out of
 * both sides: a shadow's mark is not an ability the pokemon could have
 * been born with, and it takes up no room either way
 */
export function getAwakenableAbilities(species: Species, known: Iterable<Abilities>): Abilities[] {
  const knows = new Set(known);
  const abilities: Abilities[] = [];

  for (const ability of getSpeciesAbilities(species)) {
    if (countsAgainstSlots(ability) && !knows.has(ability)) {
      abilities.push(ability);
    }
  }
  return abilities;
}
