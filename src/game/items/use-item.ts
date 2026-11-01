import useBall from '../../auth/balls';
import useBottleCap from '../../auth/bottle-caps';
import useMint from '../../auth/mints';
import useMaxMushrooms from '../../auth/max-mushrooms';
import useTeraShards from '../../auth/tera-shards';
import { useRareCandy, useRareCandyMax } from '../../auth/candy';
import { type CaughtPokemon, getCaught } from '../../auth/caught';
import {
  getCatchName,
  getCatchSlots,
  getMovePoints,
  isShadow,
  isShiny,
} from '../../model/caught-record';
import { isEgg } from '../../model/egg';
import useHealingItem from '../../auth/healing';
import { healedByItem } from '../../model/health';
import usePurifyingGem from '../../auth/purify';
import { useAbilityCapsule } from '../../auth/ability-items';
import useSkillBook from '../../auth/skill-book';
import useUtilityBelt from '../../auth/utility-belt';
import { feedEffortBerry, useEffortItem } from '../../auth/training';
import { MAX_LEVEL } from '../../data/constants/levels';
import { MAX_EFFORT_PER_STAT, type Stats } from '../../data/constants/stats';
import { MAX_SLOTS, countAbilitySlots, mostSlots } from '../../data/constants/slots';
import { getAbilityData, getSpeciesSignature } from '../../data/abilities';
import { getAwakenableAbilities } from '../../data/overworld/npc';
import { Items, getBall, getMachineMove, isMachineItem } from '../../data/ids/items';
import { NATURE_NAMES } from '../../data/ids/text';
import { Genders, type Species } from '../../data/ids/species';
import { BERRY_EFFORT_DROPS } from '../../data/items/berries';
import {
  ABILITY_CAPSULE_SLOT,
  isAbilityCapsule,
  isAbilityPatch,
} from '../../data/items/ability-items';
import { capAsksForStat, isBottleCap, isPerfectIVs } from '../../data/items/bottle-caps';
import { getMintNature, isMint } from '../../data/items/mints';
import { isMaxMushrooms, takesGigantamaxFactor } from '../../data/items/max-mushrooms';
import { TERA_SHARD_COST, isTeraShard, takesTeraShard } from '../../data/items/tera-shards';
import { TYPE_NAMES } from '../../data/constants/types';
import { isHerbal } from '../../data/items/medicine';
import { isPurifyingGem } from '../../data/items/purifying-gem';
import { SKILL_BOOK_SLOT, isSkillBook } from '../../data/items/skill-book';
import { UTILITY_BELT_SLOT, isUtilityBelt } from '../../data/items/utility-belt';
import { MAX_VITAMIN_STATS, VITAMIN_STATS, isPPItem, isVitamin } from '../../data/items/vitamins';
import { MAX_WING_STATS, WING_STATS, isWing } from '../../data/items/wings';
import { PP_UP_LIMIT } from '../../data/moves';
import { getSpeciesData } from '../../data/species';
import { describeIVs, describeItem, withArticle } from '../details';
import { m } from '../../i18n/paraglide/messages.js';
import { joinSentences } from '../../i18n/format';
import { currentLocale } from '../../i18n/locale';

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
  // The universal candies: a level, or all of them, for anything that can still grow
  if (item === Items.RareCandy || item === Items.RareCandyMax) {
    return caught.level < MAX_LEVEL;
  }
  const filled = MAX_VITAMIN_STATS.get(item) ?? MAX_WING_STATS.get(item);

  if (filled != null) {
    return caught.effortValues[filled] < MAX_EFFORT_PER_STAT;
  }
  if (isBottleCap(item)) {
    return !isPerfectIVs(caught.ivs);
  }
  // A mint that would leave the nature where it is does nothing, so it
  // is not offered rather than being spent on nothing
  if (isMint(item)) {
    return getMintNature(item) !== caught.nature;
  }
  const ball = getBall(item);

  if (ball != null) {
    return ball !== caught.ball;
  }
  if (isPurifyingGem(item)) {
    return isShadow(caught);
  }
  // Only a species with a Gigantamax form, and only once
  if (isMaxMushrooms(item)) {
    return takesGigantamaxFactor(caught);
  }
  // Only a type it does not already have, and never Stellar
  if (isTeraShard(item)) {
    return takesTeraShard(caught, item);
  }
  // A belt is offered only where there is room to add: the record's
  // own count rather than the game's default, since a pokemon that has
  // worn one already has more
  if (isSkillBook(item)) {
    return getCatchSlots(caught, SKILL_BOOK_SLOT) < mostSlots(SKILL_BOOK_SLOT);
  }
  if (isUtilityBelt(item)) {
    return getCatchSlots(caught, UTILITY_BELT_SLOT) < MAX_SLOTS;
  }
  // A capsule asks what the Channeler asks, so it is offered where she
  // would take the pokemon: room to open, nothing standing empty, and
  // something in its line it does not already carry
  if (isAbilityCapsule(item)) {
    const room = getCatchSlots(caught, ABILITY_CAPSULE_SLOT);

    return (
      room < mostSlots(ABILITY_CAPSULE_SLOT) &&
      countAbilitySlots(caught.abilities) >= room &&
      getAwakenableAbilities(caught.species, caught.abilities).length > 0
    );
  }
  // A patch is offered where the family has a signature and this one
  // is not already keeping it
  if (isAbilityPatch(item)) {
    const signature = getSpeciesSignature(caught.species);

    return signature != null && !new Set(caught.abilities).has(signature);
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
    for (const move of caught.moves) {
      if (getMovePoints(caught, move) < PP_UP_LIMIT) {
        return true;
      }
    }
    return false;
  }
  // A berry, a potion, a cure, a revive: offered only where it would
  // change something, since using it would spend it
  return healedByItem(caught, item) != null || isEffortItem(item) || BERRY_EFFORT_DROPS.has(item);
}

/**
 * Whether the item asks a question back before it is spent. A machine
 * asks which move is given up for it, a bottle which move the points
 * land on, and a Bottle Cap which stat it polishes. None can be taken
 * back afterwards, so none leaves the bag until the question is answered
 */
export function asksAQuestion(item: Items): boolean {
  return isMachineItem(item) || isPPItem(item) || isAbilityPatch(item) || capAsksForStat(item);
}

/**
 * Which stat an item trains, for the two kinds that train one. Null
 * for everything else, which is most of the bag
 */
export function effortStatOf(item: Items): Stats | null {
  return (
    VITAMIN_STATS.get(item) ??
    WING_STATS.get(item) ??
    MAX_VITAMIN_STATS.get(item) ??
    MAX_WING_STATS.get(item) ??
    BERRY_EFFORT_DROPS.get(item) ??
    null
  );
}

/** How a report is coloured: as news, as a gain, or as a refusal */
export type SpentTone = 'neutral' | 'leaf' | 'ember';

/** The sound a spend is worth making, for the interface to play */
export type SpentCue = 'level-up' | 'purified' | 'item-slot' | 'ability-learned';

/** What spending it came to */
export interface Spent {
  said: string;
  tone: SpentTone;
  /** A sound the moment deserves, where it deserves one */
  cue?: SpentCue;
  /**
   * The level it grew to, for the candies that grow one. A level may
   * have a move waiting behind it: see `getLevelMoves`
   */
  level: number | null;
  /** The first level it grew into, where that was more than one level ago */
  from?: number;
  /**
   * Who it was spent on, so the report can show them rather than name
   * them. Left out where nothing about the pokemon is worth drawing
   */
  about?: { species: Species; shiny: boolean; female: boolean; name: string };
  /**
   * What one stat's effort was and what it is now, for an item that
   * moved one. It is the whole of what a vitamin does, and reporting
   * it as "points it did not have to earn" left the player to open the
   * stats pane to find out whether anything had happened
   */
  trained?: { stat: Stats; from: number; to: number };
}

/**
 * The two halves of a training report: who it happened to, and what
 * moved. Both are left out where the item trained nothing or the
 * record could not be read, so a caller can spread this in blind
 */
function trainedBy(
  stat: Stats | null,
  before: CaughtPokemon | null,
  after: { effortValues: Record<Stats, number> },
): Partial<Spent> {
  if (stat == null || before == null) {
    return {};
  }
  return {
    about: {
      species: before.species,
      shiny: isShiny(before),
      female: before.gender === Genders.Female,
      name: getCatchName(before),
    },
    trained: { stat, from: before.effortValues[stat], to: after.effortValues[stat] },
  };
}

/**
 * An item named inside a sentence. English puts an article before it;
 * the other languages name it bare
 */
function articled(name: string): string {
  return currentLocale() === 'en' ? withArticle(name) : name;
}

const refused = (item: Items): Spent => ({
  said: m.item_spent_refused({ item: describeItem(item) }),
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

    if (level == null) {
      return { said: m.catch_candy_failed(), tone: 'ember', level: null };
    }
    return { said: m.catch_candy_grew({ level }), tone: 'neutral', level, cue: 'level-up' };
  }

  if (item === Items.RareCandyMax) {
    const grown = await useRareCandyMax(catchId);

    if (grown == null) {
      return { said: m.catch_candy_failed(), tone: 'ember', level: null };
    }
    return {
      cue: 'level-up',
      said: m.catch_candy_grew({ level: grown.level }),
      tone: 'neutral',
      level: grown.level,
      from: grown.from,
    };
  }

  if (getBall(item) != null) {
    const ball = await useBall(catchId, item);

    return ball == null
      ? refused(item)
      : {
          said: m.item_spent_ball({ item: articled(describeItem(item)) }),
          tone: 'neutral',
          level: null,
        };
  }

  if (isBottleCap(item)) {
    const ivs = await useBottleCap(catchId, item);

    return ivs == null
      ? refused(item)
      : {
          said: m.item_spent_cap({ item: describeItem(item), ivs: describeIVs(ivs) }),
          tone: 'neutral',
          level: null,
        };
  }

  if (isMint(item)) {
    const nature = await useMint(catchId, item);

    return nature == null
      ? refused(item)
      : { said: m.item_spent_mint({ nature: NATURE_NAMES[nature] }), tone: 'neutral', level: null };
  }

  if (isPurifyingGem(item)) {
    const ivs = await usePurifyingGem(catchId, item);

    if (ivs == null) {
      return refused(item);
    }
    return {
      said: m.item_spent_purified({ ivs: describeIVs(ivs) }),
      tone: 'neutral',
      level: null,
      cue: 'purified',
    };
  }

  if (isMaxMushrooms(item)) {
    return (await useMaxMushrooms(catchId))
      ? { said: m.item_spent_gigantamax(), tone: 'neutral', level: null }
      : refused(item);
  }

  if (isTeraShard(item)) {
    const type = await useTeraShards(catchId, item);

    // The likeliest refusal is a bag short of the cost, so it is named
    return type == null
      ? {
          said: m.item_spent_tera_short({ count: TERA_SHARD_COST, item: describeItem(item) }),
          tone: 'ember',
          level: null,
        }
      : { said: m.item_spent_tera({ type: TYPE_NAMES[type] }), tone: 'neutral', level: null };
  }

  if (isUtilityBelt(item)) {
    const slots = await useUtilityBelt(catchId);

    if (slots == null) {
      return refused(item);
    }
    return {
      said: m.item_spent_belt({ count: slots }),
      tone: 'neutral',
      level: null,
      cue: 'item-slot',
    };
  }

  if (isSkillBook(item)) {
    const slots = await useSkillBook(catchId);

    if (slots == null) {
      return refused(item);
    }
    return {
      said: m.item_spent_book({ count: slots }),
      tone: 'neutral',
      level: null,
      cue: 'item-slot',
    };
  }

  if (isAbilityCapsule(item)) {
    const drawn = await useAbilityCapsule(catchId);

    if (drawn == null) {
      return refused(item);
    }
    return {
      cue: 'ability-learned',
      said: m.item_spent_capsule({
        ability: getAbilityData(drawn.ability).name,
        count: drawn.slots,
      }),
      tone: 'neutral',
      level: null,
    };
  }

  // Both of these move one stat's effort, and what the player wants to
  // know is which way and by how much. The record is read first so the
  // report can say where it started: the server hands back only where
  // it ended up
  const stat = effortStatOf(item);
  const training = stat == null ? null : await getCaught(catchId);

  if (isEffortItem(item)) {
    const result = await useEffortItem(catchId, item);

    return result == null
      ? refused(item)
      : {
          said: m.item_spent_effort({ item: describeItem(item) }),
          tone: 'neutral',
          level: null,
          ...trainedBy(stat, training, result),
        };
  }

  if (BERRY_EFFORT_DROPS.has(item)) {
    const result = await feedEffortBerry(catchId, item);

    return result == null
      ? {
          said: m.item_spent_berry_refused({ item: describeItem(item) }),
          tone: 'ember',
          level: null,
        }
      : {
          said: m.item_spent_berry({ count: result.unused }),
          tone: 'neutral',
          level: null,
          ...trainedBy(stat, training, result),
        };
  }

  const state = await useHealingItem(catchId, item);

  return state == null
    ? { said: m.item_spent_heal_refused({ item: describeItem(item) }), tone: 'ember', level: null }
    : {
        // Herbal medicine is swallowed, and the pokemon holds it
        // against whoever handed it over
        said: isHerbal(item)
          ? joinSentences([
              m.item_spent_healed({ item: describeItem(item), health: state.health }),
              m.item_spent_herbal(),
            ])
          : m.item_spent_healed({ item: describeItem(item), health: state.health }),
        tone: 'neutral',
        level: null,
      };
}
