import type { CaughtPokemon } from './caught';
import { ACQUISITION_NAMES, getCatchName, isFavorite, isGuarded, isShiny } from './caught-record';
import { BALL_ITEMS, type Items } from '../data/ids/items';
import { BIOME_NAMES, TIME_OF_DAY_NAMES } from '../data/biome/names';
import { ENCOUNTER_TYPE_NAMES, EncounterType, deriveSize } from '../overworld/encounter';
import { GENDER_NAMES } from '../data/ids/species';
import { LAIR_NAMES } from '../data/overworld/lair';
import { ITEM_TYPE_ORDER, getItemData, listItemsByType } from '../data/items';
import {
  PERFECT_IVS,
  STAT_ORDER,
  Stats,
  getHealthStat,
  getIV,
  getOtherStat,
} from '../data/constants/stats';
import {
  TYPE_EFFECTIVENESS,
  TYPE_EFFECTIVENESS_FACTOR,
  TYPE_NAMES,
  type Types,
} from '../data/constants/types';
import { EGG_GROUP_NAMES } from '../data/ids/egg-groups';
import { SPAWN_RARITY_NAMES, getSpawnRarity } from '../data/biome';
import { NATURE_NAMES, getNatureFactor } from '../data/ids/natures';
import { unusedEffort } from './effort';
import { getAbilityData, getRegisteredAbilities } from '../data/abilities';
import {
  getFamilyName,
  getLearnableMoves,
  getRegisteredSpecies,
  getSpeciesData,
} from '../data/species';
import { getMoveData, getRegisteredMoves } from '../data/moves';
import type { Species } from '../data/ids/species';
import { isEgg } from './egg';
import { getMaxHealth, isFainted } from './health';
import BATTLE_TIMEOUT, { isLockLive } from './battle-lock';
import { serverNow } from './clock';
import type { Bounds, QueryTerm, QueryVocabulary } from '../core/query';
import {
  alternatives,
  askedTerms,
  holds,
  holdsAny,
  inside,
  namedAll,
  parseControls,
  ranges,
} from '../core/query';

/**
 * What a search box over a box of pokemon can be asked.
 *
 * A plain word matches the name (the nickname if it has one, the
 * species otherwise) and everything else is a `field:value` pair.
 * Terms narrow, and two of the same field are both, so
 * `type:fire type:flying` finds a Charizard rather than half the box.
 * A leading `!` refuses a term, a `|` accepts any alternative, and a
 * numeric value takes a comparison or a range. `sort:` and `order:`
 * arrange the answers instead of narrowing them.
 *
 * **An egg gives nothing away.** It answers to "egg" and to the marks
 * its owner put on it; every question about what is inside answers no,
 * since the box already refuses to draw it
 */

/** The level nothing goes past, which is what `is:maxed` asks about */
const MAX_LEVEL = 100;

/** How much of a stored stamp is the catcher's own wall clock */
const LOCAL_STAMP = 19;

/**
 * What a search knows that a record does not: which pokemon this one
 * is, and the handful of facts that live in another table.
 *
 * A list that has not read them leaves them out, and every mark that
 * needs one is then answered no — the same answer a field nobody has
 * heard of gets, and for the same reason
 */
export interface CatchContext {
  /** The id of the record being asked about */
  id?: string;
  /** The owner's buddy, as a catch id */
  buddy?: string;
  /** Everything of theirs standing on the auction block */
  listed?: ReadonlySet<string>;
  /** Everything of theirs drafted into a raid party */
  raiding?: ReadonlySet<string>;
  /** Every species they own more than one of */
  duplicates?: ReadonlySet<Species>;
}

/** What one field asks of one pokemon */
type CatchField = (caught: CaughtPokemon, value: string, context: CatchContext) => boolean;

/**
 * Everything about a pokemon that an egg keeps to itself. The wrapper
 * is what makes that a rule rather than something each field has to
 * remember
 */
function hidden(field: CatchField): CatchField {
  return (caught, value, context) => !isEgg(caught) && field(caught, value, context);
}

/** Whether a number answers a numeric term */
function numeric(value: string, actual: number): boolean {
  return ranges(value).some((bounds) => inside(bounds, actual));
}

/**
 * The half of a search the store can answer.
 *
 * A search runs in two passes: whatever narrows into a query is asked
 * of the store, and everything else is answered over what came back.
 * The rule the planner keeps is that a constraint may only be pushed
 * when it is **implied** by the predicate — a narrowing that drops a
 * record the runtime would have kept is a wrong answer, not a faster
 * one, so anything ambiguous is left to the second pass.
 */
export type CatchOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'ilike';

/** A column of the catch row itself */
export interface RowConstraint {
  on: 'row';
  column: string;
  op: CatchOp;
  value: string | number | boolean | (string | number)[];
}

/**
 * A column of one of the catch's child tables. The join rides on an
 * **alias** of its own, so the embed the reader unpacks comes back
 * whole: filtering the one it reads would leave a pokemon holding
 * only the move that was searched for
 */
export interface ChildConstraint {
  on: 'child';
  alias: string;
  table: string;
  column: string;
  op: CatchOp;
  value: string | number | (string | number)[];
}

/**
 * A row somewhere else that has to exist: the auction it stands in,
 * the party it is drafted into, the profile it is the buddy of
 */
export interface ExistsConstraint {
  on: 'exists';
  alias: string;
  table: string;
  /** What else must be true of the joined row, column by column */
  equals: Record<string, string | number | boolean>;
}

export type CatchConstraint = RowConstraint | ChildConstraint | ExistsConstraint;

/** The one constraint a plain flag column is, either way round */
function flag(column: string, wanted: boolean): CatchConstraint[] {
  return [{ on: 'row', column, op: 'eq', value: wanted }];
}

/** A row elsewhere that has to exist for this pokemon */
function joined(
  alias: string,
  table: string,
  equals: Record<string, string | number | boolean> = {},
): CatchConstraint[] {
  return [{ on: 'exists', alias, table, equals }];
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

const MARKS = new Map<string, Mark>(
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
    // health and `is:sick` is carrying something. Only the second is a
    // column, since a maximum is derived rather than stored
    hurt: {
      of: (caught) => caught.health < getMaxHealth(caught),
      constrain: () => [],
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
      of: (caught) =>
        caught.moves.some((move) =>
          getSpeciesData(caught.species).types.includes(getMoveData(move).type),
        ),
      secret: true,
      constrain: () => [],
    },
    // Whether it rolled the rarer ability its species keeps back
    hidden: {
      of: (caught) => {
        const rare = getSpeciesData(caught.species).hiddenAbility;

        return rare != null && caught.abilities.includes(rare);
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
function markedAny(
  caught: CaughtPokemon,
  value: string,
  wanted: boolean,
  context: CatchContext,
): boolean {
  return alternatives(value).some((word) => marked(caught, word, wanted, context));
}

/**
 * What each value is asked for as. They are the short names a player
 * types rather than the long ones a sheet prints: `iv:spa:31` is the
 * question somebody actually asks
 */
const IV_WORDS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

/** The column each value is stored in, in the same order */
const IV_COLUMNS = ['iv_hp', 'iv_atk', 'iv_def', 'iv_spa', 'iv_spd', 'iv_spe'];

const IV_STATS = new Map<string, Stats>(IV_WORDS.map((word, at) => [word, STAT_ORDER[at]]));

/**
 * A value term, which may name a stat before its number: `iv:atk:31`,
 * `iv:spe:28-31`. Without one it is the six added up, so `iv:180-` is
 * a pokemon that is nearly all the way there. A stat nobody has heard
 * of asks for nothing, which refuses the term
 */
function readIV(value: string): { stat: Stats | null; wanted: string } {
  if (!value.includes(':')) {
    return { stat: null, wanted: value };
  }

  const named = readStat(value);

  return named.stat == null ? { stat: null, wanted: '' } : named;
}

/**
 * A term that names a stat before its number: `stat:spe:>120`. Unlike
 * a value term it has to name one, since "the stats" added together
 * is not a number anybody is asking about
 */
function readStat(value: string): { stat: Stats | null; wanted: string } {
  const colon = value.indexOf(':');

  if (colon < 0) {
    return { stat: null, wanted: '' };
  }
  return {
    stat: IV_STATS.get(value.slice(0, colon).trim().toLowerCase()) ?? null,
    wanted: value.slice(colon + 1),
  };
}

/** The six added up, which is what a value term with no stat asks about */
function totalIVs(packed: number): number {
  return STAT_ORDER.reduce((sum, stat) => sum + getIV(packed, stat), 0);
}

/**
 * What one of its stats actually comes to: the species' base against
 * this individual's level, values, training and nature. It is the
 * number a sheet prints rather than anything stored
 */
function statValue(caught: CaughtPokemon, stat: Stats): number {
  const base = getSpeciesData(caught.species).stats[stat];
  const value = getIV(caught.ivs, stat);
  const effort = caught.effortValues[stat];

  return stat === Stats.HP
    ? getHealthStat(caught.level, base, value, effort)
    : getOtherStat(caught.level, base, value, effort, getNatureFactor(caught.nature, stat));
}

/**
 * What one attacking type comes to against everything this pokemon
 * is: the factors multiplied, the way a hit is worked out. Four for a
 * doubly weak pair, nothing at all for an immunity
 */
function effectiveness(types: Types[], attacking: Types): number {
  let factor = 1;

  for (const defending of types) {
    const result = TYPE_EFFECTIVENESS[attacking][defending];

    if (result != null) {
      factor *= TYPE_EFFECTIVENESS_FACTOR[result];
    }
  }
  return factor;
}

/**
 * Whether any type the value names lands on this pokemon the way the
 * term asks: harder than usual, softer, or not at all
 */
function struckBy(
  caught: CaughtPokemon,
  value: string,
  keep: (factor: number) => boolean,
): boolean {
  return alternatives(value).some((word) =>
    idsFor(TYPE_NAMES, word).some((type) =>
      keep(effectiveness(getSpeciesData(caught.species).types, type)),
    ),
  );
}

/** How far an egg still has to be carried */
function stepsLeft(caught: CaughtPokemon): number {
  return Math.max(0, caught.hatchSteps - caught.steps);
}

/**
 * The six statuses a record keeps out of a battle, by the word a
 * search calls them and the bit each is stored as. The column beside
 * the bit is the same question asked of the store, which cannot read
 * a bit out of a mask on its own
 */
const STORED_STATUSES = new Map<string, { bit: number; column: string }>(
  Object.entries({
    poison: { bit: 0b00_0001, column: 'status_poisoned' },
    toxic: { bit: 0b00_0010, column: 'status_badly_poisoned' },
    sleep: { bit: 0b00_0100, column: 'status_sleeping' },
    paralysis: { bit: 0b00_1000, column: 'status_paralyzed' },
    burn: { bit: 0b01_0000, column: 'status_burned' },
    freeze: { bit: 0b10_0000, column: 'status_frozen' },
  }),
);

/**
 * One end of a search over the stored stamp. It is a string rather
 * than a number because the stamp is one: the catcher's own wall
 * clock, written so that comparing two of them is comparing two
 * strings. Null is an end nobody named
 */
interface Span {
  low: string | null;
  high: string | null;
  lowOpen: boolean;
  highOpen: boolean;
}

/** A wall-clock stamp, in the shape the record stores one */
function localStamp(at: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');

  return (
    `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}` +
    `T${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}`
  );
}

/** The first instant of a day, as the stamp writes it */
function dayStart(year: number, month: number, day: number): string {
  const pad = (value: number): string => String(value).padStart(2, '0');

  return `${year}-${pad(month)}-${pad(day)}T00:00:00`;
}

/**
 * What a written date covers, as the half-open span between its first
 * instant and the first instant after it. A year, a month and a day
 * are all one of these, which is what lets `caught:2026-08` and
 * `caught:2026` be the same question at two sizes
 */
function period(text: string): { low: string; high: string } | null {
  const wanted = text.trim().toLowerCase();
  const today = new Date();

  if (wanted === 'today') {
    return {
      low: dayStart(today.getFullYear(), today.getMonth() + 1, today.getDate()),
      high: dayStart(today.getFullYear(), today.getMonth() + 1, today.getDate() + 1),
    };
  }
  if (/^\d{4}$/.test(wanted)) {
    const year = Number(wanted);

    return { low: dayStart(year, 1, 1), high: dayStart(year + 1, 1, 1) };
  }
  if (/^\d{4}-\d{2}$/.test(wanted)) {
    const [year, month] = wanted.split('-').map(Number);

    return {
      low: dayStart(year, month, 1),
      high: month === 12 ? dayStart(year + 1, 1, 1) : dayStart(year, month + 1, 1),
    };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(wanted)) {
    const [year, month, day] = wanted.split('-').map(Number);
    // Rolled over by the calendar rather than by hand: the last day of
    // a month is the one place hand-rolling goes wrong
    const after = new Date(Date.UTC(year, month - 1, day + 1));

    return {
      low: dayStart(year, month, day),
      high: dayStart(after.getUTCFullYear(), after.getUTCMonth() + 1, after.getUTCDate()),
    };
  }
  return null;
}

/**
 * One alternative of a date term as a span, or null where it names no
 * date. `7d` is the last seven days, which is the one question about
 * a date that is easier asked than written out
 */
function stamp(text: string): Span | null {
  const wanted = text.trim().toLowerCase();
  const recent = /^(\d+)d$/.exec(wanted);

  if (recent != null) {
    const since = new Date();

    since.setDate(since.getDate() - Number(recent[1]));
    return { low: localStamp(since), high: null, lowOpen: false, highOpen: false };
  }

  const comparison = /^(>=|<=|>|<|=)(.*)$/.exec(wanted);

  if (comparison != null) {
    const covered = period(comparison[2]);

    if (covered == null) {
      return null;
    }
    switch (comparison[1]) {
      // After the whole of it, which for a month is the month after
      case '>':
        return { low: covered.high, high: null, lowOpen: false, highOpen: false };
      case '>=':
        return { low: covered.low, high: null, lowOpen: false, highOpen: false };
      case '<':
        return { low: null, high: covered.low, lowOpen: false, highOpen: true };
      case '<=':
        return { low: null, high: covered.high, lowOpen: false, highOpen: true };
      default:
        return { low: covered.low, high: covered.high, lowOpen: false, highOpen: true };
    }
  }

  if (wanted.includes('..')) {
    const [from, to] = wanted.split('..');
    const first = period(from);
    const last = period(to);

    if (first == null || last == null) {
      return null;
    }
    return { low: first.low, high: last.high, lowOpen: false, highOpen: true };
  }

  const covered = period(wanted);

  return covered == null
    ? null
    : { low: covered.low, high: covered.high, lowOpen: false, highOpen: true };
}

/** Every span a date term accepts */
function stamps(value: string): Span[] {
  return alternatives(value)
    .map(stamp)
    .filter((span): span is Span => span != null);
}

/** Whether a stored stamp falls inside one span */
function insideSpan(span: Span, at: string): boolean {
  if (span.low != null && (span.lowOpen ? at <= span.low : at < span.low)) {
    return false;
  }
  return span.high == null || (span.highOpen ? at < span.high : at <= span.high);
}

const FIELDS = new Map<string, CatchField>(
  Object.entries<CatchField>({
    family: hidden((caught, value) =>
      holds(getFamilyName(getSpeciesData(caught.species).family), value),
    ),
    species: hidden((caught, value) => holds(getSpeciesData(caught.species).name, value)),
    type: hidden((caught, value) =>
      holdsAny(
        getSpeciesData(caught.species).types.map((kind) => TYPE_NAMES[kind]),
        value,
      ),
    ),
    move: hidden((caught, value) =>
      holdsAny(
        caught.moves.map((move) => getMoveData(move).name),
        value,
      ),
    ),
    ability: hidden((caught, value) =>
      holdsAny(
        caught.abilities.map((ability) => getAbilityData(ability).name),
        value,
      ),
    ),
    item: hidden((caught, value) =>
      holdsAny(
        caught.items.map((item) => getItemData(item).name),
        value,
      ),
    ),
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
    status: (caught, value) =>
      alternatives(value).some((word) => {
        const stored = STORED_STATUSES.get(word.toLowerCase());

        return stored != null && (caught.statuses & stored.bit) !== 0;
      }),

    // What the species is, as the dex says it: the number, the line
    // under the name, the company it breeds with and how hard it was
    // to catch
    dex: hidden((caught, value) => numeric(value, getSpeciesData(caught.species).dexNumber)),
    category: hidden((caught, value) => holds(getSpeciesData(caught.species).category, value)),
    'egg-group': hidden((caught, value) =>
      holdsAny(
        getSpeciesData(caught.species).eggGroups.map((group) => EGG_GROUP_NAMES[group]),
        value,
      ),
    ),
    'catch-rate': hidden((caught, value) =>
      numeric(value, getSpeciesData(caught.species).catchRate),
    ),
    rarity: hidden((caught, value) =>
      holds(SPAWN_RARITY_NAMES[getSpawnRarity(caught.species)], value),
    ),
    // Where and when the **species** lives, which is not where this one
    // was met: `spawns:cave` is a fact about Zubat, `biome:cave` is a
    // fact about this Zubat
    spawns: hidden((caught, value) =>
      holdsAny(
        getSpeciesData(caught.species).biomes.map((biome) => BIOME_NAMES[biome]),
        value,
      ),
    ),
    active: hidden((caught, value) => {
      const { activeTimes } = getSpeciesData(caught.species);

      return alternatives(value).some((word) =>
        idsFor(TIME_OF_DAY_NAMES, word).some((time) => (activeTimes & time) !== 0),
      );
    }),
    // What it could ever know, against the `move:` it does know
    learns: hidden((caught, value) =>
      holdsAny(
        getLearnableMoves(caught.species).map((move) => getMoveData(move).name),
        value,
      ),
    ),
    // The types of the moves it knows, which is what somebody building
    // a party against one type is looking for
    'move-type': hidden((caught, value) =>
      holdsAny(
        caught.moves.map((move) => TYPE_NAMES[getMoveData(move).type]),
        value,
      ),
    ),
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
      numeric(value, deriveSize(caught.species, caught.traitValue).weight),
    ),
    height: hidden((caught, value) =>
      numeric(value, deriveSize(caught.species, caught.traitValue).height),
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
    pp: hidden((caught, value) =>
      caught.moves.some((move) => numeric(value, caught.movePoints[String(move)] ?? 0)),
    ),
    moves: hidden((caught, value) => numeric(value, caught.moves.length)),

    // Whose hands it has been through, how it got there and what it
    // went for
    from: (caught, value) =>
      caught.history.some((entry) => holds(entry.name ?? entry.owner, value)),
    hands: (caught, value) => numeric(value, caught.history.length),
    paid: (caught, value) =>
      caught.history.some((entry) => entry.paid != null && numeric(value, entry.paid)),
    got: (caught, value) =>
      caught.history.some((entry) => holds(ACQUISITION_NAMES[entry.kind], value)),

    // When it was caught, on its catcher's own calendar: a year, a
    // month, a day, a span of them or a comparison against one
    caught: (caught, value) => {
      const at = caught.caughtAt.slice(0, LOCAL_STAMP);

      return stamps(value).some((span) => insideSpan(span, at));
    },
  }),
);

/** Every id in a name table any alternative of the value names */
function idsFor(table: Record<number, string>, value: string): number[] {
  return namedAll(table, value);
}

/** Every registered item, which is the tray in one list */
function everyItem(): Items[] {
  return ITEM_TYPE_ORDER.flatMap((type) => listItemsByType(type));
}

/**
 * The one or many values a name-matched column narrows to. Nothing
 * matched is no constraint at all: the runtime will refuse the term
 * anyway, and a query for "none of these" is a query for the whole box
 */
function oneOf(column: string, values: number[]): CatchConstraint[] {
  if (values.length === 0) {
    return [];
  }
  return values.length === 1
    ? [{ on: 'row', column, op: 'eq', value: values[0] }]
    : [{ on: 'row', column, op: 'in', value: values }];
}

/** The same, for a child table joined under an alias of its own */
function childIn(
  alias: string,
  table: string,
  column: string,
  values: number[],
): CatchConstraint[] {
  if (values.length === 0) {
    return [];
  }
  return values.length === 1
    ? [{ on: 'child', alias, table, column, op: 'eq', value: values[0] }]
    : [{ on: 'child', alias, table, column, op: 'in', value: values }];
}

/**
 * A band of numbers as comparisons. An exact number is one of them;
 * an end nobody named is left off entirely, since "anything up to 60"
 * is one filter rather than two
 */
function comparisons(bounds: Bounds): { op: CatchOp; value: number }[] {
  if (bounds.low === bounds.high && !bounds.lowOpen && !bounds.highOpen) {
    return [{ op: 'eq', value: bounds.low }];
  }

  const asked: { op: CatchOp; value: number }[] = [];

  if (Number.isFinite(bounds.low)) {
    asked.push({ op: bounds.lowOpen ? 'gt' : 'gte', value: bounds.low });
  }
  if (Number.isFinite(bounds.high)) {
    asked.push({ op: bounds.highOpen ? 'lt' : 'lte', value: bounds.high });
  }
  return asked;
}

/**
 * A numeric term as the store would be asked it, or nothing where it
 * asks for several bands at once: `level:10|50` is two of them, and a
 * pair of comparisons cannot say "either"
 */
function pushRange(column: string, value: string): CatchConstraint[] {
  const bounds = ranges(value);

  return bounds.length === 1
    ? comparisons(bounds[0]).map((asked) => ({ on: 'row', column, ...asked }))
    : [];
}

/** The same, for a band over a child table's column */
function pushChildRange(
  alias: string,
  table: string,
  column: string,
  value: string,
): CatchConstraint[] {
  const bounds = ranges(value);

  if (bounds.length !== 1) {
    return [];
  }
  return comparisons(bounds[0]).map((asked) => ({ on: 'child', alias, table, column, ...asked }));
}

/** A date term as bounds on the stored stamp */
function pushSpan(column: string, value: string): CatchConstraint[] {
  const spans = stamps(value);

  if (spans.length !== 1) {
    return [];
  }
  const [span] = spans;
  const pushed: CatchConstraint[] = [];

  if (span.low != null) {
    pushed.push({ on: 'row', column, op: span.lowOpen ? 'gt' : 'gte', value: span.low });
  }
  if (span.high != null) {
    pushed.push({ on: 'row', column, op: span.highOpen ? 'lt' : 'lte', value: span.high });
  }
  return pushed;
}

/** A substring match on one of the row's own columns */
function likeRow(column: string, value: string): CatchConstraint[] {
  const words = alternatives(value);

  return words.length === 1 ? [{ on: 'row', column, op: 'ilike', value: `%${words[0]}%` }] : [];
}

/** The same, over a child table joined under an alias of its own */
function likeChild(alias: string, table: string, column: string, value: string): CatchConstraint[] {
  const words = alternatives(value);

  return words.length === 1
    ? [{ on: 'child', alias, table, column, op: 'ilike', value: `%${words[0]}%` }]
    : [];
}

/** What each ball is called, which is what its item is called */
function ballNames(): Record<number, string> {
  const names: Record<number, string> = {};

  for (const [ball, item] of Object.entries(BALL_ITEMS)) {
    names[Number(ball)] = getItemData(item).name;
  }
  return names;
}

/** Every registered thing of a kind whose name holds the word */
function idsNamed<T extends number>(every: T[], name: (entry: T) => string, value: string): T[] {
  return every.filter((entry) => holds(name(entry), value));
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
    case 'dex':
      return oneOf(
        'species',
        getRegisteredSpecies().filter((species) =>
          numeric(value, getSpeciesData(species).dexNumber),
        ),
      );
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
export function planCatchSearch(query: string): CatchConstraint[] {
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
  return askedTerms(query).every((term) => {
    const answered =
      term.field === ''
        ? byName(caught, term.value)
        : FIELDS.get(term.field)?.(caught, term.value, context) === true;

    return term.negated ? !answered : answered;
  });
}

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
  ball: () => Object.values(BALL_ITEMS).map((ball) => getItemData(ball).name),
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
export const CATCH_VOCABULARY: QueryVocabulary = {
  fields: [...FIELDS.keys(), 'sort', 'order'].map((name) => ({
    name,
    hint: HINTS[name] ?? '',
    values: VALUES[name],
  })),
};

/**
 * The rows a search asked for, in the order it asked for them.
 *
 * The two arranging terms hide nothing, so this runs over what the
 * predicate already kept. A `sort:` nobody has a reading for leaves
 * the list in the order it arrived, which is the box's own
 */
export function orderCatches<T>(rows: T[], query: string, of: (row: T) => CaughtPokemon): T[] {
  const controls = parseControls(query);
  const read = SORTS.get(controls.sort);

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
