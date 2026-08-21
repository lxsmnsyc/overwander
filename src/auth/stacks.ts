import { isRecord } from './__normalize';

/**
 * Everything a player is carrying, read as one shape.
 *
 * Items live in `bag_items` and candies in `bag_candies`, a row per
 * kind. A reader collapses its rows into a map keyed by the id of the
 * thing, which is what every picker in the game wants
 */

/**
 * Which map a kind of stack lives in
 */
export interface StackSpec {
  field: 'items' | 'candies';
}

export const ITEM_STACKS: StackSpec = { field: 'items' };
export const CANDY_STACKS: StackSpec = { field: 'candies' };

/**
 * The player a bag belongs to; a bag has no id of its own
 */
export function bagId(uid: string): string {
  return uid;
}

/**
 * One map as read: how many of each thing, keyed by its id written
 * out. Anything that is not a count is left out rather than read as
 * zero of something
 */
export type StackMap = Record<string, number>;

/**
 * The map a spec names, restored. A bag that was never written, or a
 * kind nothing has ever been put in, reads as empty
 */
export function asStackMap(bag: unknown, spec: StackSpec): StackMap {
  const data = isRecord(bag) ? bag : {};
  const map = data[spec.field];

  if (!isRecord(map)) {
    return {};
  }

  const held: StackMap = {};

  for (const [key, count] of Object.entries(map)) {
    if (typeof count === 'number' && count > 0) {
      held[key] = count;
    }
  }
  return held;
}

/**
 * How many of one thing the bag holds. A key that was never written
 * is nothing held, which is what it means
 */
export function getStack(bag: unknown, spec: StackSpec, key: number): number {
  return asStackMap(bag, spec)[String(key)] ?? 0;
}

/**
 * Everything of that kind the bag holds, as id-count pairs. Nothing
 * is listed at zero: a stack spent to its last is taken out of the
 * map rather than left sitting at nothing
 */
export function listStacks(bag: unknown, spec: StackSpec): [number, number][] {
  return Object.entries(asStackMap(bag, spec)).map(([key, count]) => [Number(key), count]);
}
