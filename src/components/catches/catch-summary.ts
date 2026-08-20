import type { CaughtPokemon } from '../../auth/caught';
import { isShiny } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { STATUS_NAMES, getMaxHealth, isFainted } from '../../auth/health';
import { Genders } from '../../data/ids/species';
import { unpackStatuses } from '../../data/ids/status';
import { getSpeciesData } from '../../data/species';
import type { BoxEntry } from './CatchBox';

/**
 * How one of the player's pokemon is said and drawn, wherever a
 * collection is shown.
 *
 * These sat in the list that first needed them, which was fine while
 * only that list drew a box. Now the picker draws the same box and the
 * list is the picker — so the two imported each other, which is a
 * cycle, and a cycle is the module system saying that neither of them
 * owns this.
 */

/**
 * The sign a gender is shown by. Something genderless shows nothing:
 * a mark for it would be one more symbol to learn for a fact that
 * changes nothing
 */
export const GENDER_MARKS: Record<Genders, string> = {
  [Genders.Genderless]: '',
  [Genders.Male]: '♂',
  [Genders.Female]: '♀',
};

export { GENDER_NAMES as GENDER_LABELS } from '../../data/ids/species';

/**
 * A one-line summary of a catch: the species name plus the details
 * that separate two of the same species at a glance. The auction board
 * shows a lot the same way a player sees their own pokemon
 */
export function describeCatch(caught: CaughtPokemon): string {
  // An egg is listed as an egg and nothing more: the species inside
  // is already decided, and showing it here would give it away
  if (isEgg(caught)) {
    return `Egg · ${caught.steps} / ${caught.hatchSteps} steps`;
  }

  const { name } = getSpeciesData(caught.species);
  const shiny = isShiny(caught) ? '✦ ' : '';
  // What it is carrying out of its last fight, since that is what
  // decides whether it can be brought into the next one
  const hurt =
    caught.health < getMaxHealth(caught) ? ` · ${caught.health}/${getMaxHealth(caught)} HP` : '';
  const carried = unpackStatuses(caught.statuses)
    .map((status) => ` · ${STATUS_NAMES[status]}`)
    .join('');
  const condition = isFainted(caught) ? ' · fainted' : `${hurt}${carried}`;

  return `${shiny}${name} · Lv. ${caught.level}${condition}`;
}

/**
 * How far along an egg's walk is, as a fraction. An egg written
 * before the walk existed has nowhere to be, and counts as ready
 */
function hatchProgress(caught: CaughtPokemon): number {
  return caught.hatchSteps <= 0 ? 1 : Math.min(1, caught.steps / caught.hatchSteps);
}

/**
 * A catch as a square of the box: what is drawn on it, and the line it
 * is named by when the pointer rests on it
 */
export function asBoxEntry([id, caught]: [string, CaughtPokemon]): BoxEntry {
  return {
    id,
    species: caught.species,
    shiny: !isEgg(caught) && isShiny(caught),
    egg: isEgg(caught),
    progress: hatchProgress(caught),
    fainted: isFainted(caught),
    label: describeCatch(caught),
  };
}
