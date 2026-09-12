import { requireUid } from '../server/auth';
import useEscapeRopeOnServer from '../server/escape-rope';
import type { PositionRecord } from './position-record';
import { syncServerClock } from './clock';
import getIdToken from './session';

/**
 * The rope out of a cave. Thin, because all of it is the server's.
 * What comes back is where they are standing now, which the board
 * picks up as news the way it picks up a teleport
 */
export default async function useEscapeRope(): Promise<PositionRecord | null> {
  return useOnServer(await getIdToken());
}

async function useOnServer(token: string): Promise<PositionRecord | null> {
  'use server';
  return useEscapeRopeOnServer(await requireUid(token), await syncServerClock());
}
