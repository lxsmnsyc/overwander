import { requireUid } from '../server/auth';
import {
  type RocketReward,
  claimRocketReward as claimOnServer,
  enterRocketStop as enterOnServer,
  startRocketBattle as startOnServer,
} from '../server/rockets';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import { syncServerClock } from './clock';
import type { RocketRecord } from './rocket-record';
import getIdToken from './session';

export type { RocketPokemon, RocketRecord } from './rocket-record';
export type { RocketReward } from '../server/rockets';

/**
 * Team Rocket stops as the client sees them. Every one of these is a
 * thin wrapper over [`src/server/rockets.ts`](../server/rockets.ts):
 * what a grunt fields, whether they were beaten and what beating them
 * paid are the server's to decide, since a purse and a pokemon change
 * hands over it
 */

/**
 * Walk up to a stop. Resolves the stop id and the player's state of
 * it, or null when the cell stages no grunt this window or the player
 * has already beaten the one it stages
 */
export async function enterRocketStop(
  snapshot: ChunkSnapshot,
  cell: number,
): Promise<[string, RocketRecord] | null> {
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
): Promise<[string, RocketRecord] | null> {
  'use server';
  return enterOnServer(await requireUid(token), x, y, cell, await syncServerClock(), offset);
}

/**
 * Accept the challenge with a party of one's own. Resolves the battle
 * id — the fight already under way, if there is one — or null when the
 * challenge cannot be taken
 */
export async function startRocketBattle(stop: string, catches: string[]): Promise<string | null> {
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
export async function claimRocketReward(stop: string): Promise<RocketReward | null> {
  return claimRewardOnServer(await getIdToken(), stop);
}

async function claimRewardOnServer(token: string, stop: string): Promise<RocketReward | null> {
  'use server';
  return claimOnServer(await requireUid(token), stop);
}
