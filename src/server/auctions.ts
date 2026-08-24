import 'server-only';
import {
  AUCTION_DURATION,
  AUCTION_ESCROW,
  AuctionLot,
  type AuctionOffer,
  type AuctionRecord,
  type AuctionTerms,
  asAuctionRecord,
  asAuctionTerms,
  asGold,
  canBid,
  canClaim,
  canReclaim,
  isAuctionableCatch,
  isAuctionableItem,
} from '../auth/auction-record';
import { asOffset, toLocalISO } from '../auth/local-time';
import { Acquisition, asCaughtPokemon } from '../auth/caught-record';
import { isEggRecord, isFavoriteRecord } from './catch-fields';
import { BASE_FRIENDSHIP } from '../data/constants/friendship';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { type Tx, newDocId, tx } from './db';
import { readStackIn, spendStackIn, writeStackIn } from './stacks';
import { ITEM_STACKS } from '../auth/stacks';
import { hasSpareCatch } from './caught';
import { isAnyCatchQueued } from './raids';
import { isCatchLocked } from './locks';
import { Metric } from '../auth/quest-record';
import { bumpProgress } from './quest-progress';
import { asNumber } from './read';

/**
 * Auctions, written over the owner connection.
 *
 * Two rules are what make a day-long auction safe to leave running
 * with nothing sweeping it. A lot is **taken when it is listed**, so a
 * seller cannot list what they have since spent. A bid is **paid when
 * it is made** and refunded as it is outbid, so the last bidder
 * standing has already paid.
 *
 * Collecting and reclaiming share the `settled` marker, so a lot is
 * handed over exactly once whichever end it leaves by. The rules both
 * sides read live in
 * [`src/auth/auction-record.ts`](../auth/auction-record.ts)
 */

/** One auction row in the record shape, locked for the transaction */
async function readAuctionIn(transaction: Tx, id: string): Promise<Record<string, unknown> | null> {
  const rows = await transaction`select * from auctions where id = ${id} for update`;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }
  return {
    seller: row.seller,
    lot: row.lot,
    item: row.item,
    caught: row.caught_id ?? '',
    startingBid: row.starting_bid,
    increment: row.increment,
    bid: row.bid,
    bidder: row.bidder ?? '',
    createdAt: row.created_at,
    endsAt: row.ends_at,
    offset: row.utc_offset,
    settled: row.settled,
  };
}

/**
 * Put an item or a pokemon up for auction.
 *
 * The lot is taken in the same transaction the auction is written in:
 * a stack comes down by one, and a catch moves into escrow, still its
 * own row and readable by everyone but owned by nobody. Nothing comes
 * back while the auction runs, so a listing is something a bidder can
 * trust for the whole day; only a lot nobody bid on goes back, through
 * `reclaimAuction`. One auction per seller at a time, which is one a
 * day.
 *
 * Resolves the auction id, or null when the seller already has one
 * running, does not carry the item, does not own the pokemon, or the
 * pokemon is not one to sell: an egg, the buddy, one fighting, or one
 * waiting in a raid lobby
 */
export async function openAuction(
  uid: string,
  offer: AuctionOffer,
  terms: AuctionTerms,
  now: number,
  offset: number,
): Promise<string | null> {
  // A pokemon queued for a raid is already promised to a fight, and
  // the lobby holds its id rather than the record: selling it out from
  // under the party would have it silently dropped when the raid
  // started. The check is a query, so it is asked before the
  // transaction the way joining a raid asks it
  if (offer.lot === AuctionLot.Catch && (await isAnyCatchQueued(uid, [offer.caught]))) {
    return null;
  }

  // Nor their last one. A lot leaves the seller's hands the moment it
  // is listed, so a player could put up the only pokemon they have
  // and be left with nothing for the day it takes to find out whether
  // anybody wanted it
  if (offer.lot === AuctionLot.Catch && !(await hasSpareCatch(uid))) {
    return null;
  }

  const asked = asAuctionTerms(terms.startingBid, terms.increment);

  return tx(async (transaction) => {
    const sellers = await transaction`
      select ends_at from auction_sellers where player = ${uid} for update
    `;

    // Their last one is still taking bids
    if (sellers.at(0) != null && now < asNumber(sellers[0].ends_at)) {
      return null;
    }

    const auctionId = newDocId();
    const auction: AuctionRecord = {
      seller: uid,
      lot: offer.lot,
      item: offer.lot === AuctionLot.Item ? offer.item : null,
      caught: offer.lot === AuctionLot.Catch ? offer.caught : '',
      startingBid: asked.startingBid,
      increment: asked.increment,
      bid: 0,
      bidder: '',
      createdAt: now,
      endsAt: now + AUCTION_DURATION,
      offset: asOffset(offset),
      settled: false,
    };

    if (offer.lot === AuctionLot.Item) {
      // The block takes one listing a day off a player, so what may go
      // on it is the special band and nothing under it. The picker
      // leaves the rest out; this is the same rule asked where a
      // client cannot skip it
      if (!isAuctionableItem(offer.item)) {
        return null;
      }

      const stock = await readStackIn(transaction, ITEM_STACKS, uid, offer.item);

      if (!(await spendStackIn(transaction, ITEM_STACKS, uid, offer.item, stock))) {
        return null;
      }
    } else {
      const caught = await readCaughtIn(transaction, offer.caught);
      const profiles = await transaction`
        select buddy_id from profiles where id = ${uid}
      `;

      // A pokemon fighting right now is running on a frozen snapshot
      // of a record that has to still be theirs when the battle ends
      if (caught == null || caught.owner !== uid || isCatchLocked(caught)) {
        return null;
      }
      // An egg is refused outright. Nobody can see what is in one, so a
      // bidder would be bidding on a sealed box — and the seller knows
      // exactly what is in it, which is not an auction but a shell game
      if (isEggRecord(caught)) {
        return null;
      }
      // So is a favorite. A lot cannot be taken back off the block, and
      // the flag is the player's own standing answer about this one
      if (isFavoriteRecord(caught)) {
        return null;
      }
      // So is the buddy. Selling the pokemon at your side out from
      // under yourself is the kind of thing a player does by
      // misreading a list, and a lot cannot be taken back off the
      // block; sending it home first is one press and makes the sale
      // deliberate
      if (profiles[0]?.buddy_id === offer.caught) {
        return null;
      }
      // And so is anything a bidder could go and catch for themselves.
      // Perfect values, a shiny or a special-tier species are the three
      // a walk cannot simply produce, and the rule is asked of the
      // **stored** record rather than of what the client said about it
      if (!isAuctionableCatch(asCaughtPokemon(caught))) {
        return null;
      }
      // Whatever it is holding goes with it: the item was handed to
      // the pokemon, and the pokemon is what is being sold
      await updateCaughtIn(transaction, offer.caught, { owner: AUCTION_ESCROW });
    }

    await transaction`
      insert into auctions
        (id, seller, lot, item, caught_id, starting_bid, increment, bid, bidder,
         created_at, ends_at, utc_offset, settled)
      values
        (${auctionId}, ${uid}, ${auction.lot}, ${auction.item},
         ${auction.caught === '' ? null : auction.caught},
         ${auction.startingBid}, ${auction.increment}, 0, null,
         ${auction.createdAt}, ${auction.endsAt}, ${auction.offset}, false)
    `;
    await transaction`
      insert into auction_sellers (player, auction, ends_at)
      values (${uid}, ${auctionId}, ${auction.endsAt})
      on conflict (player) do update
        set auction = excluded.auction, ends_at = excluded.ends_at
    `;
    return auctionId;
  });
}

/**
 * Bid on somebody else's auction.
 *
 * The gold is taken as the bid is made, and the bid it outbid is
 * handed back in the same transaction — so a standing bid is always
 * money that has already been paid, and the winner cannot turn out to
 * be somebody who spent it in the meantime.
 *
 * The amount is the bidder's to name: anything from `nextBid` up to
 * what they are holding. The seller's increment is the floor on a
 * raise, not its size.
 *
 * Resolves the standing bid, or null when the auction has closed, the
 * bidder is the seller or already winning it, the bid does not clear
 * the increment, or the balance cannot cover it
 */
export async function placeBid(
  uid: string,
  auctionId: string,
  amount: number,
  now: number,
): Promise<number | null> {
  const bid = asGold(amount);

  return tx(async (transaction) => {
    const stored = await readAuctionIn(transaction, auctionId);

    if (stored == null) {
      return null;
    }

    const auction = asAuctionRecord(stored);

    if (!canBid(auction, uid, bid, now)) {
      return null;
    }

    // The bidder pays as the bid lands; the guard rides in the
    // statement, so a balance that cannot cover it changes nothing
    const paid = await transaction`
      update profiles set gold = gold - ${bid}
      where id = ${uid} and gold >= ${bid}
    `;

    if (paid.count === 0) {
      return null;
    }

    // The bid it outbid is handed back in the same breath: a standing
    // bid is always money that has already been paid. Never the same
    // row, since nobody outbids themselves
    if (auction.bidder !== '') {
      await transaction`
        update profiles set gold = gold + ${auction.bid} where id = ${auction.bidder}
      `;
    }
    await transaction`
      update auctions set bid = ${bid}, bidder = ${uid} where id = ${auctionId}
    `;
    // The lot keeps only the bid that is standing; the bidder keeps
    // their own record of having bid at all, so being outbid an hour
    // ago does not erase the lot from their history. Bidding again
    // rewrites it rather than adding to it
    await transaction`
      insert into bids (player, auction, amount, bid_at)
      values (${uid}, ${auctionId}, ${bid}, ${now})
      on conflict (player, auction) do update
        set amount = excluded.amount, bid_at = excluded.bid_at
    `;
    return bid;
  });
}

/**
 * Collect a lot that was won. Nothing hands it over on its own when
 * bidding closes — the winner comes back for it — so this is where the
 * item lands in their bag or the pokemon comes out of escrow into
 * their records, and where the seller is finally paid.
 *
 * The `settled` flag is the claim marker: it is read and written in
 * the same transaction as the handover, so a lot is collected once and
 * a purse is paid once.
 *
 * Resolves false when the caller did not win it, when bidding has not
 * closed, or when it has already been collected
 */
export async function claimAuction(
  uid: string,
  auctionId: string,
  now: number,
  offset: number,
): Promise<boolean> {
  let seller = '';
  const claimed = await tx(async (transaction) => {
    const stored = await readAuctionIn(transaction, auctionId);

    if (stored == null) {
      return false;
    }

    const auction = asAuctionRecord(stored);

    if (!canClaim(auction, uid, now)) {
      return false;
    }
    seller = auction.seller;

    if (auction.lot === AuctionLot.Item && auction.item != null) {
      const stock = await readStackIn(transaction, ITEM_STACKS, uid, auction.item);

      await writeStackIn(transaction, ITEM_STACKS, uid, auction.item, stock + 1);
    } else {
      const caught = await readCaughtIn(transaction, auction.caught);

      // The record was moved into escrow when the auction opened and
      // nothing else can touch it there, so anything else in that
      // field is a lot that is not this auction's to hand over
      if (caught == null) {
        return false;
      }

      const record = asCaughtPokemon(caught);

      if (record.owner !== AUCTION_ESCROW) {
        return false;
      }
      // A pokemon carries who it has passed through, so a sale is an
      // entry in it — written in the new owner's own zone, the way a
      // catch date is.
      //
      // And it arrives thinking of the winner exactly what a fresh
      // catch thinks of whoever caught it. Friendship is a record of
      // how a pokemon has been kept by *somebody*, and the somebody
      // has just changed: whatever it walked, levelled and was groomed
      // for belonged to the seller, and carrying that over would make
      // an inseparable pokemon a thing that could be bought
      await updateCaughtIn(transaction, auction.caught, {
        owner: uid,
        history: [
          ...record.history,
          {
            owner: uid,
            acquiredAt: toLocalISO(now, offset),
            kind: Acquisition.Auction,
            // What it went for, kept with the handover rather than with
            // the pokemon: the lot is settled and gone a moment later,
            // so this is the only place the figure survives — and a
            // pokemon that comes round the block twice keeps both
            paid: auction.bid,
            // And the ball it was in when it came across, which the
            // winner is free to change afterwards
            ball: record.ball,
          },
        ],
        friendship: BASE_FRIENDSHIP,
        // A sale is a change of hands, so it opens a trade evolution
        // the same as a swap between two players would
        traded: true,
      });
    }

    await transaction`
      update profiles set gold = gold + ${auction.bid} where id = ${auction.seller}
    `;
    await transaction`update auctions set settled = true where id = ${auctionId}`;
    return true;
  });

  // A settled sale counts once for the winner and once for the seller
  if (claimed && seller !== '') {
    await bumpProgress(uid, [[Metric.Auctions, 0, 1]]);
    await bumpProgress(seller, [[Metric.Auctions, 0, 1]]);
  }
  return claimed;
}

/**
 * Take back a lot the day ended without a single bid on.
 *
 * Nothing was sold, so nothing is paid: the item goes back into the
 * seller's stack and the pokemon comes out of escrow into their records
 * exactly as it went in. Its ownership history and its friendship are
 * both left alone, because it did not change hands — it sat on a shelf
 * for a day and came back to the same person.
 *
 * `settled` is the same marker collecting writes, so a lot is handed
 * over once whichever end it goes out of, and a reclaim cannot race a
 * claim: only one of the two can be true of any auction.
 *
 * Resolves false when the caller is not the seller, when bidding is
 * still open, when somebody did bid — that lot belongs to whoever won
 * it, collected or not — or when it has already been handed over
 */
export async function reclaimAuction(
  uid: string,
  auctionId: string,
  now: number,
): Promise<boolean> {
  return tx(async (transaction) => {
    const stored = await readAuctionIn(transaction, auctionId);

    if (stored == null) {
      return false;
    }

    const auction = asAuctionRecord(stored);

    if (!canReclaim(auction, uid, now)) {
      return false;
    }

    if (auction.lot === AuctionLot.Item && auction.item != null) {
      const stock = await readStackIn(transaction, ITEM_STACKS, uid, auction.item);

      await writeStackIn(transaction, ITEM_STACKS, uid, auction.item, stock + 1);
    } else {
      const caught = await readCaughtIn(transaction, auction.caught);

      if (caught == null) {
        return false;
      }
      // Escrow is where this auction put it, and nothing else can move
      // it from there: anything else in that field is a record this
      // auction has no claim on
      if (asCaughtPokemon(caught).owner !== AUCTION_ESCROW) {
        return false;
      }
      // Only the owner field moves. It did not change hands, so
      // nothing about how it has been kept changes either: the
      // friendship a sale resets is still the seller's own
      await updateCaughtIn(transaction, auction.caught, { owner: uid });
    }

    await transaction`update auctions set settled = true where id = ${auctionId}`;
    return true;
  });
}
