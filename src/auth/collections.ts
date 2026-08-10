import type Families from '../data/ids/families';
import type { Items } from '../data/ids/items';

/**
 * Every Firestore collection the game uses, named once. The client
 * reads through these and the privileged server writes through the
 * same names, so a rename cannot leave one side addressing a
 * collection the other has moved on from
 */
export const PROFILE_COLLECTION = 'profiles';
export const INVENTORY_COLLECTION = 'inventories';
export const CANDY_COLLECTION = 'candies';
export const BUDDY_COLLECTION = 'buddies';
export const CAUGHT_COLLECTION = 'caught';
export const FLED_COLLECTION = 'fled';

export const SNAPSHOT_COLLECTION = 'snapshots';
export const SPAWN_COLLECTION = 'spawns';
export const ENCOUNTER_COLLECTION = 'encounters';
export const CACHE_CLAIM_COLLECTION = 'cacheClaims';
export const GROTTO_CLAIM_COLLECTION = 'grottoClaims';
export const BERRY_CLAIM_COLLECTION = 'berryClaims';

export const TEAM_COLLECTION = 'teams';
export const TEAM_SNAPSHOT_COLLECTION = 'teamSnapshots';
export const BATTLE_COLLECTION = 'battles';
export const RAID_COLLECTION = 'raids';
export const RAID_REWARD_COLLECTION = 'raidRewards';

/**
 * One stack per user and item pair, so the same item can never split
 * across two documents
 */
export function inventoryEntryId(uid: string, item: Items): string {
  return `${uid}:${item}`;
}

/**
 * One stack per user and family: a candy feeds any catch of its
 * family, so the stack is keyed by family rather than by species
 */
export function candyStackId(uid: string, family: Families): string {
  return `${uid}:${family}`;
}
