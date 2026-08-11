import { PokemonFlags, hasFlag } from '../data/constants/flags';
/**
 * What an egg is, and what hatching one costs.
 *
 * An egg is an ordinary catch record with its species already decided
 * and its `egg` flag still set: everything about the pokemon inside is
 * written the moment the egg is found, so hatching cannot roll a
 * better one than the nest gave. What the record does not do is show
 * it — the dialog hides everything that comes from the species until
 * the flag comes off — and what an egg cannot do is fight.
 *
 * The one thing that moves an egg forward is walking with it. Steps
 * only count while it is the player's buddy, and only at a walking
 * pace: the rules below are shared so the client can show the same
 * progress the server is willing to credit.
 */

/**
 * Every egg hatches at level 1, whatever it hatches into
 */
export const EGG_LEVEL = 1;

/**
 * How far an egg has to be carried. It is half a mainline hatch cycle
 * — far enough that an egg is something a player is still working on
 * tomorrow, near enough that a nest found today is worth walking to
 */
export const EGG_HATCH_STEPS = 2560;

/**
 * The fastest a step may count, in milliseconds. Walking is the
 * client's business — it is the one holding the keyboard — so the
 * server credits reported steps against its own clock instead of
 * believing the count: a client claiming a thousand steps in a second
 * is credited four
 */
export const MIN_STEP_INTERVAL = 250;

/**
 * The most steps one report may carry. A report is sent every few
 * paces, so anything larger is a client saving them up — and the
 * elapsed-time clamp would refuse most of it anyway
 */
export const MAX_STEP_REPORT = 64;

/**
 * The progress fields of a catch, which is all these rules read
 */
export interface EggProgress {
  /**
   * The record's `PokemonFlags`; only the egg bit is read
   */
  flags: number;
  steps: number;
  hatchSteps: number;
}

/**
 * How much further this egg has to be carried; zero once it is ready,
 * and zero for anything that is not an egg
 */
export function stepsRemaining(caught: EggProgress): number {
  return isEgg(caught) ? Math.max(0, caught.hatchSteps - caught.steps) : 0;
}

/**
 * Whether the egg has been carried far enough to hatch. Hatching is
 * still the player's own call — an egg sits ready until they open it,
 * the way an evolution waits for the button
 */
export function canHatch(caught: EggProgress): boolean {
  return isEgg(caught) && caught.steps >= caught.hatchSteps;
}

/**
 * Whether the record is still an egg
 */
export function isEgg(caught: { flags: number }): boolean {
  return hasFlag(caught.flags, PokemonFlags.Egg);
}

/**
 * Where an egg stands after the daycare lady has warmed it: half of
 * what hatching costs, added to wherever it already was. An egg a
 * quarter of the way along comes out three quarters of the way, and
 * one already near the end simply finishes — the boost is a share of
 * the requirement, not a place to move it to
 */
export function boostedSteps(caught: EggProgress): number {
  return Math.min(caught.hatchSteps, caught.steps + Math.floor(caught.hatchSteps / 2));
}

/**
 * How many of the reported steps actually count: no more than were
 * reported, no more than the elapsed time could have been walked in,
 * and no more than the egg still has left to go
 */
export function creditableSteps(reported: number, elapsed: number, remaining: number): number {
  if (reported <= 0 || elapsed <= 0 || remaining <= 0) {
    return 0;
  }
  return Math.min(
    Math.min(reported, MAX_STEP_REPORT),
    Math.floor(elapsed / MIN_STEP_INTERVAL),
    remaining,
  );
}
