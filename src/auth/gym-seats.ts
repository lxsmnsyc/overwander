import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { requireUid } from '../server/auth';
import {
  type GymSeatResult,
  type GymSeatView,
  challengeGymSeat as challengeOnServer,
  enterGymSeat as enterOnServer,
  leaveGymSeat as leaveOnServer,
  listHeldSeats as listOnServer,
  settleGymChallenge as settleOnServer,
  takeGymSeat as takeOnServer,
} from '../server/gym-seats';
import { syncServerClock } from './clock';
import type { GymSeatRecord } from './gym-seat-record';
import getIdToken from './session';

export type { GymSeatRecord, GymSeatStanding } from './gym-seat-record';
export type { GymSeatResult, GymSeatView } from '../server/gym-seats';

/**
 * Gym seats as the client asks for them. Every one of these is a thin
 * wrapper over [`src/server/gym-seats.ts`](../server/gym-seats.ts):
 * who holds a seat and whether a challenge took it are the server's
 * to decide, since the holder is not there to speak for themselves.
 */

/**
 * Walk up to a seat. Resolves who is holding it, null for one nobody
 * has taken, or `'absent'` when the cell stages no seat
 */
export async function enterGymSeat(snapshot: ChunkSnapshot, cell: number): Promise<GymSeatView> {
  return enterSeatOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
  );
}

async function enterSeatOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
): Promise<GymSeatView> {
  'use server';
  // Personalised: who is asking decides what the cooldown, the daily
  // take and the ousted bar come to
  return enterOnServer(await requireUid(token), x, y, cell, await syncServerClock(), offset);
}

/**
 * Leave a team standing on an empty seat, or restage the one already
 * standing on this player's own
 */
export async function takeGymSeat(
  snapshot: ChunkSnapshot,
  cell: number,
  catches: string[],
): Promise<GymSeatRecord | null> {
  return takeSeatOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    catches,
    snapshot.offset,
  );
}

async function takeSeatOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  catches: string[],
  offset: number,
): Promise<GymSeatRecord | null> {
  'use server';
  return takeOnServer(
    await requireUid(token),
    x,
    y,
    cell,
    catches,
    await syncServerClock(),
    offset,
  );
}

/**
 * Give up a seat this player is holding
 */
export async function leaveGymSeat(snapshot: ChunkSnapshot, cell: number): Promise<boolean> {
  return leaveSeatOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
  );
}

async function leaveSeatOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
): Promise<boolean> {
  'use server';
  return leaveOnServer(await requireUid(token), x, y, cell, await syncServerClock(), offset);
}

/**
 * Fight the party standing on a seat. Resolves the battle id — the
 * fight already under way, if there is one — or null when the
 * challenge cannot be taken
 */
export async function challengeGymSeat(
  snapshot: ChunkSnapshot,
  cell: number,
  catches: string[],
): Promise<string | null> {
  return challengeSeatOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    catches,
    snapshot.offset,
  );
}

async function challengeSeatOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  catches: string[],
  offset: number,
): Promise<string | null> {
  'use server';
  return challengeOnServer(
    await requireUid(token),
    x,
    y,
    cell,
    catches,
    await syncServerClock(),
    offset,
  );
}

/**
 * Settle a challenge whose fight has ended. A win moves the seat; a
 * loss adds to the stand the holder is keeping
 */
export async function settleGymChallenge(seat: string): Promise<GymSeatResult | null> {
  return settleChallengeOnServer(await getIdToken(), seat);
}

async function settleChallengeOnServer(token: string, seat: string): Promise<GymSeatResult | null> {
  'use server';
  return settleOnServer(await requireUid(token), seat);
}

/**
 * Every seat this player is holding
 */
export async function listHeldSeats(player: string): Promise<GymSeatRecord[]> {
  return listSeatsOnServer(player);
}

async function listSeatsOnServer(player: string): Promise<GymSeatRecord[]> {
  'use server';
  return listOnServer(player);
}
