import { BIOME_NAMES } from '../../../data/biome';
import { BALL_ITEMS, type Balls, type Items } from '../../../data/ids/items';
import { Genders, type Species } from '../../../data/ids/species';
import { ITEM_TYPE_ORDER, getItemData, listItemsByType } from '../../../data/items';
import { NATURE_NAMES } from '../../../data/ids/natures';
import { STAT_NAMES, Stats } from '../../../data/constants/stats';
import { Slots } from '../../../data/constants/slots';
import { WEATHER_NAMES } from '../../../data/overworld/weather';
import type Abilities from '../../../data/ids/abilities';
import type Biome from '../../../data/ids/biome';
import type Natures from '../../../data/ids/natures';
import type Weather from '../../../data/overworld/weather';
import type { Moves } from '../../../data/ids/moves';
import { getAbilityData, getRegisteredAbilities } from '../../../data/abilities';
import { getMoveData, getRegisteredMoves } from '../../../data/moves';
import { getRegisteredSpecies, getSpeciesData } from '../../../data/species';

/**
 * Turning what somebody typed into the thing they meant.
 *
 * The bar is one line of text, so every registry it reaches is
 * reached by name. The same lists feed the suggestions and the
 * reading, which is what makes a suggestion always resolve
 */

/** One thing a parameter can name */
export interface Named<T> {
  id: T;
  name: string;
}

/**
 * The one thing a typed word names, or null where it names none or
 * several. An exact name wins outright, so a species whose name is
 * inside another's is still reachable by typing it out
 */
export function findNamed<T>(entries: Named<T>[], typed: string): T | null {
  const wanted = typed.trim().toLowerCase();

  if (wanted === '') {
    return null;
  }
  const exact = entries.filter((entry) => entry.name.toLowerCase() === wanted);

  if (exact.length === 1) {
    return exact[0].id;
  }
  const held = entries.filter((entry) => entry.name.toLowerCase().includes(wanted));

  return held.length === 1 ? held[0].id : null;
}

/** The names alone, for the suggestion list */
export function nameList<T>(entries: Named<T>[]): string[] {
  return entries.map((entry) => entry.name);
}

export function speciesEntries(): Named<Species>[] {
  return getRegisteredSpecies().map((id) => ({ id, name: getSpeciesData(id).name }));
}

export function moveEntries(): Named<Moves>[] {
  return getRegisteredMoves().map((id) => ({ id, name: getMoveData(id).name }));
}

export function abilityEntries(): Named<Abilities>[] {
  return getRegisteredAbilities().map((id) => ({ id, name: getAbilityData(id).name }));
}

/** Every item, in the order the dashboard's own picker lists them */
export function itemEntries(): Named<Items>[] {
  return ITEM_TYPE_ORDER.flatMap((type) =>
    listItemsByType(type).map((id) => ({ id, name: getItemData(id).name })),
  );
}

export function ballEntries(): Named<Balls>[] {
  return (Object.keys(BALL_ITEMS).map(Number) as Balls[]).map((id) => ({
    id,
    name: getItemData(BALL_ITEMS[id]).name,
  }));
}

/**
 * The three below read a name table rather than a registry: a const
 * enum cannot be listed at runtime, so the names written beside one
 * stand in for a listing of it
 */
export function natureEntries(): Named<Natures>[] {
  return (Object.keys(NATURE_NAMES).map(Number) as Natures[]).map((id) => ({
    id,
    name: NATURE_NAMES[id],
  }));
}

export function biomeEntries(): Named<Biome>[] {
  return (Object.keys(BIOME_NAMES).map(Number) as Biome[]).map((id) => ({
    id,
    name: BIOME_NAMES[id],
  }));
}

export function weatherEntries(): Named<Weather>[] {
  return (Object.keys(WEATHER_NAMES).map(Number) as Weather[]).map((id) => ({
    id,
    name: WEATHER_NAMES[id],
  }));
}

/**
 * The six stats, under names short enough to type. `STAT_NAMES` is
 * what a screen prints, and "Sp. Attack" is not a word anybody wants
 * to spell at a bar
 */
export const STAT_KEYS: Named<Stats>[] = [
  { id: Stats.HP, name: 'hp' },
  { id: Stats.Attack, name: 'attack' },
  { id: Stats.Defense, name: 'defense' },
  { id: Stats.SpecialAttack, name: 'spattack' },
  { id: Stats.SpecialDefense, name: 'spdefense' },
  { id: Stats.Speed, name: 'speed' },
];

/** What each stat is called where the bar reads one back */
export const STAT_LABELS: Record<Stats, string> = STAT_NAMES;

/** The three things a pokemon has room for */
export const SLOT_KEYS: Named<Slots>[] = [
  { id: Slots.Ability, name: 'ability' },
  { id: Slots.Item, name: 'item' },
  { id: Slots.Move, name: 'move' },
];

export const GENDER_KEYS: Named<Genders>[] = [
  { id: Genders.Male, name: 'male' },
  { id: Genders.Female, name: 'female' },
  { id: Genders.Genderless, name: 'genderless' },
];
