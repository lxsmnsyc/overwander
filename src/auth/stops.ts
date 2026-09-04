import { requireUid } from '../server/auth';
import {
  type StopEntry,
  type StopReward,
  claimStopReward as claimOnServer,
  enterStop as enterOnServer,
  startStopBattle as startOnServer,
} from '../server/stops';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { syncServerClock } from './clock';
import getIdToken from './session';

export type { StopPokemon, StopRecord } from './stop-record';
export type { StopEntry, StopReward } from '../server/stops';

/**
 * The stops as the client sees them. Every one of these is a thin
 * wrapper over [`src/server/stops.ts`](../server/stops.ts): what a
 * stop fields, whether it was beaten and what beating it paid are the
 * server's to decide, since a purse and sometimes a pokemon change
 * hands over it
 */

/**
 * Walk up to a stop. Resolves the stop id and the player's state of
 * it, `'beaten'` for one this player has already put down, or null
 * when the cell stages nobody this window at all
 */
export async function enterStop(snapshot: ChunkSnapshot, cell: number): Promise<StopEntry> {
  return enterStopOnServer(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
  );
}

async function enterStopOnServer(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
): Promise<StopEntry> {
  'use server';
  return enterOnServer(await requireUid(token), x, y, cell, await syncServerClock(), offset);
}

/**
 * Accept the challenge with a party of one's own. Resolves the battle
 * id — the fight already under way, if there is one — or null when the
 * challenge cannot be taken
 */
export async function startStopBattle(stop: string, catches: string[]): Promise<string | null> {
  return startBattleOnServer(await getIdToken(), stop, catches);
}

async function startBattleOnServer(
  token: string,
  stop: string,
  catches: string[],
): Promise<string | null> {
  'use server';
  return startOnServer(await requireUid(token), stop, catches, await syncServerClock());
}

/**
 * Collect what a beaten grunt owes: the purse lands in the profile,
 * and the pokemon they left is staged as an encounter to be caught
 */
export async function claimStopReward(stop: string): Promise<StopReward | null> {
  return claimRewardOnServer(await getIdToken(), stop);
}

async function claimRewardOnServer(token: string, stop: string): Promise<StopReward | null> {
  'use server';
  return claimOnServer(await requireUid(token), stop);
}
