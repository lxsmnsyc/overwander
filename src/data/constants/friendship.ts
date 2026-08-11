/**
 * How much a pokemon thinks of the player.
 *
 * It is one number per catch, moved by the things the mainline moves
 * it by since Gen 4: a level taken, a walk shared, and a fight it did
 * not walk out of. What it is worth is deliberately not decided here —
 * friendship is a record of how a pokemon has been kept, and what
 * reads it can grow later.
 *
 * The one rule worth knowing is that every gain shrinks as the number
 * grows: the first hundred points come quickly and the last fifty are
 * a long walk. A pokemon at 255 has been carried, raised and looked
 * after rather than merely levelled.
 */

export const MAX_FRIENDSHIP = 255;

/**
 * What a pokemon thinks of a stranger who has just caught it
 */
export const BASE_FRIENDSHIP = 70;

/**
 * What hatches out of an egg somebody carried themselves. It is
 * higher than a catch's because the walking has already happened —
 * the egg was carried every step of the way
 */
export const HATCHED_FRIENDSHIP = 120;

/**
 * How far a buddy walks between one point of friendship and the next
 */
export const FRIENDSHIP_STEP_INTERVAL = 256;

/**
 * What moved it: a level taken, a walk shared, a berry that tasted
 * bitter but did the pokemon good, or a faint
 */
export type FriendshipCause = 'level' | 'walk' | 'berry' | 'faint';

/**
 * The three bands every gain is read out of, low to high. A pokemon
 * that already thinks well of the player is harder to impress and no
 * easier to disappoint
 */
const GAINS: Record<FriendshipCause, [low: number, mid: number, high: number]> = {
  level: [5, 3, 2],
  walk: [2, 2, 1],
  berry: [10, 5, 2],
  faint: [-1, -1, -1],
};

function band(current: number): 0 | 1 | 2 {
  if (current < 100) {
    return 0;
  }
  return current < 200 ? 1 : 2;
}

/**
 * The friendship a pokemon has after something happened to it, held
 * inside what a friendship can be
 */
export function gainFriendship(current: number, cause: FriendshipCause, times = 1): number {
  const step = GAINS[cause][band(current)];

  return Math.max(0, Math.min(MAX_FRIENDSHIP, current + step * Math.max(0, Math.floor(times))));
}

/**
 * What a grooming leaves a pokemon thinking: half of whatever it had
 * left to give.
 *
 * It is the daycare lady's bargain, made on the pokemon instead of on
 * the egg — half of the remainder, so it is worth most to a pokemon
 * that has just been caught and almost nothing to one that is already
 * inseparable. Gold buys the first half of a friendship quickly and
 * can never buy the last of it, which is what keeps a walk worth
 * taking
 */
export function groomedFriendship(friendship: number): number {
  const held = Math.max(0, Math.min(MAX_FRIENDSHIP, Math.floor(friendship)));

  return held + Math.floor((MAX_FRIENDSHIP - held) / 2);
}

/**
 * What to call it, for a record that says how a pokemon has been kept
 * rather than printing a number out of 255
 */
export function describeFriendship(friendship: number): string {
  if (friendship >= 220) {
    return 'inseparable';
  }
  if (friendship >= 150) {
    return 'devoted';
  }
  if (friendship >= 100) {
    return 'warming to you';
  }
  return friendship >= 70 ? 'used to you' : 'wary';
}
