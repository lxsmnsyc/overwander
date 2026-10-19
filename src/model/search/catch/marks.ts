import type { CaughtPokemon } from '../../caught-record';
import { isFavorite, isGuarded, isShiny } from '../../caught-record';
import { EncounterType } from '../../../overworld/encounter';
import { PERFECT_IVS } from '../../../data/constants/stats';
import { unusedEffort } from '../../effort';
import { getSpeciesData } from '../../../data/species';
import { getMoveData } from '../../../data/moves';
import { isEgg } from '../../egg';
import { getMaxHealth, isFainted } from '../../health';
import BATTLE_TIMEOUT, { isLockLive } from '../../battle-lock';
import { serverNow } from '../../../auth/clock';
import { alternatives } from '../../../core/query';
import { type CatchConstraint, flag, joined } from './constraints';
import { type CatchContext, MAX_LEVEL } from './shared';

/**
 * One yes-or-no fact about a pokemon, by the word a search calls it.
 *
 * They are one field rather than ten because that is how they read:
 * `is:shiny is:favorite` says what a row is, where a field each with a
 * 1 after it said the same thing in the shape of a form. `not:` reads
 * the same table the other way round
 */
interface Mark {
  /** Whether this pokemon is one */
  of: (caught: CaughtPokemon, context: CatchContext) => boolean;
  /**
   * Whether it is something an egg is keeping to itself. A secret mark
   * answers **no** either way round: the answer "not shiny" narrows a
   * box of eggs down to the ones that are, which is the same leak
   */
  secret?: boolean;
  /**
   * The same question, as the store would be asked it, or nothing
   * where only the runtime can answer it that way round
   */
  constrain: (wanted: boolean, alias: string) => CatchConstraint[];
}

export const MARKS = new Map<string, Mark>(
  Object.entries<Mark>({
    shiny: { of: isShiny, secret: true, constrain: (wanted) => flag('shiny', wanted) },
    shadow: {
      of: (caught) => caught.shadow,
      secret: true,
      constrain: (wanted) => flag('shadow', wanted),
    },
    // Whether anybody would pay for it, which is read off three facts
    // an egg is keeping to itself
    auctionable: {
      of: (caught) => caught.auctionable,
      secret: true,
      constrain: (wanted) => flag('auctionable', wanted),
    },
    // Every value at its ceiling is one stored number, so "perfect" is
    // an exact question rather than an arithmetic one
    perfect: {
      of: (caught) => caught.ivs === PERFECT_IVS,
      secret: true,
      constrain: (wanted) => [
        { on: 'row', column: 'ivs', op: wanted ? 'eq' : 'neq', value: PERFECT_IVS },
      ],
    },
    // Whether the line goes anywhere from here, which the species
    // knows and no column does
    evolvable: {
      of: (caught) => (getSpeciesData(caught.species).evolvesInto ?? []).length > 0,
      secret: true,
      constrain: () => [],
    },
    // One of several the owner has of that species. Only a whole box
    // can answer it, so it is the caller's count or nothing
    duplicate: {
      of: (caught, context) => context.duplicates?.has(caught.species) === true,
      secret: true,
      constrain: () => [],
    },

    // What is true of the record rather than of the pokemon inside it,
    // which an egg answers as openly as anything else does
    favorite: { of: isFavorite, constrain: (wanted) => flag('favorite', wanted) },
    locked: { of: isGuarded, constrain: (wanted) => flag('guarded', wanted) },
    traded: { of: (caught) => caught.traded, constrain: (wanted) => flag('traded', wanted) },
    egg: { of: isEgg, constrain: (wanted) => flag('egg', wanted) },
    named: {
      of: (caught) => caught.nickname !== '',
      constrain: (wanted) => [
        { on: 'row', column: 'nickname', op: wanted ? 'neq' : 'eq', value: '' },
      ],
    },
    hatched: {
      of: (caught) => caught.type === EncounterType.Hatched,
      constrain: (wanted) => [
        { on: 'row', column: 'type', op: wanted ? 'eq' : 'neq', value: EncounterType.Hatched },
      ],
    },
    maxed: {
      of: (caught) => caught.level >= MAX_LEVEL,
      constrain: (wanted) => [
        { on: 'row', column: 'level', op: wanted ? 'gte' : 'lt', value: MAX_LEVEL },
      ],
    },
    // What a fight left it as, beside being down: `is:hurt` is missing
    // health and `is:sick` is carrying something. Both are columns,
    // the first because the maximum is stored beside the health for
    // exactly this
    hurt: {
      of: (caught) => caught.health < getMaxHealth(caught),
      constrain: (wanted) => flag('hurt', wanted),
    },
    sick: {
      of: (caught) => caught.statuses !== 0,
      constrain: (wanted) => [
        { on: 'row', column: 'statuses', op: wanted ? 'neq' : 'eq', value: 0 },
      ],
    },
    // Whether a wing is worth spending on it, which is the level's
    // allowance against what has already gone in
    trainable: {
      of: (caught) => unusedEffort(caught) > 0,
      constrain: () => [],
    },
    // Whether it knows a move of its own type, which is what makes a
    // move hit harder
    stab: {
      of: (caught) => {
        const { types } = getSpeciesData(caught.species);

        for (const move of caught.moves) {
          if (types.includes(getMoveData(move).type)) {
            return true;
          }
        }
        return false;
      },
      secret: true,
      constrain: () => [],
    },
    // Whether it rolled the rarer ability its species keeps back
    hidden: {
      of: (caught) => {
        const rare = new Set(getSpeciesData(caught.species).hiddenAbilities);

        for (const ability of caught.abilities) {
          if (rare.has(ability)) {
            return true;
          }
        }
        return false;
      },
      secret: true,
      constrain: () => [],
    },
    fainted: {
      of: isFainted,
      constrain: (wanted) => [{ on: 'row', column: 'health', op: wanted ? 'eq' : 'gt', value: 0 }],
    },
    // The lock is a stamp rather than a flag, so this is the clock's
    // answer — the server's, since a device running fast would report
    // a pokemon free that nothing had released
    fighting: {
      of: (caught) => isLockLive(caught, serverNow()),
      constrain: (wanted) => {
        // The same line `isLockLive` draws, as a bound on the stamp
        const cutoff = serverNow() - BATTLE_TIMEOUT;

        return [{ on: 'row', column: 'locked_at', op: wanted ? 'gt' : 'lte', value: cutoff }];
      },
    },

    // The three that live in another table. Each is a row that has to
    // exist, and the runtime half is answered out of whatever the
    // caller read for itself
    buddy: {
      of: (_caught, context) => context.id != null && context.id === context.buddy,
      constrain: (wanted, alias) => (wanted ? joined(alias, 'profiles') : []),
    },
    listed: {
      of: (_caught, context) => context.id != null && context.listed?.has(context.id) === true,
      constrain: (wanted, alias) => (wanted ? joined(alias, 'auctions', { settled: false }) : []),
    },
    raiding: {
      of: (_caught, context) => context.id != null && context.raiding?.has(context.id) === true,
      constrain: (wanted, alias) => (wanted ? joined(alias, 'team_catches') : []),
    },
  }),
);

/**
 * Whether a pokemon answers a mark the way the search asked. A word
 * nobody has heard of is answered no, the same as any other term this
 * cannot make sense of
 */
function marked(
  caught: CaughtPokemon,
  word: string,
  wanted: boolean,
  context: CatchContext,
): boolean {
  const mark = MARKS.get(word.trim().toLowerCase());

  if (mark == null || (mark.secret === true && isEgg(caught))) {
    return false;
  }
  return mark.of(caught, context) === wanted;
}

/** Any of the marks a value names, the way the search asked for them */
export function markedAny(
  caught: CaughtPokemon,
  value: string,
  wanted: boolean,
  context: CatchContext,
): boolean {
  for (const word of alternatives(value)) {
    if (marked(caught, word, wanted, context)) {
      return true;
    }
  }
  return false;
}
