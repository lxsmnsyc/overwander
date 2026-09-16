import { requireUid } from '../server/auth';
import {
  useDig as useDigOnServerSide,
  useTeleport as useTeleportOnServerSide,
} from '../server/field-moves';
import check, { TOKEN } from '../server/validate';
import type { PositionRecord } from './position-record';
import { syncServerClock } from './clock';
import getIdToken from './session';

/**
 * The field moves that move the player, all of it the server's. What
 * comes back is where they stand now, which the board takes up the way
 * it takes up an escape rope
 */

/** Dig out of a cave. Null above ground, or when the buddy cannot learn Dig */
export async function useDig(): Promise<PositionRecord | null> {
  return digOnServer(await getIdToken());
}

async function digOnServer(token: string): Promise<PositionRecord | null> {
  'use server';
  check(TOKEN, token);
  return useDigOnServerSide(await requireUid(token), await syncServerClock());
}

/** Teleport to the nearest town. Null when the buddy cannot learn Teleport or none is near */
export async function useTeleport(): Promise<PositionRecord | null> {
  return teleportOnServer(await getIdToken());
}

async function teleportOnServer(token: string): Promise<PositionRecord | null> {
  'use server';
  check(TOKEN, token);
  return useTeleportOnServerSide(await requireUid(token), await syncServerClock());
}
