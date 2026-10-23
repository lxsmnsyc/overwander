import type { CaughtPokemon } from '../../caught-record';
import { ACQUISITION_NAMES, getCatchName } from '../../caught-record';
import { BALL_ITEMS } from '../../../data/ids/items';
import { BIOME_NAMES, TIME_OF_DAY_NAMES } from '../../../data/biome/names';
import { ENCOUNTER_TYPE_NAMES, deriveCatchSize } from '../../../overworld/encounter';
import { GENDER_NAMES } from '../../../data/ids/species';
import { LAIR_NAMES } from '../../../data/overworld/lair';
import { getItemData } from '../../../data/items';
import { getIV } from '../../../data/constants/stats';
import { TYPE_NAMES } from '../../../data/constants/types';
import { EGG_GROUP_NAMES, NATURE_NAMES } from '../../../data/ids/text';
import { SPAWN_RARITY_NAMES, getSpawnRarity } from '../../../data/biome';
import { getAbilityData } from '../../../data/abilities';
import { getFamilyName, getLearnableMoves, getSpeciesData } from '../../../data/species';
import { getMoveData } from '../../../data/moves';
import { isEgg } from '../../egg';
import { getMaxHealth } from '../../health';
import { alternatives, askedTerms, holds, holdsAny } from '../../../core/query';
import { LOCAL_STAMP, insideSpan, stamps } from './dates';
import { markedAny } from './marks';
import { type CatchContext, type CatchField, hidden, idsFor, numeric } from './shared';
import {
  STORED_STATUSES,
  readIV,
  readStat,
  statValue,
  stepsLeft,
  struckBy,
  totalIVs,
} from './stats';

/** What each `field:` word asks of one pokemon, answered over what the store sent back */
export const FIELDS = new Map<string, CatchField>(
  Object.entries<CatchField>({
    family: hidden((caught, value) =>
      holds(getFamilyName(getSpeciesData(caught.species).family), value),
    ),
    species: hidden((caught, value) => holds(getSpeciesData(caught.species).name, value)),
    type: hidden((caught, value) => {
      const names: string[] = [];

      for (const kind of getSpeciesData(caught.species).types) {
        names.push(TYPE_NAMES[kind]);
      }
      return holdsAny(names, value);
    }),
    move: hidden((caught, value) => {
      const names: string[] = [];

      for (const move of caught.moves) {
        names.push(getMoveData(move).name);
      }
      return holdsAny(names, value);
    }),
    ability: hidden((caught, value) => {
      const names: string[] = [];

      for (const ability of caught.abilities) {
        names.push(getAbilityData(ability).name);
      }
      return holdsAny(names, value);
    }),
    item: hidden((caught, value) => {
      const names: string[] = [];

      for (const item of caught.items) {
        names.push(getItemData(item).name);
      }
      return holdsAny(names, value);
    }),
    nature: hidden((caught, value) => holds(NATURE_NAMES[caught.nature], value)),
    gender: hidden((caught, value) => holds(GENDER_NAMES[caught.gender], value)),
    ball: (caught, value) => holds(getItemData(BALL_ITEMS[caught.ball]).name, value),
    met: (caught, value) => holds(ENCOUNTER_TYPE_NAMES[caught.type], value),
    // Where it came from: the chunk's biome, the lair a raid prize was
    // fought in, and the name of the place somebody wrote one at
    biome: (caught, value) => holds(BIOME_NAMES[caught.origin.biome], value),
    lair: (caught, value) => caught.lair != null && holds(LAIR_NAMES[caught.lair], value),
    place: (caught, value) => caught.origin.place != null && holds(caught.origin.place, value),
    locale: (caught, value) => caught.locale !== '' && holds(caught.locale, value),
    // What its owner calls it, which is not the species name it also
    // answers to as a plain word
    nickname: (caught, value) => caught.nickname !== '' && holds(caught.nickname, value),
    // Every yes-or-no fact, asked by name: `is:shiny`, `not:fainted`
    is: (caught, value, context) => markedAny(caught, value, true, context),
    not: (caught, value, context) => markedAny(caught, value, false, context),
    // What it walked out of its last fight carrying, by the word for
    // the status rather than the mask it is stored in
    status: (caught, value) => {
      for (const word of alternatives(value)) {
        const stored = STORED_STATUSES.get(word.toLowerCase());

        if (stored != null && (caught.statuses & stored.bit) !== 0) {
          return true;
        }
      }
      return false;
    },

    // What the species is, as the dex says it: the number, the line
    // under the name, the company it breeds with and how hard it was
    // to catch
    dex: hidden((caught, value) => numeric(value, getSpeciesData(caught.species).dexNumber)),
    category: hidden((caught, value) => holds(getSpeciesData(caught.species).category, value)),
    'egg-group': hidden((caught, value) => {
      const names: string[] = [];

      for (const group of getSpeciesData(caught.species).eggGroups) {
        names.push(EGG_GROUP_NAMES[group]);
      }
      return holdsAny(names, value);
    }),
    'catch-rate': hidden((caught, value) =>
      numeric(value, getSpeciesData(caught.species).catchRate),
    ),
    rarity: hidden((caught, value) =>
      holds(SPAWN_RARITY_NAMES[getSpawnRarity(caught.species)], value),
    ),
    // Where and when the **species** lives, which is not where this one
    // was met: `spawns:cave` is a fact about Zubat, `biome:cave` is a
    // fact about this Zubat
    spawns: hidden((caught, value) => {
      const names: string[] = [];

      for (const biome of getSpeciesData(caught.species).biomes) {
        names.push(BIOME_NAMES[biome]);
      }
      return holdsAny(names, value);
    }),
    active: hidden((caught, value) => {
      const { activeTimes } = getSpeciesData(caught.species);

      for (const word of alternatives(value)) {
        for (const time of idsFor(TIME_OF_DAY_NAMES, word)) {
          if ((activeTimes & time) !== 0) {
            return true;
          }
        }
      }
      return false;
    }),
    // What it could ever know, against the `move:` it does know
    learns: hidden((caught, value) => {
      const names: string[] = [];

      for (const move of getLearnableMoves(caught.species)) {
        names.push(getMoveData(move).name);
      }
      return holdsAny(names, value);
    }),
    // The types of the moves it knows, which is what somebody building
    // a party against one type is looking for
    'move-type': hidden((caught, value) => {
      const names: string[] = [];

      for (const move of caught.moves) {
        names.push(TYPE_NAMES[getMoveData(move).type]);
      }
      return holdsAny(names, value);
    }),
    // How a type lands on it, worked out over its own types the way a
    // hit is: `weak:` is anything over neutral, `resists:` anything
    // under it that still lands, `immune:` nothing at all
    weak: hidden((caught, value) => struckBy(caught, value, (factor) => factor > 1)),
    resists: hidden((caught, value) =>
      struckBy(caught, value, (factor) => factor < 1 && factor > 0),
    ),
    immune: hidden((caught, value) => struckBy(caught, value, (factor) => factor === 0)),
    // This individual's own measurements, which two of the same
    // species disagree about
    weight: hidden((caught, value) =>
      numeric(value, deriveCatchSize(caught.species, caught.traitValue, caught.type).weight),
    ),
    height: hidden((caught, value) =>
      numeric(value, deriveCatchSize(caught.species, caught.traitValue, caught.type).height),
    ),
    // One stat as it actually comes out: `stat:spe:>120`. The stat has
    // to be named, since "the stats" added up is not a number anybody
    // is asking about
    stat: hidden((caught, value) => {
      const { stat, wanted } = readStat(value);

      return stat != null && numeric(wanted, statValue(caught, stat));
    }),
    level: (caught, value) => numeric(value, caught.level),
    friendship: (caught, value) => numeric(value, caught.friendship),
    walked: (caught, value) => numeric(value, caught.walked),
    steps: (caught, value) => numeric(value, caught.steps),
    hatch: (caught, value) => numeric(value, stepsLeft(caught)),
    // Health, as a number or as a share of the maximum: `hp:<50%` is
    // the question a player asks, since nobody knows what a Snorlax's
    // number should be
    hp: (caught, value) =>
      value.includes('%')
        ? numeric(value.replaceAll('%', ''), (caught.health / getMaxHealth(caught)) * 100)
        : numeric(value, caught.health),
    bonus: (caught, value) => numeric(value, caught.effortBonus),
    // Its values, one stat or all six: `iv:atk:31`, `iv:180-`
    iv: hidden((caught, value) => {
      const { stat, wanted } = readIV(value);

      return numeric(wanted, stat == null ? totalIVs(caught.ivs) : getIV(caught.ivs, stat));
    }),
    // How much has been spent on any one of its moves, which is what
    // somebody looking for the ones still worth a PP Up means
    pp: hidden((caught, value) => {
      for (const move of caught.moves) {
        if (numeric(value, caught.movePoints[String(move)] ?? 0)) {
          return true;
        }
      }
      return false;
    }),
    moves: hidden((caught, value) => numeric(value, caught.moves.length)),

    // Whose hands it has been through, how it got there and what it
    // went for
    from: (caught, value) => {
      for (const entry of caught.history) {
        if (holds(entry.name ?? entry.owner, value)) {
          return true;
        }
      }
      return false;
    },
    hands: (caught, value) => numeric(value, caught.history.length),
    paid: (caught, value) => {
      for (const entry of caught.history) {
        if (entry.paid != null && numeric(value, entry.paid)) {
          return true;
        }
      }
      return false;
    },
    got: (caught, value) => {
      for (const entry of caught.history) {
        if (holds(ACQUISITION_NAMES[entry.kind], value)) {
          return true;
        }
      }
      return false;
    },

    // When it was caught, on its catcher's own calendar: a year, a
    // month, a day, a span of them or a comparison against one
    caught: (caught, value) => {
      const at = caught.caughtAt.slice(0, LOCAL_STAMP);

      for (const span of stamps(value)) {
        if (insideSpan(span, at)) {
          return true;
        }
      }
      return false;
    },
  }),
);

/** Every id in a name table any alternative of the value names */
/**
 * The plain half of a search: a word with no field in front of it.
 * The nickname and the species are both tried, so a Charmander called
 * Sparky is found by either
 */
function byName(caught: CaughtPokemon, value: string): boolean {
  if (value.trim() === '') {
    return true;
  }
  if (isEgg(caught)) {
    return holds('egg', value);
  }
  return holds(getCatchName(caught), value) || holds(getSpeciesData(caught.species).name, value);
}

/**
 * Whether one pokemon answers the whole search. A field nobody has
 * heard of matches nothing: `colour:red` should come back empty
 * rather than quietly ignoring the half of the search that was typed
 * most carefully
 */
export default function matchesCatch(
  caught: CaughtPokemon,
  query: string,
  context: CatchContext = {},
): boolean {
  for (const term of askedTerms(query)) {
    const answered =
      term.field === ''
        ? byName(caught, term.value)
        : FIELDS.get(term.field)?.(caught, term.value, context) === true;

    if (term.negated ? answered : !answered) {
      return false;
    }
  }
  return true;
}
