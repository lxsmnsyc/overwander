import 'server-only';
import type Npc from '../../data/overworld/npc';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { getSql } from '../db';
import { isRefusal } from '../../auth/learn-refusal';
import { claim, resolveSnapshot } from '../overworld';
import { Metric } from '../../auth/quest-record';
import { bumpProgress } from '../quest-progress';

/**
 * One player at a time at a counter: a visit is taken before the
 * work and released after, so two clicks cannot buy the same thing
 * twice
 */
/**
 * Count a served visit for the quests, passing the answer through:
 * the bridges wrap their server calls in this so every wanderer's
 * yes lands on the same counter
 */
export async function countVisit<T>(uid: string, npc: Npc, served: T): Promise<T> {
  // A refusal is not a visit. The two who take a scale answer with the
  // rule that turned the player away rather than with nothing at all,
  // and a counter that took those would count walking up as a lesson
  if (served != null && !isRefusal(served)) {
    await bumpProgress(uid, [[Metric.NpcVisits, npc, 1]]);
  }
  return served;
}

/**
 * The people a player meets at a wandering-NPC cell, and what they do.
 *
 * Who is standing there is re-derived from the chunk, zone and window
 * before anything happens, so asking the wrong NPC — or any NPC from a
 * cell that has none — is refused rather than paid for.
 *
 * **Each serves a player once per window**, the vendor aside: a marker
 * in `npcClaims` records the visit, and it is taken only where the
 * visit lands and given back if the write fails. The vendor takes no
 * marker — his crate and the player's purse are the whole limit.
 *
 * The two that charge take gold after the visit is claimed and put it
 * back if nothing was written: charged and given nothing is worse than
 * refused.
 */

/**
 * Who is standing at the cell this window, or null when the player is
 * not at a live window, the cell holds no wandering NPC, or somebody
 * else is standing there
 */
export async function resolveNpc(
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  expected: Npc,
): Promise<ChunkSnapshot | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const standing = snapshot?.getStandingNpc(cell);

  return snapshot != null && standing === expected ? snapshot : null;
}

/**
 * Take this window's visit with whoever is standing at the cell.
 *
 * The marker is per NPC, cell, window and player, so walking to
 * another wandering cell finds somebody who has not seen you yet —
 * that walk is what a second egg costs. It is taken as late as the
 * call can manage, once the visit is known to be one that will land,
 * so a refusal never spends it.
 *
 * Resolves the marker's id, or null when this player has already been
 * seen here this window
 */
export async function takeVisit(
  snapshot: ChunkSnapshot,
  tag: string,
  cell: number,
  uid: string,
  record: Record<string, unknown> = {},
): Promise<string | null> {
  const id = snapshot.visitMarker(tag, cell);

  return (await claim('npc_claims', id, { player: uid, ...record })) ? `${id}:${uid}` : null;
}

/**
 * Give the visit back. What it was taken for did not happen, so the
 * window should not be spent on it
 */
export async function releaseVisit(id: string): Promise<void> {
  // The id carries the player after the last ':'; the row is the
  // marker and that player
  const at = id.lastIndexOf(':');

  await getSql()`
    delete from npc_claims
    where marker = ${id.slice(0, at)} and player = ${id.slice(at + 1)}
  `;
}
