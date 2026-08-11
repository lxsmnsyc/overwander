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
/**
 * One marker per nest, window and player: a nest holds one egg per
 * player per twelve hours, and the marker is what says the player has
 * already taken theirs
 */
export const NEST_CLAIM_COLLECTION = 'nestClaims';

/**
 * One document per auction. A lot named here is already out of the
 * seller's hands: the item left their bag and the pokemon left their
 * records when the auction opened
 */
export const AUCTION_COLLECTION = 'auctions';
/**
 * One document per seller, naming the auction they have running and
 * when it closes. It is what keeps a player to one auction at a time,
 * which — since an auction runs a day — is one a day
 */
export const AUCTION_SELLER_COLLECTION = 'auctionSellers';
/**
 * One document per bidder and auction pair, id "{uid}:{auctionId}":
 * the lot keeps only the bid that is standing, so a player's own
 * history of what they have bid on is kept on their side
 */
export const BID_COLLECTION = 'bids';

/**
 * One marker per wandering NPC, cell, window and player. Whoever is
 * standing at a cell serves a given player once while they are there:
 * the fee the breeder and the daycare lady charge paces what a visit
 * costs, and this paces how often one can be had at all
 */
export const NPC_CLAIM_COLLECTION = 'npcClaims';

/**
 * Where each player last was, one document per uid. It is the only
 * mutable record of a player in the world: everything else about the
 * overworld derives from a seed and a window
 */
export const POSITION_COLLECTION = 'positions';

export const TEAM_COLLECTION = 'teams';
export const TEAM_SNAPSHOT_COLLECTION = 'teamSnapshots';
export const BATTLE_COLLECTION = 'battles';
export const RAID_COLLECTION = 'raids';
/**
 * One document per Team Rocket stop **and player**, id
 * "{stopId}:{uid}": a grunt fights each passer-by on their own, so
 * what one player did to it says nothing about anybody else's
 */
export const ROCKET_COLLECTION = 'rocketStops';
export const RAID_REWARD_COLLECTION = 'raidRewards';
/**
 * One marker per battle and player, so a fight can only take a
 * party's spent items off the catch records once
 */
export const BATTLE_AFTERMATH_COLLECTION = 'battleAftermaths';

/**
 * One stack per user and item pair, so the same item can never split
 * across two documents
 */
export function inventoryEntryId(uid: string, item: Items): string {
  return `${uid}:${item}`;
}

/**
 * One document per bidder and lot, so bidding again rewrites what they
 * bid rather than adding to a list
 */
export function bidEntryId(uid: string, auction: string): string {
  return `${uid}:${auction}`;
}

/**
 * One stack per user and family: a candy feeds any catch of its
 * family, so the stack is keyed by family rather than by species
 */
export function candyStackId(uid: string, family: Families): string {
  return `${uid}:${family}`;
}
