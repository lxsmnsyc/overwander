import type { CaughtPokemon } from './caught';
import { getCatchName, isFavorite, isGuarded, isShiny } from './caught-record';
import { BALL_ITEMS } from '../data/ids/items';
import { ENCOUNTER_TYPE_NAMES } from '../overworld/encounter';
import { GENDER_NAMES } from '../data/ids/species';
import { ITEM_TYPE_ORDER, getItemData, listItemsByType } from '../data/items';
import { NATURE_NAMES } from '../data/ids/natures';
import { PERFECT_IVS } from '../data/constants/stats';
import { TYPE_NAMES } from '../data/constants/types';
import { getAbilityData, getRegisteredAbilities } from '../data/abilities';
import { getFamilyName, getRegisteredSpecies, getSpeciesData } from '../data/species';
import { getMoveData, getRegisteredMoves } from '../data/moves';
import type { Species } from '../data/ids/species';
import { isEgg } from './egg';
import { isFainted } from './health';
import BATTLE_TIMEOUT, { isLockLive } from './battle-lock';
import { serverNow } from './clock';
import parseQuery from '../core/query';

/**
 * What a search box over a box of pokemon can be asked.
 *
 * A plain word is matched against the name — the nickname if it has
 * one, the species otherwise — and everything else is a `field:value`
 * pair. Terms narrow: `type:fire is:shiny level:30-60` is all three at
 * once, and two of the same field are both, so `type:fire type:flying`
 * finds a Charizard rather than half the box.
 *
 * **An egg gives nothing away.** It answers to the word "egg" and to
 * the marks its owner put on it, and every question about what is
 * inside — species, family, type, moves, coat — is answered no. The
 * box already refuses to draw what is in one; a search that told you
 * would be the same leak by another door.
 */

/** Whether a name holds what was asked for, either way round on case */
function has(name: string, value: string): boolean {
  return name.toLowerCase().includes(value.trim().toLowerCase());
}

/** Whether any of a list of names holds it */
function any(names: string[], value: string): boolean {
  return names.some((name) => has(name, value));
}

/**
 * A number or a range of them: `level:30`, `level:30-60`. An open end
 * is allowed — `level:30-` is thirty and up — since half a range is
 * what somebody usually means
 */
function within(value: string, actual: number): boolean {
  const ends = value.split('-');

  if (ends.length < 2) {
    return Number(ends[0]) === actual;
  }

  // An empty end is the open one: `30-` is thirty and up, `-30` is
  // thirty and under. A number that will not parse leaves NaN, and
  // every comparison against NaN is false, which refuses the term
  const floor = ends[0].trim() === '' ? Number.NEGATIVE_INFINITY : Number(ends[0]);
  const ceiling = ends[1].trim() === '' ? Number.POSITIVE_INFINITY : Number(ends[1]);

  return actual >= floor && actual <= ceiling;
}

/** What one field asks of one pokemon */
type CatchField = (caught: CaughtPokemon, value: string) => boolean;

/**
 * Everything about a pokemon that an egg keeps to itself. The wrapper
 * is what makes that a rule rather than something each field has to
 * remember
 */
function hidden(field: CatchField): CatchField {
  return (caught, value) => !isEgg(caught) && field(caught, value);
}

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
  of: (caught: CaughtPokemon) => boolean;
  /**
   * Whether it is something an egg is keeping to itself. A secret mark
   * answers **no** either way round: the answer "not shiny" narrows a
   * box of eggs down to the ones that are, which is the same leak
   */
  secret?: boolean;
  /**
   * The same question, as the store would be asked it, or null where
   * only the runtime can answer it that way round
   */
  constrain: (wanted: boolean) => CatchConstraint | null;
}

const MARKS = new Map<string, Mark>(
  Object.entries<Mark>({
    shiny: {
      of: isShiny,
      secret: true,
      constrain: (wanted) => ({ field: 'shiny', is: wanted }),
    },
    shadow: {
      of: (caught) => caught.shadow,
      secret: true,
      constrain: (wanted) => ({ field: 'shadow', is: wanted }),
    },
    // Whether anybody would pay for it, which is read off three facts
    // an egg is keeping to itself
    auctionable: {
      of: (caught) => caught.auctionable,
      secret: true,
      constrain: (wanted) => ({ field: 'auctionable', is: wanted }),
    },
    // Every value at its ceiling is one stored number, so "perfect" is
    // an exact question rather than an arithmetic one
    perfect: {
      of: (caught) => caught.ivs === PERFECT_IVS,
      secret: true,
      // Only the yes narrows: "anything but perfect" is nearly the
      // whole box, and an inequality is the one filter Firestore
      // indexes badly
      constrain: (wanted) => (wanted ? { field: 'ivs', equals: PERFECT_IVS } : null),
    },

    // What is true of the record rather than of the pokemon inside it,
    // which an egg answers as openly as anything else does
    favorite: { of: isFavorite, constrain: (wanted) => ({ field: 'favorite', is: wanted }) },
    locked: { of: isGuarded, constrain: (wanted) => ({ field: 'guarded', is: wanted }) },
    traded: {
      of: (caught) => caught.traded,
      constrain: (wanted) => ({ field: 'traded', is: wanted }),
    },
    egg: { of: isEgg, constrain: (wanted) => ({ field: 'egg', is: wanted }) },
    fainted: {
      of: isFainted,
      constrain: (wanted) =>
        wanted
          ? { field: 'health', low: 0, high: 0 }
          : { field: 'health', low: 1, high: Number.POSITIVE_INFINITY },
    },
    // The lock is a stamp rather than a flag, so this is the clock's
    // answer — the server's, since a device running fast would report
    // a pokemon free that nothing had released
    fighting: {
      of: (caught) => isLockLive(caught, serverNow()),
      constrain: (wanted) => {
        // The same line `isLockLive` draws, as a range over the stamp
        const cutoff = serverNow() - BATTLE_TIMEOUT;

        return wanted
          ? { field: 'lockedAt', low: cutoff + 1, high: Number.POSITIVE_INFINITY }
          : { field: 'lockedAt', low: Number.NEGATIVE_INFINITY, high: cutoff };
      },
    },
  }),
);

/**
 * Whether a pokemon answers a mark the way the search asked. A word
 * nobody has heard of is answered no, the same as any other term this
 * cannot make sense of
 */
function marked(caught: CaughtPokemon, word: string, wanted: boolean): boolean {
  const mark = MARKS.get(word.trim().toLowerCase());

  if (mark == null || (mark.secret === true && isEgg(caught))) {
    return false;
  }
  return mark.of(caught) === wanted;
}

const FIELDS = new Map<string, CatchField>(
  Object.entries({
    family: hidden((caught, value) =>
      has(getFamilyName(getSpeciesData(caught.species).family), value),
    ),
    type: hidden((caught, value) =>
      any(
        getSpeciesData(caught.species).types.map((kind) => TYPE_NAMES[kind]),
        value,
      ),
    ),
    move: hidden((caught, value) =>
      any(
        caught.moves.map((move) => getMoveData(move).name),
        value,
      ),
    ),
    ability: hidden((caught, value) =>
      any(
        caught.abilities.map((ability) => getAbilityData(ability).name),
        value,
      ),
    ),
    item: hidden((caught, value) =>
      any(
        caught.items.map((item) => getItemData(item).name),
        value,
      ),
    ),
    nature: hidden((caught, value) => has(NATURE_NAMES[caught.nature], value)),
    gender: hidden((caught, value) => has(GENDER_NAMES[caught.gender], value)),
    ball: (caught, value) => has(getItemData(BALL_ITEMS[caught.ball]).name, value),
    met: (caught, value) => has(ENCOUNTER_TYPE_NAMES[caught.type], value),
    // Every yes-or-no fact, asked by name: `is:shiny`, `not:fainted`
    is: (caught, value) => marked(caught, value, true),
    not: (caught, value) => marked(caught, value, false),
    level: (caught, value) => within(value, caught.level),
    friendship: (caught, value) => within(value, caught.friendship),
    walked: (caught, value) => within(value, caught.walked),
    steps: (caught, value) => within(value, caught.steps),
    // When it was caught, by the front of the stamp: `caught:2026-08`
    // is that month. A prefix rather than a range, since the stamp is
    // written with dashes in it and `2026-01-2026-06` reads as nothing
    caught: (caught, value) => caught.caughtAt.toLowerCase().startsWith(value.trim().toLowerCase()),
  }),
);

/**
 * The half of a search the store can answer.
 *
 * A search runs in two passes: whatever narrows into a query is asked
 * of Firestore, and everything else is answered here over what came
 * back. The rule the planner keeps is that a constraint may only be
 * pushed when it is **implied** by the predicate — a narrowing that
 * drops a record the runtime would have kept is a wrong answer, not a
 * faster one, so anything ambiguous is left to the second pass.
 */
export type CatchConstraint =
  | {
      field: 'shiny' | 'shadow' | 'egg' | 'favorite' | 'guarded' | 'traded' | 'auctionable';
      is: boolean;
    }
  | { field: 'nature' | 'gender' | 'ball' | 'type' | 'ivs'; equals: number }
  | { field: 'species'; oneOf: Species[] }
  | { field: 'abilities' | 'moves' | 'items'; has: number }
  | {
      field: 'level' | 'health' | 'friendship' | 'walked' | 'steps' | 'lockedAt';
      low: number;
      high: number;
    }
  /** The front of the stamp: everything caught in a month, or a day */
  | { field: 'caughtAt'; prefix: string };

/**
 * The most values an `in` filter takes. A family fits easily; a type
 * does not — Water is a third of the species registered today — and
 * one over the cap is left to the runtime rather than split into
 * several queries
 */
const IN_LIMIT = 30;

/**
 * Which registered thing a name means, when it means exactly one.
 *
 * The runtime matches on part of a name, so "emb" is Ember today and
 * two moves the day a second one is registered. A query has to name
 * an id, so an ambiguous word pushes nothing
 */
function only<T>(found: T[]): T | null {
  return found.length === 1 ? found[0] : null;
}

/**
 * The one id in a table of names whose name holds the word, or null
 * where the word names none of them or several. A const enum cannot
 * be listed, so the name table it is written beside stands in for one
 */
function named(table: Record<number, string>, wanted: string): number | null {
  return only(
    Object.entries(table)
      .filter(([, name]) => has(name, wanted))
      .map(([id]) => Number(id)),
  );
}

/** What each ball is called, which is what its item is called */
function ballNames(): Record<number, string> {
  const names: Record<number, string> = {};

  for (const [ball, item] of Object.entries(BALL_ITEMS)) {
    names[Number(ball)] = getItemData(item).name;
  }
  return names;
}

function speciesWhere(holds: (species: Species) => boolean): Species[] {
  return getRegisteredSpecies().filter(holds);
}

/** Every registered item, which the registry keeps by type */
function everyItem(): number[] {
  return ITEM_TYPE_ORDER.flatMap((type) => listItemsByType(type));
}

/**
 * What one term could be asked of the store, or null where it can
 * only be answered by reading the record
 */
function constrain(field: string, value: string): CatchConstraint | null {
  const wanted = value.trim().toLowerCase();

  switch (field) {
    // Every yes-or-no fact, asked by name. The mark itself says how
    // the store would be asked, since some of them are a range over a
    // stamp rather than a flag
    case 'is':
    case 'not':
      return MARKS.get(wanted)?.constrain(field === 'is') ?? null;
    case 'nature': {
      const nature = named(NATURE_NAMES, wanted);

      return nature == null ? null : { field: 'nature', equals: nature };
    }
    case 'gender': {
      const gender = named(GENDER_NAMES, wanted);

      return gender == null ? null : { field: 'gender', equals: gender };
    }
    case 'ball': {
      const ball = named(ballNames(), wanted);

      return ball == null ? null : { field: 'ball', equals: ball };
    }
    case 'met': {
      // The record calls it `type`, which the search cannot: that word
      // is already the elemental one
      const met = named(ENCOUNTER_TYPE_NAMES, wanted);

      return met == null ? null : { field: 'type', equals: met };
    }
    case 'caught':
      return wanted === '' ? null : { field: 'caughtAt', prefix: wanted };
    case 'friendship':
    case 'walked':
    case 'steps':
    case 'level': {
      const stored = field;
      const ends = value.split('-');

      if (ends.length < 2) {
        const exact = Number(ends[0]);

        return Number.isFinite(exact) ? { field: stored, low: exact, high: exact } : null;
      }

      const low = ends[0].trim() === '' ? Number.NEGATIVE_INFINITY : Number(ends[0]);
      const high = ends[1].trim() === '' ? Number.POSITIVE_INFINITY : Number(ends[1]);

      return Number.isNaN(low) || Number.isNaN(high) ? null : { field: stored, low, high };
    }
    case 'family': {
      const oneOf = speciesWhere((species) =>
        has(getFamilyName(getSpeciesData(species).family), wanted),
      );

      return oneOf.length > 0 && oneOf.length <= IN_LIMIT ? { field: 'species', oneOf } : null;
    }
    case 'move': {
      const move = only(
        getRegisteredMoves().filter((entry) => has(getMoveData(entry).name, wanted)),
      );

      return move == null ? null : { field: 'moves', has: move };
    }
    case 'ability': {
      const ability = only(
        getRegisteredAbilities().filter((entry) => has(getAbilityData(entry).name, wanted)),
      );

      return ability == null ? null : { field: 'abilities', has: ability };
    }
    case 'item': {
      const item = only(everyItem().filter((entry) => has(getItemData(entry).name, wanted)));

      return item == null ? null : { field: 'items', has: item };
    }
    default:
      // A plain word is a substring of a name, which no document
      // store answers
      return null;
  }
}

/**
 * How much a constraint is worth pushing. One is pushed and no more:
 * every field asked beside `owner` needs its own composite index, and
 * a single extra keeps that list one entry per field rather than one
 * per combination anybody types
 */
function worth(constraint: CatchConstraint): number {
  if ('oneOf' in constraint) {
    return 0;
  }
  if ('has' in constraint) {
    return 1;
  }
  // One nature out of twenty-five, one ball, one way of being met
  if ('equals' in constraint) {
    return 2;
  }
  if ('prefix' in constraint) {
    return 3;
  }
  if ('is' in constraint) {
    // A yes is a handful of records; a no is nearly the whole box, so
    // it is worth less than a range
    return constraint.is ? 4 : 6;
  }
  return 5;
}

/**
 * The store's half of a search: the one term worth asking Firestore,
 * or nothing where the whole search has to be read and filtered.
 *
 * Everything it returns is also still checked by `matchesCatch`, so a
 * planner that pushes too little is slow and a planner that pushes the
 * wrong thing is the only way to be wrong
 */
export function planCatchSearch(query: string): CatchConstraint[] {
  const candidates = parseQuery(query)
    .filter((term) => term.field !== '')
    .map((term) => constrain(term.field, term.value))
    .filter((constraint): constraint is CatchConstraint => constraint != null)
    .sort((one, other) => worth(one) - worth(other));

  return candidates.length === 0 ? [] : [candidates[0]];
}

/**
 * The plain half of a search: a word with no field in front of it.
 * The nickname and the species are both tried, so a Charmander called
 * Sparky is found by either
 */
function byName(caught: CaughtPokemon, value: string): boolean {
  const wanted = value.trim().toLowerCase();

  if (wanted === '') {
    return true;
  }
  if (isEgg(caught)) {
    return 'egg'.includes(wanted);
  }
  return has(getCatchName(caught), wanted) || has(getSpeciesData(caught.species).name, wanted);
}

/**
 * Whether one pokemon answers the whole search. A field nobody has
 * heard of matches nothing: `colour:red` should come back empty
 * rather than quietly ignoring the half of the search that was typed
 * most carefully
 */
export default function matchesCatch(caught: CaughtPokemon, query: string): boolean {
  return parseQuery(query).every((term) => {
    if (term.field === '') {
      return byName(caught, term.value);
    }

    const field = FIELDS.get(term.field);

    return field?.(caught, term.value) === true;
  });
}
