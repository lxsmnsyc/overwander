import { WORLD_GENERATION } from '../overworld/current';
import type { Depth } from '../overworld/depth';
import { requireUid } from '../server/auth';
import check, {
  CELL_COORDINATE,
  CHUNK_COORDINATE,
  COUNT,
  DEPTH,
  TOKEN,
  UID,
} from '../server/validate';
import { type WalkReport, recordSteps } from '../server/eggs';
import savePositionOnServerSide, { readPosition } from '../server/positions';
import { syncServerClock } from './clock';
import getSupabase, { type Unwatch, watchRow } from './supabase';
import { asRecord } from './__normalize';
import { type PositionRecord, asPositionRecord } from './position-record';
import getIdToken from './session';

export type { PositionRecord } from './position-record';

/**
 * Where the player was when they last put the game down.
 *
 * The overworld derives everything else it holds, so this is the one
 * thing about a player's place in the world that has to be kept: a
 * walk of forty chunks, or a Portal Key spent crossing it, should
 * survive a reload.
 */

/** A positions row in the record shape. The change stream may send the bigint stamp as a string */
function fromPositionRow(row: Record<string, unknown>): PositionRecord {
  return asPositionRecord({
    player: row.player,
    chunkX: row.chunk_x,
    chunkY: row.chunk_y,
    cellX: row.cell_x,
    cellY: row.cell_y,
    depth: row.depth,
    movedAt: typeof row.moved_at === 'string' ? Number(row.moved_at) : row.moved_at,
  });
}

/**
 * The player's last position, or null when they have never walked
 * anywhere — a new player is placed by `pickStartPosition` instead
 */
export async function getPosition(uid: string): Promise<PositionRecord | null> {
  const { data, error } = await getSupabase()
    .from('positions')
    .select('player, chunk_x, chunk_y, cell_x, cell_y, depth, moved_at')
    .eq('player', uid)
    .eq('generation', WORLD_GENERATION)
    .maybeSingle();

  // Thrown rather than read as "never walked", which would put a start position over the real one
  if (error != null) {
    throw new Error(error.message);
  }
  return data == null ? null : fromPositionRow(asRecord(data));
}

/**
 * Where anybody is standing, read through the server.
 *
 * A player may read their own position row and nobody else's, so
 * a profile opened from a lobby has to ask somebody who can. Signing
 * in is all it takes — where a trainer is standing is as public as
 * their nickname, and it is what the profile is for
 */
export async function getPlayerPosition(uid: string): Promise<PositionRecord | null> {
  return positionOnServer(await getIdToken(), uid);
}

async function positionOnServer(token: string, uid: string): Promise<PositionRecord | null> {
  'use server';
  check(TOKEN, token);
  check(UID, uid);
  await requireUid(token);
  return readPosition(uid);
}

/**
 * Follow the row as it is written, which is how a device learns that
 * the walk has moved to another one. Every screen the player is
 * signed in on writes this row, and each of them watches it
 */
export function watchPosition(
  uid: string,
  onChange: (position: PositionRecord | null) => void,
): Unwatch {
  // A change carries the whole row, so a save is not read back again.
  // The stream cannot filter on two columns, so another world's row is
  // skipped here and read back instead
  return watchRow(
    'positions',
    `player=eq.${uid}`,
    async () => getPosition(uid),
    onChange,
    (row) => (row.generation === WORLD_GENERATION ? fromPositionRow(row) : undefined),
  );
}

/**
 * Remember where the player is standing. Answers the stamp it was
 * written under, so the caller can tell its own write coming back
 * around the subscription
 */
export async function savePosition(
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
  depth: Depth,
): Promise<number> {
  return savePositionOnServer(await getIdToken(), chunkX, chunkY, cellX, cellY, depth);
}

// A server function is addressed by its place in this file, so this one
// keeps its slot and its arguments for tabs loaded before a deploy
async function savePositionOnServer(
  token: string,
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
  depth: Depth,
): Promise<number> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, chunkX);
  check(CHUNK_COORDINATE, chunkY);
  check(CELL_COORDINATE, cellX);
  check(CELL_COORDINATE, cellY);
  check(DEPTH, depth);
  return savePositionOnServerSide(
    await requireUid(token),
    chunkX,
    chunkY,
    cellX,
    cellY,
    depth,
    await syncServerClock(),
  );
}

/**
 * Remember where the player stopped, with the paces walked since the
 * last step report riding the same call.
 *
 * Answers the stamp it was written under, so the caller can tell its own
 * write coming back around the subscription, and what the paces came to
 */
export async function settleWalk(
  steps: number,
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
  depth: Depth,
): Promise<{ stamp: number; report: WalkReport | null }> {
  return settleWalkOnServer(await getIdToken(), steps, chunkX, chunkY, cellX, cellY, depth);
}

async function settleWalkOnServer(
  token: string,
  steps: number,
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
  depth: Depth,
): Promise<{ stamp: number; report: WalkReport | null }> {
  'use server';
  check(TOKEN, token);
  check(COUNT, steps);
  check(CHUNK_COORDINATE, chunkX);
  check(CHUNK_COORDINATE, chunkY);
  check(CELL_COORDINATE, cellX);
  check(CELL_COORDINATE, cellY);
  check(DEPTH, depth);
  const uid = await requireUid(token);
  const now = await syncServerClock();
  // The paces land first, so a saved position never runs ahead of the egg
  const report = steps > 0 ? await recordSteps(uid, steps, now) : null;
  const stamp = await savePositionOnServerSide(uid, chunkX, chunkY, cellX, cellY, depth, now);

  return { stamp, report };
}
