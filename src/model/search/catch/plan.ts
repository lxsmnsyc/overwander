import { ACQUISITION_NAMES } from '../../caught-record';
import { BALL_ITEMS } from '../../../data/ids/items';
import { BIOME_NAMES } from '../../../data/biome/names';
import { ENCOUNTER_TYPE_NAMES } from '../../../overworld/encounter';
import { GENDER_NAMES } from '../../../data/ids/species';
import { LAIR_NAMES } from '../../../data/overworld/lair';
import { getItemData } from '../../../data/items';
import { NATURE_NAMES } from '../../../data/ids/natures';
import { getAbilityData, getRegisteredAbilities } from '../../../data/abilities';
import { getFamilyName, getRegisteredSpecies, getSpeciesData } from '../../../data/species';
import { getMoveData, getRegisteredMoves } from '../../../data/moves';
import type { Species } from '../../../data/ids/species';
import type { QueryTerm } from '../../../core/query';
import { alternatives, askedTerms, holds } from '../../../core/query';
import {
  type CatchConstraint,
  childIn,
  likeChild,
  likeRow,
  oneOf,
  pushChildRange,
  pushRange,
  pushSpan,
} from './constraints';
import { MARKS } from './marks';
import { everyItem, idsFor, numeric } from './shared';
import { IV_COLUMNS, STORED_STATUSES, readIV } from './stats';

function ballNames(): Record<number, string> {
  const names: Record<number, string> = {};

  for (const [ball, item] of Object.entries(BALL_ITEMS)) {
    names[Number(ball)] = getItemData(item).name;
  }
  return names;
}

/** Every registered thing of a kind whose name holds the word */
function idsNamed<T extends number>(every: T[], name: (entry: T) => string, value: string): T[] {
  const named: T[] = [];

  for (const entry of every) {
    if (holds(name(entry), value)) {
      named.push(entry);
    }
  }
  return named;
}

/**
 * What one term could be asked of the store, or nothing where it can
 * only be answered by reading the record.
 *
 * `alias` is this term's own name for anything it has to join, so two
 * terms over the same child table ask for two different rows: a
 * pokemon that knows Ember **and** Tackle is one join each, where a
 * shared one would be asking for a single move that is both
 */
function constrain(term: QueryTerm, alias: string): CatchConstraint[] {
  const value = term.value;
  const wanted = value.trim().toLowerCase();

  switch (term.field) {
    // Every yes-or-no fact, asked by name. The mark itself says how
    // the store would be asked, since some of them are a bound on a
    // stamp rather than a flag
    case 'is':
    case 'not': {
      const words = alternatives(wanted);
      // One at a time only: "either shiny or shadow" is a disjunction
      // over two columns, which is not a query anybody can write
      const mark = words.length === 1 ? MARKS.get(words[0]) : undefined;

      return mark == null ? [] : mark.constrain(term.field === 'is', alias);
    }
    case 'nature':
      return oneOf('nature', idsFor(NATURE_NAMES, wanted));
    case 'gender':
      return oneOf('gender', idsFor(GENDER_NAMES, wanted));
    case 'ball':
      return oneOf('ball', idsFor(ballNames(), wanted));
    case 'lair':
      return oneOf('lair', idsFor(LAIR_NAMES, wanted));
    case 'biome':
      return oneOf('origin_biome', idsFor(BIOME_NAMES, wanted));
    case 'met':
      // The record calls it `type`, which the search cannot: that word
      // is already the elemental one
      return oneOf('type', idsFor(ENCOUNTER_TYPE_NAMES, wanted));
    case 'status': {
      const words = alternatives(wanted);
      const stored = words.length === 1 ? STORED_STATUSES.get(words[0]) : undefined;

      return stored == null ? [] : [{ on: 'row', column: stored.column, op: 'eq', value: true }];
    }
    case 'species':
      return oneOf(
        'species',
        idsNamed(getRegisteredSpecies(), (species) => getSpeciesData(species).name, wanted),
      );
    case 'family':
      return oneOf(
        'species',
        idsNamed(
          getRegisteredSpecies(),
          (species) => getFamilyName(getSpeciesData(species).family),
          wanted,
        ),
      );
    case 'move':
      return childIn(
        alias,
        'caught_moves',
        'move',
        idsNamed(getRegisteredMoves(), (move) => getMoveData(move).name, wanted),
      );
    case 'ability':
      return childIn(
        alias,
        'caught_abilities',
        'ability',
        idsNamed(getRegisteredAbilities(), (ability) => getAbilityData(ability).name, wanted),
      );
    case 'item':
      return childIn(
        alias,
        'caught_items',
        'item',
        idsNamed(everyItem(), (item) => getItemData(item).name, wanted),
      );
    case 'got':
      return childIn(alias, 'caught_history', 'kind', idsFor(ACQUISITION_NAMES, wanted));
    case 'from':
      return likeChild(alias, 'caught_history', 'owner_name', wanted);
    case 'paid':
      return pushChildRange(alias, 'caught_history', 'paid', value);
    case 'pp':
      return pushChildRange(alias, 'caught_moves', 'points', value);
    case 'nickname':
      return likeRow('nickname', wanted);
    case 'place':
      return likeRow('origin_place', wanted);
    case 'locale':
      return likeRow('locale', wanted);
    case 'level':
      return pushRange('level', value);
    case 'friendship':
      return pushRange('friendship', value);
    case 'walked':
      return pushRange('walked', value);
    case 'steps':
      return pushRange('steps', value);
    case 'hatch':
      return pushRange('hatch_left', value);
    case 'hp':
      return pushRange('health', value);
    case 'bonus':
      return pushRange('effort_bonus', value);
    case 'iv': {
      const { stat, wanted: number } = readIV(value);

      return pushRange(stat == null ? 'iv_total' : IV_COLUMNS[stat], number);
    }
    case 'dex': {
      const numbered: Species[] = [];

      for (const species of getRegisteredSpecies()) {
        if (numeric(value, getSpeciesData(species).dexNumber)) {
          numbered.push(species);
        }
      }
      return oneOf('species', numbered);
    }
    case 'caught':
      return pushSpan('caught_at_local', value);
    default:
      // A plain word is a substring of either of two names; `type:` is
      // a fact about the species and no column holds it; `hands` and
      // `moves` are counts nothing stores
      return [];
  }
}

/**
 * A refused term as the store would be asked it.
 *
 * Only a plain equality inverts cleanly. The opposite of a range is a
 * pair of them either side, which is two queries; the opposite of a
 * join is a row that must **not** exist, which an inner join cannot
 * say. Both are left to the second pass, which is always allowed
 */
function refuse(term: QueryTerm, alias: string): CatchConstraint[] {
  const asked = constrain(term, alias);

  if (asked.length !== 1 || asked[0].on !== 'row') {
    return [];
  }
  const [only] = asked;

  if (only.op === 'eq') {
    return [{ ...only, op: 'neq' }];
  }
  return only.op === 'in' ? [{ ...only, op: 'nin' }] : [];
}

/**
 * The half of a search the store answers, term by term.
 *
 * Everything it returns is also still checked by `matchesCatch`, so a
 * planner that pushes too little is slow and a planner that pushes the
 * wrong thing is the only way to be wrong
 */
export default function planCatchSearch(query: string): CatchConstraint[] {
  const pushed: CatchConstraint[] = [];

  for (const [at, term] of askedTerms(query).entries()) {
    if (term.field === '') {
      continue;
    }
    // The term's position is its alias, so a second `move:` joins a
    // second row rather than asking one row to be two moves at once
    pushed.push(...(term.negated ? refuse(term, `q${at}`) : constrain(term, `q${at}`)));
  }
  return pushed;
}
