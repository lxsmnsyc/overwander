// From the record module rather than from `auth/auctions`, which
// reaches into the server half of the app: importing it here drags
// `server-only` into a plain Node test and refuses to load at all
import { AUCTION_DURATION, AuctionLot } from '../src/auth/auction-record';
import { getLocalOffset } from '../src/auth/local-time';
import { Items } from '../src/data/ids/items';
import { writeDocument } from './emulator';

/**
 * Somebody who is not the player.
 *
 * Half of what a player does in this game is done at somebody else —
 * bidding on their lot, joining their lobby, looking at who they are —
 * and none of it can be tested with one browser signed into one
 * account. A stranger is written straight into the emulator instead: a
 * profile, so they have a name, and a lot on the board, so the player
 * has somewhere to meet them.
 *
 * They have no auth account. Nothing in these tests signs in as them —
 * what is being tested is what the *player* can see of somebody else,
 * and every one of those reads goes through the profile and the board
 * rather than through a session.
 */

/**
 * A stranger with a lot on the block. The uid is theirs, the nickname
 * is what the board and their profile will call them
 */
export interface Stranger {
  uid: string;
  nickname: string;
}

/**
 * Put a trainer in the world with one item on the auction board, and
 * answer who they are. The lot is an item rather than a pokemon: a
 * catch lot would need a `caught` record in escrow as well, and what is
 * being reached for here is the seller rather than the thing they sell
 */
export async function stageSeller(called: string): Promise<Stranger> {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  const uid = `e2e-seller-${stamp}`;
  const opened = Date.now();
  // Stamped, because the emulator is reused between runs: a lot stands
  // for a day, so yesterday's Wisteria is still on the board this
  // morning and a spec asking for "the seller called Wisteria" finds
  // two of her
  const nickname = `${called} ${stamp}`;

  await writeDocument('profiles', uid, {
    nickname: { stringValue: nickname },
    avatar: { nullValue: null },
    gold: { integerValue: '0' },
    buddy: { stringValue: '' },
    role: { stringValue: '' },
  });

  await writeDocument('auctions', `e2e-lot-${stamp}`, {
    seller: { stringValue: uid },
    lot: { integerValue: String(AuctionLot.Item) },
    item: { integerValue: String(Items.PokeBall) },
    caught: { stringValue: '' },
    startingBid: { integerValue: '10' },
    increment: { integerValue: '5' },
    bid: { integerValue: '0' },
    bidder: { stringValue: '' },
    createdAt: { integerValue: String(opened) },
    endsAt: { integerValue: String(opened + AUCTION_DURATION) },
    offset: { integerValue: String(getLocalOffset()) },
    settled: { booleanValue: false },
  });

  return { uid, nickname };
}
