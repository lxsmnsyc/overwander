import { requireUid } from '../server/auth';
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

/**
 * The player's last position, or null when they have never walked
 * anywhere — a new player is placed by `pickStartPosition` instead
 */
export async function getPosition(uid: string): Promise<PositionRecord | null> {
  const { data } = await getSupabase()
    .from('positions')
    .select('player, chunk_x, chunk_y, cell_x, cell_y, moved_at')
    .eq('player', uid)
    .maybeSingle();

  if (data == null) {
    return null;
  }

  const row = asRecord(data);

  return asPositionRecord({
    player: row.player,
    chunkX: row.chunk_x,
    chunkY: row.chunk_y,
    cellX: row.cell_x,
    cellY: row.cell_y,
    movedAt: row.moved_at,
  });
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
  return watchRow('positions', `player=eq.${uid}`, async () => getPosition(uid), onChange);
}

/**
 * Remember where the player is standing. Called as they walk, every
 * few seconds rather than every step, since a step is a keypress and
 * a write is a write.
 *
 * Answers with the stamp it was written under. The caller keeps it so
 * it can tell its own write from somebody else's when the row comes
 * back around the subscription
 */
export async function savePosition(
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
): Promise<number> {
  return savePositionOnServer(await getIdToken(), chunkX, chunkY, cellX, cellY);
}

async function savePositionOnServer(
  token: string,
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
): Promise<number> {
  'use server';
  return savePositionOnServerSide(
    await requireUid(token),
    chunkX,
    chunkY,
    cellX,
    cellY,
    await syncServerClock(),
  );
}
