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

import { Balls } from '../ids/items';

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
 * What a shadow arrives thinking of anybody, however it arrived. It
 * has been made to fight and nothing else, so it starts from nothing
 * and no groomer will take one: everything a shadow thinks of its
 * owner has to be walked for
 */
export const SHADOW_FRIENDSHIP = 0;

/**
 * What purifying hands back: the base arrival a shadow never got, on
 * top of whatever it has since earned. A pokemon put right stands
 * where a fresh catch stands and keeps every step it walked as a
 * shadow
 */
export const PURIFIED_FRIENDSHIP_BONUS = BASE_FRIENDSHIP;

export function purifiedFriendship(friendship: number): number {
  return Math.min(MAX_FRIENDSHIP, Math.max(0, friendship) + PURIFIED_FRIENDSHIP_BONUS);
}

/**
 * What a pokemon has to think of the player before a friendship
 * evolution is offered. It is the mainline's Gen 2 number, and it is
 * also where `describeFriendship` starts saying "inseparable"
 */
export const EVOLUTION_FRIENDSHIP = 220;

/**
 * How far a buddy walks between one point of friendship and the next
 */
export const FRIENDSHIP_STEP_INTERVAL = 256;

/**
 * What moved it: a level taken, a walk shared, a berry that tasted
 * bitter but did the pokemon good, a mouthful of herbal medicine, or
 * a faint
 */
export type FriendshipCause = 'level' | 'walk' | 'berry' | 'herb' | 'faint';

/**
 * The three bands every gain is read out of, low to high. A pokemon
 * that already thinks well of the player is harder to impress and no
 * easier to disappoint.
 *
 * A **herb** is the one loss that grows with the band, and it is the
 * mainline's own asymmetry: a pokemon that barely knows the player
 * swallows something horrible and shrugs, while one that trusted them
 * takes it as a betrayal
 */
const GAINS: Record<FriendshipCause, [low: number, mid: number, high: number]> = {
  level: [5, 3, 2],
  walk: [2, 2, 1],
  berry: [10, 5, 2],
  herb: [-5, -5, -10],
  faint: [-1, -1, -1],
};

function band(current: number): 0 | 1 | 2 {
  if (current < 100) {
    return 0;
  }
  return current < 200 ? 1 : 2;
}

/**
 * What a pokemon caught in a Luxury Ball makes of everything that
 * happens to it afterwards. The mainline ball is a comfortable one to
 * ride in, and a pokemon that travels comfortably warms to its trainer
 * twice as fast
 */
export const LUXURY_FRIENDSHIP_FACTOR = 2;

/**
 * How fast a pokemon caught in this ball comes round. It is the ball
 * the record was made with rather than anything the player still
 * carries, so it is decided once, at the catch, and holds for the
 * pokemon's whole life
 */
export function friendshipFactor(ball: Balls): number {
  return ball === Balls.LuxuryBall ? LUXURY_FRIENDSHIP_FACTOR : 1;
}

/**
 * The friendship a pokemon has after something happened to it, held
 * inside what a friendship can be.
 *
 * The factor multiplies what it **gains** and never what it loses: a
 * comfortable ball is a reason to think better of somebody, not a
 * reason to take a fainting harder
 */
export function gainFriendship(
  current: number,
  cause: FriendshipCause,
  times = 1,
  factor = 1,
): number {
  const step = GAINS[cause][band(current)];
  const scaled = step > 0 ? step * Math.max(1, Math.floor(factor)) : step;

  return Math.max(0, Math.min(MAX_FRIENDSHIP, current + scaled * Math.max(0, Math.floor(times))));
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
