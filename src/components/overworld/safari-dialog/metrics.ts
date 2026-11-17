import type { Items } from '../../../data/ids/items';
import { Genders } from '../../../data/ids/species';
import { FEED_CATCH_BONUS, SafariState, ThrowResult } from '../../../overworld/safari';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * Whether the item is something the encounter would eat
 */
export function isTreat(item: Items): boolean {
  return FEED_CATCH_BONUS[item] != null;
}

/**
 * How a gender is shown beside a level. Something genderless says
 * nothing rather than saying so: an empty column is not information
 */
export const GENDER_MARKS: Record<Genders, string> = {
  [Genders.Genderless]: '',
  [Genders.Male]: '♂',
  [Genders.Female]: '♀',
};

export const THROW_MESSAGES: Record<ThrowResult, () => string> = {
  [ThrowResult.Caught]: m.safari_throw_caught,
  [ThrowResult.BrokeFree]: m.safari_throw_broke_free,
  [ThrowResult.Fled]: m.safari_throw_fled,
};

/** How large the held item is drawn in its badge */
export const HELD_SPRITE = 16;

/**
 * How large the ball on the throw button is drawn. It is the label
 * rather than a decoration beside one: the button no longer spells out
 * what is in hand, so it is drawn at a size that can be told from the
 * other balls at a glance
 */
export const THROW_SPRITE = 28;

/** How large the thrown ball is drawn where the pokemon was standing */
export const BALL_SPRITE = 48;

/**
 * How long the ball takes to land, how long one shake of it takes, how
 * long it lies still between shakes, and the beat it is left still
 * before the answer is said.
 *
 * Most of it runs while the catch is being written down, so the player
 * waits little longer than they already do: what changes is that the
 * wait is the ball rocking rather than a static sprite.
 *
 * A shake and the rest after it are one iteration of the keyframes, so
 * the two are split there in the same 2/3 to 1/3 they are here
 */
export const BALL_LAND = 260;
export const BALL_SHAKE = 400;
export const BALL_REST = 200;
export const BALL_SETTLE = 320;

export const STATE_MESSAGES: Record<SafariState, () => string> = {
  [SafariState.Active]: () => '',
  [SafariState.Caught]: m.safari_state_caught,
  [SafariState.Fled]: m.safari_state_fled,
  [SafariState.Exited]: m.safari_state_exited,
};
