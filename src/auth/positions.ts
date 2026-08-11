import { doc, getDoc } from 'firebase/firestore';
import { requireUid } from '../server/firebase';
import savePositionOnServerSide from '../server/positions';
import { syncServerClock } from './clock';
import { POSITION_COLLECTION } from './collections';
import { getFirebaseFirestore } from './firebase';
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
  const snapshot = await getDoc(doc(getFirebaseFirestore(), POSITION_COLLECTION, uid));
  const data = snapshot.data();

  return data == null ? null : asPositionRecord(data);
}

/**
 * Remember where the player is standing. Called as they walk — every
 * few seconds rather than every step, since a step is a keypress and
 * a write is a write
 */
export async function savePosition(
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
): Promise<void> {
  await savePositionOnServer(await getIdToken(), chunkX, chunkY, cellX, cellY);
}

async function savePositionOnServer(
  token: string,
  chunkX: number,
  chunkY: number,
  cellX: number,
  cellY: number,
): Promise<void> {
  'use server';
  await savePositionOnServerSide(
    await requireUid(token),
    chunkX,
    chunkY,
    cellX,
    cellY,
    await syncServerClock(),
  );
}
