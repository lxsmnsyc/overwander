import 'server-only';
import {
  AUCTION_COLLECTION,
  AUCTION_SELLER_COLLECTION,
  BID_COLLECTION,
  CAUGHT_COLLECTION,
  PROFILE_COLLECTION,
  bidEntryId,
} from '../auth/collections';
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
import { getAdminFirestore } from './firebase';
import { readStackIn, spendStackIn, writeStackIn } from './stacks';
import { ITEM_STACKS } from '../auth/stacks';
import { hasSpareCatch } from './caught';
import { isAnyCatchQueued } from './raids';
import { isCatchLocked } from './locks';
import { asNumber, docData } from './read';

/**
 * Auctions, written with admin credentials.
 *
 * An auction is the one place a pokemon or an item changes hands
 * between players, so every step of it is decided here: what a seller
 * is allowed to put up, whether a bid clears the standing one, whether
 * the bidder can pay it, and who is owed what when it closes.
 *
 * Two things make that safe to leave running for a day without
 * anything sweeping it. A lot is **taken when it is listed** — the item
 * leaves the bag and the pokemon leaves the seller's records at the
 * moment the auction opens — so nothing has to be held back or checked
 * again at the end, and a seller cannot list what they have since
 * spent. And a bid is **paid when it is made**, handed straight back
 * to whoever it outbid, so the last bidder standing is by definition
 * somebody whose gold is already in.
 *
 * What is taken still has somebody waiting for it either way: a lot
 * that sells is collected by its winner, and one nobody bid on is taken
 * back by the seller once the day is up. Both run through the same
 * `settled` marker, so a lot is handed over exactly once whichever way
 * it went.
 *
 * The rules both sides read live in
 * [`src/auth/auction-record.ts`](../auth/auction-record.ts)
 */

/**
 * The seller's own document, naming the auction they have running
 */
function getSellerRef(uid: string): FirebaseFirestore.DocumentReference {
  return getAdminFirestore().collection(AUCTION_SELLER_COLLECTION).doc(uid);
}

function getProfileRef(uid: string): FirebaseFirestore.DocumentReference {
  return getAdminFirestore().collection(PROFILE_COLLECTION).doc(uid);
}

/**
 * Put an item or a pokemon up for auction.
 *
 * The lot is taken in the same transaction the auction is written in:
 * an item stack comes down by one, and a catch is moved into escrow —
 * still its own document, readable by everyone the way any catch is,
 * but owned by nobody. Neither comes back while the auction runs: a
 * seller who changes their mind cannot pull the lot off the block, and
 * cannot bid on it either, so a listing is something a bidder can
 * trust for the whole day. Only a lot the day ended with **nobody
 * having bid on** goes back, through `reclaimAuction`.
 *
 * A player runs one auction at a time, which is one a day: the seller
 * document says when theirs closes, and another cannot be opened until
 * it has.
 *
 * Resolves the auction id, or null when the seller already has one
 * running, does not carry the item, does not own the pokemon, or the
 * pokemon is not one to sell — an egg, the buddy at their side, one
 * fighting, or one waiting in a raid lobby
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

  const db = getAdminFirestore();
  const asked = asAuctionTerms(terms.startingBid, terms.increment);

  return db.runTransaction(async (transaction) => {
    const sellerRef = getSellerRef(uid);
    const seller = docData(await transaction.get(sellerRef));

    // Their last one is still taking bids
    if (seller != null && now < asNumber(seller.endsAt)) {
      return null;
    }

    const ref = db.collection(AUCTION_COLLECTION).doc();
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

      if (!spendStackIn(transaction, ITEM_STACKS, uid, offer.item, stock)) {
        return null;
      }
    } else {
      const caughtRef = db.collection(CAUGHT_COLLECTION).doc(offer.caught);
      const profileRef = db.collection(PROFILE_COLLECTION).doc(uid);
      const [caughtDoc, profileDoc] = await transaction.getAll(caughtRef, profileRef);
      const caught = docData(caughtDoc);

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
      if (docData(profileDoc)?.buddy === offer.caught) {
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
      transaction.update(caughtRef, { owner: AUCTION_ESCROW });
    }

    transaction.set(ref, auction);
    transaction.set(sellerRef, { player: uid, auction: ref.id, endsAt: auction.endsAt });
    return ref.id;
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
  const db = getAdminFirestore();
  const bid = asGold(amount);

  return db.runTransaction(async (transaction) => {
    const ref = db.collection(AUCTION_COLLECTION).doc(auctionId);
    const stored = docData(await transaction.get(ref));

    if (stored == null) {
      return null;
    }

    const auction = asAuctionRecord(stored);

    if (!canBid(auction, uid, bid, now)) {
      return null;
    }

    // The bidder's own balance, and the one the refund is owed to.
    // They are never the same document — nobody outbids themselves —
    // so the two move independently
    const bidderRef = getProfileRef(uid);
    const outbid = auction.bidder;
    const outbidRef = outbid === '' ? null : getProfileRef(outbid);
    const gold = asNumber(docData(await transaction.get(bidderRef))?.gold);

    if (gold < bid) {
      return null;
    }

    if (outbidRef != null) {
      const refunded = asNumber(docData(await transaction.get(outbidRef))?.gold);

      transaction.set(outbidRef, { gold: refunded + auction.bid }, { merge: true });
    }
    transaction.set(bidderRef, { gold: gold - bid }, { merge: true });
    transaction.update(ref, { bid, bidder: uid });
    // The lot keeps only the bid that is standing; the bidder keeps
    // their own record of having bid at all, so being outbid an hour
    // ago does not erase the lot from their history. Bidding again
    // rewrites it rather than adding to it
    transaction.set(db.collection(BID_COLLECTION).doc(bidEntryId(uid, auctionId)), {
      player: uid,
      auction: auctionId,
      amount: bid,
      bidAt: now,
    });
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
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const ref = db.collection(AUCTION_COLLECTION).doc(auctionId);
    const stored = docData(await transaction.get(ref));

    if (stored == null) {
      return false;
    }

    const auction = asAuctionRecord(stored);

    if (!canClaim(auction, uid, now)) {
      return false;
    }

    const sellerRef = getProfileRef(auction.seller);
    const paid = asNumber(docData(await transaction.get(sellerRef))?.gold);

    if (auction.lot === AuctionLot.Item && auction.item != null) {
      const stock = await readStackIn(transaction, ITEM_STACKS, uid, auction.item);

      writeStackIn(transaction, ITEM_STACKS, uid, auction.item, stock + 1);
    } else {
      const caughtRef = db.collection(CAUGHT_COLLECTION).doc(auction.caught);
      const caught = docData(await transaction.get(caughtRef));

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
      transaction.update(caughtRef, {
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

    transaction.set(sellerRef, { gold: paid + auction.bid }, { merge: true });
    transaction.update(ref, { settled: true });
    return true;
  });
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
 * `settled` is the same marker a collection writes, so a lot is handed
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
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const ref = db.collection(AUCTION_COLLECTION).doc(auctionId);
    const stored = docData(await transaction.get(ref));

    if (stored == null) {
      return false;
    }

    const auction = asAuctionRecord(stored);

    if (!canReclaim(auction, uid, now)) {
      return false;
    }

    if (auction.lot === AuctionLot.Item && auction.item != null) {
      const stock = await readStackIn(transaction, ITEM_STACKS, uid, auction.item);

      writeStackIn(transaction, ITEM_STACKS, uid, auction.item, stock + 1);
    } else {
      const caughtRef = db.collection(CAUGHT_COLLECTION).doc(auction.caught);
      const caught = docData(await transaction.get(caughtRef));

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
      transaction.update(caughtRef, { owner: uid });
    }

    transaction.update(ref, { settled: true });
    return true;
  });
}
