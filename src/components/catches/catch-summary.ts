import type { CaughtPokemon } from '../../auth/caught';
import { Acquisition, catchAura, isFavorite, isGuarded, isShiny } from '../../model/caught-record';
import { isEgg } from '../../model/egg';
import { getMaxHealth, getStatusName, isFainted } from '../../model/health';
import { describeFriendship } from '../../data/constants/friendship';
import { Genders } from '../../data/ids/species';
import { unpackStatuses } from '../../data/ids/status';
import { getSpeciesData } from '../../data/species';
import { m } from '../../i18n/paraglide/messages.js';
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

/** A gender said in words, for the reader who cannot see the mark */
export const GENDER_LABELS: Record<Genders, () => string> = {
  [Genders.Genderless]: m.catch_gender_genderless,
  [Genders.Male]: m.catch_gender_male,
  [Genders.Female]: m.catch_gender_female,
};

/** How a pokemon came into an owner's hands, as its history says it */
export const ACQUISITION_LABELS: Record<Acquisition, () => string> = {
  [Acquisition.Caught]: m.catch_got_caught,
  [Acquisition.Egg]: m.catch_got_egg,
  [Acquisition.Auction]: m.catch_got_auction,
  [Acquisition.Trade]: m.catch_got_trade,
  [Acquisition.Gift]: m.catch_got_gift,
  [Acquisition.Revived]: m.catch_got_revived,
  [Acquisition.Shed]: m.catch_got_shed,
};

/** The friendship bands `describeFriendship` names, said in the player's language */
const FRIENDSHIP_LABELS = new Map<string, () => string>([
  ['inseparable', m.catch_friendship_inseparable],
  ['devoted', m.catch_friendship_devoted],
  ['warming to you', m.catch_friendship_warming],
  ['used to you', m.catch_friendship_used],
  ['wary', m.catch_friendship_wary],
]);

/** How a pokemon thinks of its owner, in words rather than a number out of 255 */
export function sayFriendship(friendship: number): string {
  const band = describeFriendship(friendship);

  return FRIENDSHIP_LABELS.get(band)?.() ?? band;
}

/**
 * A one-line summary of a catch: the species name plus the details
 * that separate two of the same species at a glance. The auction board
 * shows a lot the same way a player sees their own pokemon
 */
export function describeCatch(caught: CaughtPokemon): string {
  // An egg is listed as an egg and nothing more: the species inside
  // is already decided, and showing it here would give it away
  if (isEgg(caught)) {
    return m.catch_egg_steps({ steps: caught.steps, hatch: caught.hatchSteps });
  }

  const { name } = getSpeciesData(caught.species);
  const shiny = isShiny(caught) ? '✦ ' : '';
  // The mark on the square said in words, since a line read aloud
  // carries no icons
  const aura = catchAura(caught);
  const stands =
    aura == null ? '' : ` · ${aura === 'shadow' ? m.catch_aura_shadow() : m.catch_aura_purified()}`;
  // What it is carrying out of its last fight, since that is what
  // decides whether it can be brought into the next one
  const hurt =
    caught.health < getMaxHealth(caught)
      ? ` · ${m.catch_hp({ health: caught.health, max: getMaxHealth(caught) })}`
      : '';
  let carried = '';

  for (const status of unpackStatuses(caught.statuses)) {
    carried += ` · ${getStatusName(status)}`;
  }
  const condition = isFainted(caught) ? ` · ${m.pick_team_fainted()}` : `${hurt}${carried}`;

  return `${shiny}${m.catch_name_level({ name, level: caught.level })}${stands}${condition}`;
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
    female: !isEgg(caught) && caught.gender === Genders.Female,
    egg: isEgg(caught),
    progress: hatchProgress(caught),
    fainted: isFainted(caught),
    // An egg says nothing about what is in it, a shadow included
    aura: isEgg(caught) ? undefined : catchAura(caught),
    locked: isGuarded(caught),
    favorite: isFavorite(caught),
    // An egg has neither yet, and its walk is the bar it draws instead
    ...(isEgg(caught)
      ? {}
      : { level: caught.level, health: caught.health / Math.max(1, getMaxHealth(caught)) }),
    ...(caught.slot == null ? {} : { slot: caught.slot }),
    label: describeCatch(caught),
  };
}
