import { type AwardRecord, listAwards as listOnServer } from '../server/awards';

export type { AwardRecord } from '../server/awards';

/**
 * Awards as the client sees them: readable for any player, granted
 * only by the server when a gym, an elite or the Champion goes down
 */

export default async function listAwards(player: string): Promise<AwardRecord[]> {
  return listAwardsOnServer(player);
}

async function listAwardsOnServer(player: string): Promise<AwardRecord[]> {
  'use server';
  return listOnServer(player);
}
