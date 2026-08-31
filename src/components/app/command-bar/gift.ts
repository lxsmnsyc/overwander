import type { CommandArguments } from '../../../core/command';
import { type Arguments, asBounded, asWhole, endOfDay, refuse } from './arguments';
import { Balls } from '../../../data/ids/items';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  MAX_SLOTS,
  Slots,
  packSlots,
} from '../../../data/constants/slots';
import { EVERYBODY, SHADOW, SHINY } from './commands';
import {
  GENDER_KEYS,
  SLOT_KEYS,
  STAT_KEYS,
  abilityEntries,
  ballEntries,
  findNamed,
  itemEntries,
  moveEntries,
  natureEntries,
  speciesEntries,
} from './names';
import { MAX_IV, STAT_ORDER, createStatsField, packIVs } from '../../../data/constants/stats';
import { everyGiven, given } from '../../../core/command';
import type { CommandGift } from '../../../auth/commands';
import { GiftKind } from '../../../auth/gift-record';

/**
 * What a `/gift-` line was asking for.
 *
 * The dashboard's form is the same thing with a screen around it, and
 * the rules are its: everything about the pokemon beyond the species
 * is optional, and what is left out is whatever the roll produced
 */

/** How high a hand-written pokemon may come in at */
const MIN_LEVEL = 1;
const MAX_LEVEL = 100;

/** What one comes at when nobody said, as the starters do */
const DEFAULT_LEVEL = 5;

export interface GiftRequest {
  /** Whose shelf, or null for one that stands on everybody's */
  to: string | null;
  gift: CommandGift;
}

/** A `name:number` value, as `iv:speed:31` carries after its first colon */
function chained(value: string): { name: string; count: string } {
  const colon = value.indexOf(':');

  return colon < 0
    ? { name: value, count: '' }
    : { name: value.slice(0, colon), count: value.slice(colon + 1) };
}

/**
 * The six values, or null where none was pinned. Anything unnamed is
 * perfect rather than rolled: somebody setting a value by hand is
 * setting it because they want an exact pokemon, and it is fewer
 * keystrokes to lower one than to raise six
 */
function readIVs(parameters: CommandArguments): number | null | undefined {
  const asked = everyGiven(parameters, 'iv');

  if (asked.length === 0) {
    return null;
  }
  const values = createStatsField();

  for (const stat of STAT_ORDER) {
    values[stat] = MAX_IV;
  }
  for (const one of asked) {
    const { name, count } = chained(one);
    const stat = findNamed(STAT_KEYS, name);
    const value = asBounded(count, 0, MAX_IV);

    if (stat == null || value == null) {
      return undefined;
    }
    values[stat] = value;
  }
  return packIVs(values);
}

/** The room it walks in with, or undefined where a line will not read */
function readSlots(parameters: CommandArguments): number | undefined {
  const room: Record<Slots, number> = {
    [Slots.Ability]: DEFAULT_ABILITY_SLOTS,
    [Slots.Item]: DEFAULT_ITEM_SLOTS,
    [Slots.Move]: DEFAULT_MOVE_SLOTS,
  };

  for (const one of everyGiven(parameters, 'slots')) {
    const { name, count } = chained(one);
    const slot = findNamed(SLOT_KEYS, name);
    const value = asBounded(count, 1, MAX_SLOTS);

    if (slot == null || value == null) {
      return undefined;
    }
    room[slot] = value;
  }
  return packSlots(room[Slots.Ability], room[Slots.Item], room[Slots.Move]);
}

/** Every value of a repeated parameter as the thing it names */
function readEach<T>(
  parameters: CommandArguments,
  name: string,
  entries: () => { id: T; name: string }[],
): T[] | null {
  const asked = everyGiven(parameters, name);

  if (asked.length === 0) {
    return [];
  }
  const known = entries();
  const found = asked.map((one) => findNamed(known, one));

  return found.every((one): one is T => one != null) ? found : null;
}

/** Whose shelf it goes on, or null for every shelf */
function readRecipient(parameters: CommandArguments): string | null {
  const to = given(parameters, 'to')?.trim() ?? '';

  return to === '' || to.toLowerCase() === EVERYBODY ? null : to;
}

/** What every gift carries, whatever is on it */
function readCommon(
  parameters: CommandArguments,
): Arguments<{ reason: string; expiresAt: number | null }> {
  const reason = given(parameters, 'reason')?.trim() ?? '';

  if (reason === '') {
    return refuse('Say what it is for, with reason:. It is the only line on the card.');
  }
  const expiresAt = endOfDay(given(parameters, 'expires'));

  if (expiresAt === null) {
    return refuse('That expiry is not a date.');
  }
  return { ok: true, value: { reason, expiresAt: expiresAt ?? null } };
}

/** What `/gift-item` was asking for */
function readItemGift(parameters: CommandArguments): Arguments<GiftRequest> {
  const common = readCommon(parameters);

  if (!common.ok) {
    return common;
  }
  const item = findNamed(itemEntries(), given(parameters, 'item') ?? '');

  if (item == null) {
    return refuse('Name one item, with item:.');
  }
  const amount = asWhole(given(parameters, 'amount'));

  if (amount === null || (amount != null && amount < 1)) {
    return refuse('The amount has to be a whole number, one or more.');
  }
  return {
    ok: true,
    value: {
      to: readRecipient(parameters),
      gift: { ...common.value, kind: GiftKind.Item, item, amount: amount ?? 1 },
    },
  };
}

/** What one of the two pokemon gifts was asking for */
function readPokemonGift(
  kind: GiftKind.Catch | GiftKind.Encounter,
  parameters: CommandArguments,
): Arguments<GiftRequest> {
  const common = readCommon(parameters);

  if (!common.ok) {
    return common;
  }
  const species = findNamed(speciesEntries(), given(parameters, 'species') ?? '');

  if (species == null) {
    return refuse('Name one species, with species:.');
  }
  const level = asBounded(given(parameters, 'level'), MIN_LEVEL, MAX_LEVEL);

  if (level === null) {
    return refuse(`The level has to be between ${MIN_LEVEL} and ${MAX_LEVEL}.`);
  }
  const comes = everyGiven(parameters, 'is').map((one) => one.trim().toLowerCase());
  const unknown = comes.find((one) => one !== SHINY && one !== SHADOW);

  if (unknown != null) {
    return refuse(`A pokemon can be ${SHINY} or ${SHADOW}, not ${unknown}.`);
  }
  const nature = readOne(parameters, 'nature', natureEntries);
  const gender = readOne(parameters, 'gender', () => GENDER_KEYS);

  if (nature === undefined || gender === undefined) {
    return refuse('That nature or gender is not one of them.');
  }
  const ivs = readIVs(parameters);
  const slots = readSlots(parameters);

  if (ivs === undefined || slots === undefined) {
    return refuse('An iv: or slots: line has to name one of them and a number.');
  }
  const abilities = readEach(parameters, 'ability', abilityEntries);
  const moves = readEach(parameters, 'move', moveEntries);
  const items = readEach(parameters, 'item', itemEntries);

  if (abilities == null || moves == null || items == null) {
    return refuse('One of the abilities, moves or items names nothing, or more than one thing.');
  }
  const pokemon = {
    ...common.value,
    species,
    level: level ?? DEFAULT_LEVEL,
    shiny: comes.includes(SHINY),
    shadow: comes.includes(SHADOW),
    gender,
    nature,
    ivs,
    abilities,
    moves,
    items,
    place: given(parameters, 'location')?.trim() ?? '',
    slots,
  };

  if (kind === GiftKind.Encounter) {
    return { ok: true, value: { to: readRecipient(parameters), gift: { ...pokemon, kind } } };
  }
  const ball = findNamed(ballEntries(), given(parameters, 'ball') ?? '');

  if (ball == null && given(parameters, 'ball') != null) {
    return refuse('That ball is not one of them.');
  }
  return {
    ok: true,
    value: {
      to: readRecipient(parameters),
      gift: {
        ...pokemon,
        kind,
        ball: ball ?? Balls.PremierBall,
        owner: given(parameters, 'trainer')?.trim() ?? '',
      },
    },
  };
}

/**
 * One optional named value: null for a parameter nobody gave, and
 * undefined for one that names nothing the game has
 */
function readOne<T>(
  parameters: CommandArguments,
  name: string,
  entries: () => { id: T; name: string }[],
): T | null | undefined {
  const typed = given(parameters, name);

  if (typed == null) {
    return null;
  }
  return findNamed(entries(), typed) ?? undefined;
}

/** What a `/gift-` line was asking for, whichever of the three it is */
export default function readGift(
  kind: GiftKind,
  parameters: CommandArguments,
): Arguments<GiftRequest> {
  return kind === GiftKind.Item ? readItemGift(parameters) : readPokemonGift(kind, parameters);
}
