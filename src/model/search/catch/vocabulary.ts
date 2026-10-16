import type { CaughtPokemon } from '../../caught-record';
import { ACQUISITION_NAMES, getCatchName } from '../../caught-record';
import { BALL_ITEMS } from '../../../data/ids/items';
import { BIOME_NAMES, TIME_OF_DAY_NAMES } from '../../../data/biome/names';
import { ENCOUNTER_TYPE_NAMES } from '../../../overworld/encounter';
import { GENDER_NAMES } from '../../../data/ids/species';
import { LAIR_NAMES } from '../../../data/overworld/lair';
import { getItemData } from '../../../data/items';
import { TYPE_NAMES } from '../../../data/constants/types';
import { EGG_GROUP_NAMES } from '../../../data/ids/egg-groups';
import { SPAWN_RARITY_NAMES } from '../../../data/biome';
import { NATURE_NAMES } from '../../../data/ids/natures';
import type { QueryVocabulary } from '../../../core/query';
import { parseControls } from '../../../core/query';
import { FIELDS } from './fields';
import { MARKS } from './marks';
import { IV_WORDS, STORED_STATUSES, stepsLeft, totalIVs } from './stats';

/**
 * What each `sort:` word reads off a pokemon. A string arranges by
 * name and a number by size, which is the difference between
 * `sort:name` and every other one of them
 */
const SORTS = new Map<string, (caught: CaughtPokemon) => number | string>(
  Object.entries<(caught: CaughtPokemon) => number | string>({
    level: (caught) => caught.level,
    friendship: (caught) => caught.friendship,
    walked: (caught) => caught.walked,
    steps: (caught) => caught.steps,
    hatch: stepsLeft,
    hp: (caught) => caught.health,
    iv: (caught) => totalIVs(caught.ivs),
    caught: (caught) => caught.caughtAt,
    species: (caught) => caught.species,
    name: (caught) => getCatchName(caught).toLowerCase(),
  }),
);

/**
 * One short line per field, for the guide and for the list the box
 * offers while somebody types. Which fields exist is not written here:
 * it is read off the table that answers them, so a field added there
 * turns up here on its own with a line waiting to be written for it
 */
const HINTS: Record<string, string> = {
  species: 'What it is',
  family: 'The line it belongs to',
  nickname: 'What its owner calls it',
  type: 'A type it is',
  nature: 'Its nature',
  gender: 'Its gender',
  is: 'A fact it has',
  not: 'A fact it lacks',
  move: 'A move it knows',
  learns: 'A move it could ever know',
  'move-type': 'A type it has a move of',
  ability: 'An ability it has',
  item: 'An item it holds',
  moves: 'How many moves it knows',
  pp: 'Points spent on any one move',
  weak: 'A type that hits it hard',
  resists: 'A type it shrugs off',
  immune: 'A type that cannot touch it',
  level: 'Its level',
  hp: 'Health left, as a number or a share',
  iv: 'Its values, one stat or all six',
  stat: 'One stat as it comes out',
  bonus: 'Effort spent on it',
  friendship: 'How much it likes its trainer',
  walked: 'Steps walked as the buddy',
  steps: 'Steps an egg has been carried',
  hatch: 'Steps an egg still needs',
  status: 'What it walked out of a fight with',
  weight: 'What this one weighs',
  height: 'How tall this one stands',
  ball: 'The ball it sits in',
  met: 'How it was met',
  biome: 'Where it was met',
  lair: 'The lair a prize was won in',
  place: 'What the place is called',
  locale: 'The region it was met in',
  caught: 'When it was caught: a year, a month, a day',
  dex: 'Its dex number',
  category: 'What the dex calls it',
  'egg-group': 'What it breeds with',
  'catch-rate': 'How hard the species is to catch',
  rarity: 'How often the species turns up',
  spawns: 'Where the species lives',
  active: 'When the species is about',
  from: 'A trainer whose hands it passed through',
  hands: 'How many owners it has had',
  paid: 'What somebody paid for it',
  got: 'How it changed hands',
  sort: 'Arrange by',
  order: 'Which way round',
};

/**
 * The values a field is known to take, where there is a closed list of
 * them. Off the same tables the fields are answered from, so a biome
 * or a mark added anywhere turns up here without being written twice.
 * A field with none is free text: a name, a place, a number
 */
const VALUES: Record<string, () => string[]> = {
  type: () => Object.values(TYPE_NAMES),
  'move-type': () => Object.values(TYPE_NAMES),
  weak: () => Object.values(TYPE_NAMES),
  resists: () => Object.values(TYPE_NAMES),
  immune: () => Object.values(TYPE_NAMES),
  nature: () => Object.values(NATURE_NAMES),
  gender: () => Object.values(GENDER_NAMES),
  is: () => [...MARKS.keys()],
  not: () => [...MARKS.keys()],
  status: () => [...STORED_STATUSES.keys()],
  ball: () => {
    const names: string[] = [];

    for (const ball of Object.values(BALL_ITEMS)) {
      names.push(getItemData(ball).name);
    }
    return names;
  },
  met: () => Object.values(ENCOUNTER_TYPE_NAMES),
  biome: () => Object.values(BIOME_NAMES),
  spawns: () => Object.values(BIOME_NAMES),
  lair: () => Object.values(LAIR_NAMES),
  'egg-group': () => Object.values(EGG_GROUP_NAMES),
  rarity: () => Object.values(SPAWN_RARITY_NAMES),
  active: () => Object.values(TIME_OF_DAY_NAMES),
  got: () => Object.values(ACQUISITION_NAMES),
  iv: () => IV_WORDS,
  stat: () => IV_WORDS,
  sort: () => [...SORTS.keys()],
  order: () => ['asc', 'desc'],
};

/**
 * What a box of pokemon can be asked. The two arranging terms are on
 * the end because they are asked for in the same box, though nothing
 * answers them
 */
export const CATCH_VOCABULARY: QueryVocabulary = { fields: [] };

for (const name of [...FIELDS.keys(), 'sort', 'order']) {
  CATCH_VOCABULARY.fields.push({ name, hint: HINTS[name] ?? '', values: VALUES[name] });
}

/**
 * The rows a search asked for, in the order it asked for them.
 *
 * The two arranging terms hide nothing, so this runs over what the
 * predicate already kept. A `sort:` nobody has a reading for leaves
 * the list in the order it arrived, which is the box's own.
 *
 * `fallback` is what to arrange by where the search names nothing: a
 * picker opened to form a team wants its strongest at the top without
 * the player having to ask for them
 */
export function orderCatches<T>(
  rows: T[],
  query: string,
  of: (row: T) => CaughtPokemon,
  fallback = '',
): T[] {
  // Highest first unless the search says otherwise: somebody who
  // sorts a box by level, by values or by friendship is looking for
  // the best of them, and having to add `order:desc` every time to
  // see it was the box asking the question backwards
  const controls = parseControls(query, true);
  // A box opened for a particular job arranges itself for that job
  // until the player says otherwise: a `sort:` typed into the search
  // is still the last word
  const read = SORTS.get(controls.sort === '' ? fallback : controls.sort);

  if (read == null) {
    return rows;
  }
  return [...rows].sort((left, right) => {
    const first = read(of(left));
    const second = read(of(right));
    const order =
      typeof first === 'string' && typeof second === 'string'
        ? first.localeCompare(second)
        : Number(first) - Number(second);

    return controls.descending ? -order : order;
  });
}
