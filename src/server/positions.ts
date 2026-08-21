import 'server-only';
import {
  type PositionRecord,
  asCellCoordinate,
  asChunkCoordinate,
  asPositionRecord,
} from '../auth/position-record';
import { getSql } from './db';

/**
 * Where a player is, written with admin credentials.
 *
 * It is written here rather than by the browser for the ordinary
 * reason: a client that could write this row could write anybody
 * else's. What it is *not* is checked: the position is the player's
 * own report of themselves, clamped to somewhere that exists.
 *
 * That is deliberate, and it does not weaken anything. Nothing in the
 * game trusts a position: reaching a landmark is checked against the
 * landmark and its window, a spawn against the store, a portal against
 * the chunk seed. A player who lies about where they are stands
 * somewhere they are not and finds exactly what is there
 */

/**
 * Remember where the player is standing. Stamped as it is written, so
 * a later look can tell a stale record from a fresh one
 */
export default async function savePosition(
  uid: string,
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
  now: number,
): Promise<void> {
  await getSql()`
    insert into positions (player, chunk_x, chunk_y, cell_x, cell_y, moved_at)
    values (${uid}, ${asChunkCoordinate(chunkX)}, ${asChunkCoordinate(chunkY)},
            ${asCellCoordinate(cellX)}, ${asCellCoordinate(cellY)}, ${now})
    on conflict (player) do update set
      chunk_x = excluded.chunk_x, chunk_y = excluded.chunk_y,
      cell_x = excluded.cell_x, cell_y = excluded.cell_y,
      moved_at = excluded.moved_at
  `;
}

/**
 * Where anybody is standing, or null for a player who has never
 * walked. It is read here rather than from a browser because the
 * policy lets a player read only their own, which is right for a table
 * a client could otherwise sweep and wrong for the profile a lobby
 * opens
 */
export async function readPosition(uid: string): Promise<PositionRecord | null> {
  const rows = await getSql()`
    select player, chunk_x as "chunkX", chunk_y as "chunkY",
           cell_x as "cellX", cell_y as "cellY", moved_at as "movedAt"
    from positions where player = ${uid}
  `;

  return rows.at(0) == null ? null : asPositionRecord(rows[0]);
}
