import LRUMap from '../core/lru-map';
import { readBoxRevisions, readCaughtRevised } from './caught';
import type { CaughtPokemon } from './caught-record';

/**
 * Boxes kept between readings.
 *
 * Every screen that offers a choice of pokemon used to read the whole
 * box each time it opened, and a box of two hundred is a third of a
 * megabyte. Now the first reading is whole and every later one asks
 * only for each catch's revision, then reads in full just the catches
 * that are new or changed. The database raises a revision on any change
 * to a catch or to what is embedded with it, so what is kept is never
 * trusted past the next reading.
 */

/** A catch as kept, with the revision it was read at */
export interface Kept {
  revision: number;
  caught: CaughtPokemon;
}

/** How many owners' boxes are kept: the player's own, and the few they have been looking at */
const KEPT_OWNERS = 4;

const kept = new LRUMap<string, Map<string, Kept>>(KEPT_OWNERS);

/** Which catches have to be read again: new ones, and any whose revision moved */
export function staleIn(held: ReadonlyMap<string, Kept>, revisions: [string, number][]): string[] {
  const stale: string[] = [];

  for (const [id, revision] of revisions) {
    if (held.get(id)?.revision !== revision) {
      stale.push(id);
    }
  }
  return stale;
}

/**
 * The box as it stands, in the order the revisions came in, and what to
 * keep for next time.
 *
 * A stale catch that did not come back was released or traded between
 * the two reads, so it is left out rather than shown as it was. One
 * that came back under another owner is left out for the same reason
 */
export function mergeBox(
  owner: string,
  held: ReadonlyMap<string, Kept>,
  revisions: [string, number][],
  stale: readonly string[],
  fetched: [string, number, CaughtPokemon][],
): { box: [string, CaughtPokemon][]; keep: Map<string, Kept> } {
  const reread = new Set(stale);
  const fresh = new Map<string, Kept>();

  for (const [id, revision, caught] of fetched) {
    if (caught.owner === owner) {
      fresh.set(id, { revision, caught });
    }
  }

  const box: [string, CaughtPokemon][] = [];
  const keep = new Map<string, Kept>();

  for (const [id] of revisions) {
    const one = reread.has(id) ? fresh.get(id) : held.get(id);

    if (one != null) {
      keep.set(id, one);
      box.push([id, one.caught]);
    }
  }
  return { box, keep };
}

/**
 * Every pokemon an owner holds, as id-record pairs in id order.
 *
 * Two readings at once are not merged into one: a reading asked for
 * after a write must not be answered by one that started before it.
 * Whichever lands last is what is kept, and if that is the older one
 * its revisions are behind and the next reading fetches those again
 */
export default async function readBox(owner: string): Promise<[string, CaughtPokemon][]> {
  const revisions = await readBoxRevisions(owner);
  const held = kept.get(owner) ?? new Map<string, Kept>();
  const stale = staleIn(held, revisions);
  const fetched = stale.length === 0 ? [] : await readCaughtRevised(stale);
  const { box, keep } = mergeBox(owner, held, revisions, stale, fetched);

  kept.set(owner, keep);
  return box;
}

/** Drop every kept box, for a sign-out */
export function forgetBoxes(): void {
  kept.clear();
}
