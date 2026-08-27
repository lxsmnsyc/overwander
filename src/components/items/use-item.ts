import useBall from '../../auth/balls';
import useBottleCap from '../../auth/bottle-caps';
import { useRareCandy } from '../../auth/candy';
import type { CaughtPokemon } from '../../auth/caught';
import { getMovePoints, isShadow } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import useHealingItem from '../../auth/healing';
import { healedByItem } from '../../auth/health';
import usePurifyingGem from '../../auth/purify';
import { feedEffortBerry, useEffortItem } from '../../auth/training';
import { MAX_LEVEL } from '../../data/constants/levels';
import { Items, getBall, getMachineMove, isMachineItem } from '../../data/ids/items';
import type { Moves } from '../../data/ids/moves';
import { BERRY_EFFORT_DROPS } from '../../data/items/berries';
import { isBottleCap, isPerfectIVs } from '../../data/items/bottle-caps';
import { isHerbal } from '../../data/items/medicine';
import { isPurifyingGem } from '../../data/items/purifying-gem';
import { isPPItem, isVitamin } from '../../data/items/vitamins';
import { isWing } from '../../data/items/wings';
import { PP_UP_LIMIT } from '../../data/moves';
import { getMovesLearnedAt, getSpeciesData } from '../../data/species';
import type { ToastTone } from '../styled';
import { describeItem } from '../details';
import { describeIVs, withArticle } from '../catches/catch-dialog/describe';

/**
 * Spending one item on one pokemon: whether it would mean anything,
 * what it asks back first, and what to say once it lands.
 *
 * It lives apart from the sheet because the bag does it too, and from
 * opposite ends: the sheet has the pokemon and picks the item, the bag
 * has the item and picks the pokemon. Both end in the same call and
 * the same sentence.
 */

/** Whether the item is one that grants effort: a wing, or a vitamin */
export function isEffortItem(item: Items): boolean {
  return isWing(item) || isVitamin(item);
}

/**
 * Whether spending it on this one would mean anything. Nothing is
 * ever offered where it would be spent on nothing: a cap on a
 * flawless pokemon, a machine for a move it knows already, a ball it
 * is sitting in
 */
export function isUsableOn(item: Items, caught: CaughtPokemon): boolean {
  // There is nothing in an egg yet to spend anything on
  if (isEgg(caught)) {
    return false;
  }
  // The universal candy: a level for anything that can still grow
  if (item === Items.RareCandy) {
    return caught.level < MAX_LEVEL;
  }
  if (isBottleCap(item)) {
    return !isPerfectIVs(caught.ivs);
  }
  const ball = getBall(item);

  if (ball != null) {
    return ball !== caught.ball;
  }
  if (isPurifyingGem(item)) {
    return isShadow(caught);
  }
  // A machine is offered only where it would teach something: one this
  // species can learn and does not know already
  if (isMachineItem(item)) {
    const move = getMachineMove(item);

    return (
      move != null &&
      new Set(getSpeciesData(caught.species).learnSet.teachable).has(move) &&
      !new Set(caught.moves).has(move)
    );
  }
  // A bottle is offered only where there is a move for it to go on
  // that has not already taken everything it will take
  if (isPPItem(item)) {
    return caught.moves.some((move) => getMovePoints(caught, move) < PP_UP_LIMIT);
  }
  // A berry, a potion, a cure, a revive: offered only where it would
  // change something, since using it would spend it
  return healedByItem(caught, item) != null || isEffortItem(item) || BERRY_EFFORT_DROPS.has(item);
}

/**
 * Whether the item asks a question back before it is spent. A machine
 * asks which move is given up for it, and a bottle which move the
 * points land on. Neither can be taken back afterwards, so neither
 * leaves the bag until the question is answered
 */
export function asksAQuestion(item: Items): boolean {
  return isMachineItem(item) || isPPItem(item);
}

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

  return getMovesLearnedAt(caught.species, level).filter((learned) => !knows.has(learned));
}

/** What spending it came to */
export interface Spent {
  said: string;
  tone: ToastTone;
  /**
   * The level it grew to, for the one item that grows one. A level may
   * have a move waiting behind it: see `getLevelMoves`
   */
  level: number | null;
}

const refused = (item: Items): Spent => ({
  said: `${describeItem(item)} could not be used.`,
  tone: 'ember',
  level: null,
});

/**
 * Spend it. Every kind lands the same way: the server decides it
 * against the stored record and hands back what the pokemon now has,
 * so the caller re-reads rather than trusting its own arithmetic.
 *
 * The two that ask a question first are not spent here at all --
 * `asksAQuestion` names them, and their dialogs spend them
 */
export default async function spendItemOn(catchId: string, item: Items): Promise<Spent> {
  if (item === Items.RareCandy) {
    const level = await useRareCandy(catchId);

    return level == null
      ? { said: 'That candy could not be used.', tone: 'ember', level: null }
      : { said: `Grew to level ${level}.`, tone: 'neutral', level };
  }

  if (getBall(item) != null) {
    const ball = await useBall(catchId, item);

    return ball == null
      ? refused(item)
      : { said: `It is in ${withArticle(describeItem(item))} now.`, tone: 'neutral', level: null };
  }

  if (isBottleCap(item)) {
    const ivs = await useBottleCap(catchId, item);

    return ivs == null
      ? refused(item)
      : {
          said: `${describeItem(item)} polished it — ${describeIVs(ivs)}.`,
          tone: 'neutral',
          level: null,
        };
  }

  if (isPurifyingGem(item)) {
    const ivs = await usePurifyingGem(catchId, item);

    return ivs == null
      ? refused(item)
      : { said: `The shadow is gone — ${describeIVs(ivs)}.`, tone: 'neutral', level: null };
  }

  if (isEffortItem(item)) {
    const result = await useEffortItem(catchId, item);

    return result == null
      ? refused(item)
      : {
          said: `${describeItem(item)} — points it did not have to earn.`,
          tone: 'neutral',
          level: null,
        };
  }

  if (BERRY_EFFORT_DROPS.has(item)) {
    const result = await feedEffortBerry(catchId, item);

    return result == null
      ? { said: `${describeItem(item)} could not be fed.`, tone: 'ember', level: null }
      : {
          said: `Bitter, and good for it — ${result.unused} points back to spend, and it thinks the better of you.`,
          tone: 'neutral',
          level: null,
        };
  }

  const state = await useHealingItem(catchId, item);

  return state == null
    ? { said: `${describeItem(item)} would do nothing for it.`, tone: 'ember', level: null }
    : {
        // Herbal medicine is swallowed, and the pokemon holds it
        // against whoever handed it over
        said: `${describeItem(item)} used — ${state.health} HP.${
          isHerbal(item) ? ' It did not enjoy that.' : ''
        }`,
        tone: 'neutral',
        level: null,
      };
}
