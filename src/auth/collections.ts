/**
 * Every Firestore collection the game uses, named once. The client
 * reads through these and the privileged server writes through the
 * same names, so a rename cannot leave one side addressing a
 * collection the other has moved on from
 */
export const PROFILE_COLLECTION = 'profiles';
/**
 * Everything a player is carrying, in one document per player: the
 * items map and the candies map. They were a collection each, one
 * small row per thing, and a row per thing billed a read per kind
 * carried every time a picker opened. See [`stacks.ts`](./stacks.ts)
 */
export const BAG_COLLECTION = 'bags';
/**
 * What a player has met and kept, in one document per player: a count
 * per species of the ones they have seen and the ones they have
 * caught, each split into the ordinary and the sparkling. It is the
 * bag's shape applied to a different question — see
 * [`pokedex-record.ts`](./pokedex-record.ts) — and for the same
 * reason: a dex is read whole or not at all
 */
export const POKEDEX_COLLECTION = 'pokedex';
export const CAUGHT_COLLECTION = 'caught';
export const FLED_COLLECTION = 'fled';

/**
 * One document per chunk and zone: the window everyone in that zone
 * shares, and the spawns it rolled. The spawns were a collection of
 * their own once — they have no life apart from the window that
 * rolled them, so they live in it
 */
export const SNAPSHOT_COLLECTION = 'snapshots';
export const ENCOUNTER_COLLECTION = 'encounters';
export const CACHE_CLAIM_COLLECTION = 'cacheClaims';
export const PHENOMENON_CLAIM_COLLECTION = 'phenomenonClaims';
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
 * One document per offer. A player's own is written at "{gift}:{uid}",
 * which is what stops two tabs offering the same thing twice; an open
 * one names nobody and stands on every shelf at once
 */
export const GIFT_COLLECTION = 'gifts';
/**
 * One document per gift and taker, "{gift}:{uid}". It is what makes a
 * claim happen: an offer may stand for everybody at once, so what
 * stops a second press paying twice cannot be a stamp on the offer
 */
export const GIFT_CLAIM_COLLECTION = 'giftClaims';

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
 * One document per bidder and lot, so bidding again rewrites what they
 * bid rather than adding to a list
 */
export function bidEntryId(uid: string, auction: string): string {
  return `${uid}:${auction}`;
}

/**
 * One document per player and friend, id "{owner}:{friend}". A
 * friendship is written twice, once from each side, so "who are mine"
 * is a query rather than a scan of everybody's
 */
export const FRIEND_COLLECTION = 'friends';
/**
 * One document per asker and asked, id "{from}:{to}". The id is what
 * makes a second press harmless: asking twice rewrites the one
 * request that was already standing
 */
export const FRIEND_REQUEST_COLLECTION = 'friendRequests';

/**
 * One document per blocker and blocked, id "{blocker}:{blocked}". A
 * block is one-sided and known only to the player who set it: the
 * other side is told nothing, which is the point of one
 */
export const BLOCK_COLLECTION = 'blocks';

/** One side of a friendship, as it is stored */
export function friendEntryId(owner: string, friend: string): string {
  return `${owner}:${friend}`;
}

/** The request one player has standing with another, by direction */
export function friendRequestId(from: string, to: string): string {
  return `${from}:${to}`;
}

/** One player's block on another */
export function blockEntryId(blocker: string, blocked: string): string {
  return `${blocker}:${blocked}`;
}
