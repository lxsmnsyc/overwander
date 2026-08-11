import { isRecord } from './__normalize';
import { BAG_COLLECTION } from './collections';

/**
 * Everything a player is carrying, in one document.
 *
 * A bag and a candy pile are the same thing twice — how many of each
 * of something a player has — and both were a collection of one small
 * row per thing. That shape is what a document is for, so they are one
 * document now: `bags/{uid}`, holding a map per kind, keyed by the id
 * of the thing and valued by how many.
 *
 * ```
 * bags/{uid} = { items: { "114": 3, "10007": 1 }, candies: { "0": 12 } }
 * ```
 *
 * The point is the read. Every picker in the game — the catch sheet,
 * the vendor, the safari, the auction board — opens by reading the
 * whole bag, and a row per thing billed a read per **kind carried**,
 * a number that grows with the player's collection forever. One
 * document is one read, however much they own, and the bag and the
 * candies arrive together instead of as two queries.
 *
 * What it costs is that a player's whole bag is one document, so their
 * writes queue behind each other. That is self-contention — nobody
 * else writes your bag — and it is why anything handing over several
 * kinds at once does it in **one** write rather than one per kind.
 *
 * The maps are deliberately left out of the index: a key per item id
 * would be an index entry per item id, and nothing asks the store
 * which players hold a Master Ball
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
 * The document a player's bag lives at, one per player
 */
export function bagId(uid: string): string {
  return uid;
}

export { BAG_COLLECTION };

/**
 * One map as stored: how many of each thing, keyed by its id written
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
