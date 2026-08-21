// From the record module rather than from `auth/auctions`, which
// reaches into the server half of the app: importing it here drags
// `server-only` into a plain Node test and refuses to load at all
import { AUCTION_DURATION, AuctionLot } from '../src/auth/auction-record';
import { getLocalOffset } from '../src/auth/local-time';
import { Items } from '../src/data/ids/items';
import { admin, copyable, findRows, insertRow, stageAccount } from './admin';

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
  /** What they signed up with, which is how a friend finds them */
  email: string;
}

/**
 * Put a trainer in the world with one item on the auction board, and
 * answer who they are. The lot is an item rather than a pokemon: a
 * catch lot would need a `caught` record in escrow as well, and what is
 * being reached for here is the seller rather than the thing they sell
 */
export async function stageSeller(called: string): Promise<Stranger> {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  const opened = Date.now();
  // A real account rather than a profile alone: a friend is looked up
  // by the address they signed up with, and an address lives in
  // Supabase Auth
  const email = `seller-${stamp}@example.com`;
  const uid = await stageAccount(email, 'walking-in-the-tall-grass');
  // Stamped, because the emulator is reused between runs: a lot stands
  // for a day, so yesterday's Wisteria is still on the board this
  // morning and a spec asking for "the seller called Wisteria" finds
  // two of her
  const nickname = `${called} ${stamp}`;

  // The trigger opened a bare profile; the name is what the board
  // shows
  await admin.from('profiles').update({ nickname }).eq('id', uid);

  await insertRow('auctions', {
    id: `e2e-lot-${stamp}`,
    seller: uid,
    lot: AuctionLot.Item,
    item: Items.PokeBall,
    caught_id: null,
    starting_bid: 10,
    increment: 5,
    bid: 0,
    bidder: null,
    created_at: opened,
    ends_at: opened + AUCTION_DURATION,
    utc_offset: getLocalOffset(),
    settled: false,
  });

  return { uid, nickname, email };
}

/**
 * Put one of the player's own pokemon on the block **under somebody
 * else's name**, so that the sheet a bidder opens from it has a
 * stranger in its ownership history.
 *
 * A catch is copied rather than made up: a record has three dozen
 * fields and every one of them is read by the sheet, so the honest way
 * to get a valid one is to take a valid one. What is rewritten is who
 * it belonged to — the owner goes to escrow, the way the server puts a
 * listed pokemon there, and the history says the stranger had it.
 *
 * Resolves the id of the copy
 */
export async function stageCatchLot(seller: Stranger, sourceCatch: string): Promise<string> {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  const caught = `e2e-lot-catch-${stamp}`;
  const opened = Date.now();

  // A catch is copied rather than made up: a record has three dozen
  // fields and every one of them is read by the sheet, so the honest
  // way to get a valid one is to take a valid one
  const source = (await findRows('caught', 'id', sourceCatch)).at(0);

  if (source == null) {
    throw new Error(`no catch at ${sourceCatch}`);
  }

  await insertRow('caught', {
    ...copyable(source),
    id: caught,
    // Held by nobody while it is on the block, which is what the
    // server does to a listing
    owner: null,
    auctionable: true,
  });
  for (const table of ['caught_moves', 'caught_abilities', 'caught_items'] as const) {
    const children = await findRows(table, 'caught_id', sourceCatch);

    for (const child of children) {
      await insertRow(table, { ...child, caught_id: caught });
    }
  }
  // The history says the stranger had it
  await insertRow('caught_history', {
    caught_id: caught,
    seq: 0,
    owner: seller.uid,
    owner_name: null,
    acquired_at_local: new Date(opened),
    acquired_at_offset: getLocalOffset(),
    kind: 0,
    paid: null,
    ball: null,
  });

  await insertRow('auctions', {
    id: `e2e-catch-lot-${stamp}`,
    seller: seller.uid,
    lot: AuctionLot.Catch,
    item: null,
    caught_id: caught,
    starting_bid: 10,
    increment: 5,
    bid: 0,
    bidder: null,
    created_at: opened,
    ends_at: opened + AUCTION_DURATION,
    utc_offset: getLocalOffset(),
    settled: false,
  });

  return caught;
}
