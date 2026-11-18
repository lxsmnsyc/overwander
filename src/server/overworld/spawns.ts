import 'server-only';
import type { Depth } from '../../overworld/depth';
import { type EncounterRecord, asEncounterRecord } from '../../model/encounter-record';
import type { Spawn } from '../../overworld/chunk-snapshot';
import ChunkSnapshot from '../../overworld/chunk-snapshot';
import { checkMeeting } from '../../overworld/spawn-life/lifetimes';
import { asOffset, toLocalTime } from '../../model/local-time';
import getWorld, { WORLD_GENERATION } from '../../overworld/current';
import stageEncounter, { type StagedOptions } from '../../overworld/encounter/stage';
import type { Items } from '../../data/ids/items';
import { encounterKey, encounterWindow } from '../../overworld/safari';
import createOverworld from '../../overworld/setup';
import type { Buddy } from '../../overworld/core';
import resolveBuddy from '../buddy';
import { getSql, tx } from '../db';
import { readEncounter, writeEncounter } from '../encounter-io';
import { grantItem } from '../inventory';
import { recordSeenSpecies } from '../pokedex';

/** Meeting one wild pokemon, and letting it go */

/**
 * Stage a meeting: the per-player derivation is written to
 * encounters/{spawnId}:{uid} on first interaction and returned as-is
 * afterwards, so re-entering a meeting cannot re-roll it into
 * something better
 */
export async function startEncounter(
  uid: string,
  snapshot: ChunkSnapshot,
  id: string,
  spawn: Spawn,
  options: StagedOptions,
  /**
   * The buddy the caller has already looked up. Undefined means it has
   * not been asked for and this will ask; null is a player who has
   * none. Resolving one costs two round trips, and a caller that
   * needed it for a check of its own should not pay twice
   */
  resolved?: Buddy | null,
): Promise<EncounterRecord> {
  const existing = await readEncounter(id, uid);

  if (existing != null) {
    return asEncounterRecord(existing);
  }

  const record = stageEncounter(
    uid,
    snapshot,
    id,
    spawn,
    resolved === undefined ? await resolveBuddy(uid) : resolved,
    options,
  );

  await tx(async (transaction) => writeEncounter(transaction, record));
  // Met, whatever becomes of the meeting: the dex counts what a player
  // has laid eyes on, so one that flees or is walked away from is
  // still one they have seen. The early return above is what keeps a
  // meeting walked back into from being counted twice
  await recordSeenSpecies(uid, record.species, record.shiny);
  return record;
}

/**
 * Meet one of the chunk's pokemon. What stands there is derived from
 * the chunk, the zone and the server's own clock, never taken from the
 * caller: the id says which cycle of which slot is meant, and the
 * individual value and the cell the client names must match the roll
 * and the pokemon's place within the allowance, or the tab was
 * deriving something else and the meeting is refused
 */
export async function meetSpawn(
  uid: string,
  x: number,
  y: number,
  spawnId: string,
  now: number,
  offset: number,
  depth: Depth,
  cell: number,
  individualValue: number,
): Promise<EncounterRecord | null> {
  const chunk = getWorld(depth).getChunk(x, y);
  const zone = asOffset(offset);
  const live = checkMeeting(chunk, zone, spawnId, individualValue, cell, toLocalTime(now, zone));

  if (live == null) {
    return null;
  }

  // The meeting is staged at the start of the slot's cycle, which is
  // what the board's key for the fled table is built from too
  const snapshot = new ChunkSnapshot(chunk, live.cycle.start, zone);

  return startEncounter(uid, snapshot, live.id, live.spawn, { cell });
}

/**
 * Take a spawn out of what this player is shown, for as long as the
 * cycle that staged it lasts.
 *
 * Two things retire one, and they look the same from the map's side:
 * a pokemon that **ran off**, and one that was **caught**. Neither is
 * standing there any more for the player it happened to, and both
 * leave it standing for everybody else. The spawn belongs to the
 * shared slot, so what changes is only what this player is drawn.
 *
 * The key is recomputed from the stored encounter rather than taken
 * from the caller, so a player cannot retire a meeting they never had.
 * Resolves whether this call is what retired it
 */
export async function retireSpawn(uid: string, spawnId: string): Promise<boolean> {
  const stored = await readEncounter(spawnId, uid);

  return stored == null ? false : retireEncounter(uid, asEncounterRecord(stored));
}

/** `retireSpawn` for a caller already holding the stored encounter, such as a catch */
export async function retireEncounter(uid: string, encounter: EncounterRecord): Promise<boolean> {
  const key = encounterKey(encounter);
  // What comes back says whether this is the first time: a meeting
  // already retired pays nothing a second time, which is what stops a
  // client reporting the same flight over and over
  const rows = await getSql()`
    insert into fled_encounters (player, generation, key, window_at)
    values (${uid}, ${WORLD_GENERATION}, ${key}, ${encounterWindow(key)})
    on conflict do nothing
    returning key
  `;

  return rows.length > 0;
}

/**
 * Take what a meeting that ran off was carrying.
 *
 * Only a buddy that picks pockets comes away with anything, and only
 * where the meeting was holding something in the first place. It is
 * read from the stored encounter rather than from the caller, so what
 * is paid out is what the world actually staged
 */
export async function pocketFled(uid: string, spawnId: string): Promise<Items | null> {
  const stored = await readEncounter(spawnId, uid);

  if (stored == null) {
    return null;
  }

  const encounter = asEncounterRecord(stored);
  const item = encounter.items.at(0);

  if (item == null) {
    return null;
  }

  const overworld = createOverworld(uid, await resolveBuddy(uid));

  if (!overworld.checkPockets(spawnId)) {
    return null;
  }
  await grantItem(uid, item);
  return item;
}

/**
 * How long a fled encounter is remembered for.
 *
 * What it has to outlive is the window that staged it: the spawn is
 * gone when the window turns over, so a key from an older one can
 * never match anything again. The allowance is an hour rather than
 * one window, because the windows are **local** — a player who
 * crosses a zone reads a clock offset from the one their last key was
 * written against, and an hour is more than any of that is worth
 * arguing about.
 *
 * The hourly sweep in the schema is what actually forgets them;
 * readers filter by this figure, so a sweep that has not run yet
 * changes nothing they see
 */
export const FLED_MEMORY = 60 * 60 * 1000;
