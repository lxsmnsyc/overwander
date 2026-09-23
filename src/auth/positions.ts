import { WORLD_GENERATION } from '../overworld/current';
import type { Depth } from '../overworld/depth';
import { requireUid } from '../server/auth';
import check, {
  CELL_COORDINATE,
  CHUNK_COORDINATE,
  COUNT,
  DEPTH,
  OFFSET,
  TOKEN,
  UID,
} from '../server/validate';
import { type WalkReport, recordSteps } from '../server/eggs';
import savePositionOnServerSide, { markBiomeStoodIn, readPosition } from '../server/positions';
import { syncServerClock } from './clock';
import { getLocalOffset } from './local-time';
import getSupabase, { type Unwatch, watchRow } from './supabase';
import { asNumber, asRecord } from './__normalize';
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
 * Write the row itself, through the definer function rather than the
 * server: it is the commonest write in the game, and a caller can
 * only ever write their own. The stamp is the database's own clock,
 * which is what a device compares its news against
 */
async function writePosition(
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
  depth: Depth,
): Promise<number> {
  // The client carries no generated schema, so the answer is read the
  // way a row is: whatever came back, narrowed here
  const { data, error } = (await getSupabase().rpc('save_position', {
    p_generation: WORLD_GENERATION,
    p_chunk_x: chunkX,
    p_chunk_y: chunkY,
    p_cell_x: cellX,
    p_cell_y: cellY,
    p_depth: depth,
  })) as { data: unknown; error: { message: string } | null };

  if (error != null) {
    throw new Error(error.message);
  }
  return typeof data === 'string' ? Number(data) : asNumber(data);
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
  return writePosition(chunkX, chunkY, cellX, cellY, depth);
}

/*
 * A server function is addressed by its place in this file, so a tab
 * loaded before a deploy calls this one by position. It keeps its
 * slot and its arguments, and writes the row as it always did
 */
export async function savePositionOnServer(
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
  // Paces are the only reason a walk needs the server. Without them
  // the settle is one row, so it goes straight to the database
  if (steps === 0) {
    return { stamp: await writePosition(chunkX, chunkY, cellX, cellY, depth), report: null };
  }
  return settleWalkInZoneOnServer(
    await getIdToken(),
    steps,
    chunkX,
    chunkY,
    cellX,
    cellY,
    depth,
    getLocalOffset(),
  );
}

/** Retired: a tab from before the species day turned locally still calls this slot */
export async function settleWalkOnServer(
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

/**
 * Mark the biome under the player as one they have stood in. It is
 * the one thing about a walk the server has to see, so it is sent by
 * itself and only when the biome changes
 */
export async function visitBiome(chunkX: number, chunkY: number): Promise<void> {
  return visitBiomeOnServer(await getIdToken(), chunkX, chunkY);
}

async function visitBiomeOnServer(token: string, chunkX: number, chunkY: number): Promise<void> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, chunkX);
  check(CHUNK_COORDINATE, chunkY);
  return markBiomeStoodIn(await requireUid(token), chunkX, chunkY);
}

async function settleWalkInZoneOnServer(
  token: string,
  steps: number,
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
  depth: Depth,
  offset: number,
): Promise<{ stamp: number; report: WalkReport | null }> {
  'use server';
  check(TOKEN, token);
  check(COUNT, steps);
  check(CHUNK_COORDINATE, chunkX);
  check(CHUNK_COORDINATE, chunkY);
  check(CELL_COORDINATE, cellX);
  check(CELL_COORDINATE, cellY);
  check(DEPTH, depth);
  check(OFFSET, offset);
  const uid = await requireUid(token);
  const now = await syncServerClock();
  // The paces land first, so a saved position never runs ahead of the egg
  const report = steps > 0 ? await recordSteps(uid, steps, now, offset) : null;
  const stamp = await savePositionOnServerSide(uid, chunkX, chunkY, cellX, cellY, depth, now);

  return { stamp, report };
}
