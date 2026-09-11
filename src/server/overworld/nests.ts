import 'server-only';
import type { EncounterRecord } from '../../auth/encounter-record';
import type { ItemStack } from '../../data/overworld/item-pool';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { grantNestEgg } from '../eggs';
import { getSql } from '../db';
import { Landmark, Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';
import { claim, resolveSnapshot } from './claims';

/** The nests, looked into and then taken */
/**
 * The claim marker one player's visit to one nest, in one half-day
 * window, is written against. Both the peek and the claim name it, so
 * looking and taking cannot disagree about which egg is in question
 */
function nestClaimId(snapshot: ChunkSnapshot, cell: number): string {
  return `${snapshot.groundKey}@${snapshot.nestTimestamp}$nest${cell}`;
}

/**
 * What is lying in a nest, without taking it.
 *
 * Looking is free and writes nothing — the same bargain a lair
 * offers. It exists because an egg is not something to be handed to
 * somebody who has not agreed to carry it: a buddy carries one egg,
 * and taking a second one is a decision about the first.
 *
 * What is **not** answered is which species it is. That is the whole
 * of what an egg is, and the server knowing it is no reason to say it
 */
export async function peekNest(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<NestOffer | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const species = snapshot?.getNests().get(cell);

  if (snapshot == null || species == null) {
    return null;
  }
  const marker = nestClaimId(snapshot, cell);
  const rows = await getSql()`
    select 1 from nest_claims where marker = ${marker} and player = ${uid}
  `;

  return { taken: rows.length > 0 };
}

/**
 * A nest with an egg in it, put to the player before anything is
 * written. There is one field and it is the only one worth knowing:
 * the species is deliberately left out
 */
export interface NestOffer {
  /**
   * Whether this player has already taken this window's egg. The nest
   * still holds one for everybody else — a marker is per player
   */
  taken: boolean;
}

/**
 * Take the egg a nest is holding. A nest keeps to its own half-day
 * window rather than the quarter-hour one the ground turns over on, so
 * the claim marker is stamped with the nest window: one egg per
 * nest, per player, per half day.
 *
 * It is what `peekNest` above offered, agreed to: the peek wrote
 * nothing, so this is still the first and only write, and the marker
 * it takes is the one the peek was reading.
 *
 * The player still has to be standing in the chunk's live window to
 * reach it, which is what the snapshot resolves. Resolves the new
 * egg's catch id, or null when there is nothing lying there
 */
export async function claimNest(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const species = snapshot?.getNests().get(cell);

  if (snapshot == null || species == null) {
    return null;
  }

  const id = nestClaimId(snapshot, cell);

  if (!(await claim('nest_claims', id, { player: uid, species }))) {
    return null;
  }
  await bumpProgress(uid, [[Metric.Landmarks, Landmark.Nest, 1]]);
  return grantNestEgg(uid, snapshot, cell, species, now, offset, locale);
}

/**
 * What a phenomenon yielded: an item that already landed in the bag,
 * the encounter the player now stands in, or — a grotto alone — the
 * egg it was hiding
 */
export type PhenomenonClaim =
  | { kind: 'item'; items: ItemStack[] }
  | { kind: 'encounter'; encounter: EncounterRecord }
  | { kind: 'egg'; catchId: string };
