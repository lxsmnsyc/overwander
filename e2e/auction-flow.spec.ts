import { type Browser, type Locator, type Page, expect, test } from '@playwright/test';
import { PERFECT_IVS } from '../src/data/constants/stats';
import { Items } from '../src/data/ids/items';
import { findDocuments, patchDocument, uidOf, writeDocument } from './emulator';
import { type Player, dialogNamed, dismissGift, expectOpen, openPanel, signIn } from './game';

/**
 * The auction house, end to end: a lot goes up, somebody bids on it,
 * bidding closes, and the winner comes back for it.
 *
 * It takes **two players**, which is the whole reason this is worth a
 * browser test: a seller may not bid on their own lot, so every other
 * spec in the suite has only ever seen half of the board. Two contexts,
 * two accounts, one board between them.
 *
 * Three things are staged rather than played, because they cannot be
 * reached from a browser in the time a test has:
 *
 * - **What is worth listing.** Only the special band of items and a
 *   perfect, shiny or legendary pokemon may go up, and neither is
 *   something a new account is handed.
 * - **Gold.** A bidder starts with none, and gold only ever moves on
 *   the server.
 * - **The day.** A lot stands for twenty-four hours; the closing time
 *   is wound back so the winner can collect.
 *
 * Everything else is the real game: the listing goes through the
 * server, the bid moves real gold, and collecting hands over the real
 * record.
 */

/**
 * What the two accounts are called in the fixture. The seller lists,
 * the buyer bids, and neither ever sees the other's screen
 */
interface Trader {
  page: Page;
  player: Player;
  uid: string;
}

async function arrive(browser: Browser): Promise<Trader> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const player = await signIn(page);

  await dismissGift(page);
  return { page, player, uid: await uidOf(player) };
}

/**
 * Put gold in a player's purse. It is a server-only field — a client
 * that could write it could mint its own bids — so it is written as
 * the emulator's owner
 */
async function grantGold(trader: Trader, gold: number): Promise<void> {
  await patchDocument('profiles', trader.uid, { gold: { integerValue: String(gold) } });
  await trader.page.reload();
  await expect(trader.page.getByRole('navigation', { name: 'Game' })).toBeVisible();
}

/**
 * Wind a seller's lot back so bidding has closed. Nothing runs at that
 * instant — a closed lot is only one nobody may bid on any more — so
 * moving the time is the whole of what "a day later" means here
 */
async function closeBidding(sellerUid: string): Promise<void> {
  const [auction] = await findDocuments('auctions', 'seller', sellerUid);

  expect(auction, 'the listing should have written an auction').toBeTruthy();
  await patchDocument('auctions', auction.id, {
    endsAt: { integerValue: String(Date.now() - 60_000) },
  });
}

/**
 * Take the terms dialog through both of its halves. Listing is two
 * presses on purpose: a lot cannot be taken back off the block
 */
async function putItUp(page: Page, named: RegExp, opening: number): Promise<void> {
  const terms = dialogNamed(page, named);

  await expectOpen(terms);
  await terms.getByLabel('Opening bid').fill(String(opening));
  await terms.getByLabel('Least raise').fill('1');
  await terms.getByRole('button', { name: 'Put it up' }).click();

  const sure = dialogNamed(page, /^Put .* up for auction\?$/);

  await expectOpen(sure);
  await sure.getByRole('button', { name: 'Put it up for a day' }).click();
}

/**
 * What the board calls a player: the local part of the address they
 * registered with, which is what a profile is seeded from. It is
 * unique per run, so it is how a spec finds *its* lot on a board the
 * emulator has been accumulating since the first test
 */
function nicknameOf(trader: Trader): string {
  return trader.player.email.split('@')[0];
}

/**
 * The seller's lot, among whatever else is on the board. Every row
 * says who listed it, and no two runs share a name
 */
function lotOf(board: Locator, seller: Trader): Locator {
  return board.getByRole('listitem').filter({ hasText: nicknameOf(seller) });
}

/**
 * Bid on it, and wait for the bid to land. The floor is the seller's
 * opening bid; anything up to what the bidder holds is legal, so the
 * amount is typed rather than nudged
 */
async function bid(board: Locator, lot: Locator, amount: number): Promise<void> {
  await lot.getByLabel('Bid').fill(String(amount));
  await lot.getByRole('button', { name: `Bid ${amount} gold` }).click();
  await expect(
    board.getByText(`Bid ${amount} gold — it is yours unless somebody raises it.`),
  ).toBeVisible();
}

test.describe('the auction house', () => {
  test('an item goes up, is bid on, and is collected', async ({ browser }) => {
    const seller = await arrive(browser);
    const buyer = await arrive(browser);

    // A Master Ball: the special band, which is the only band the
    // block takes
    await patchDocument('bags', seller.uid, {
      items: { mapValue: { fields: { [String(Items.MasterBall)]: { integerValue: '1' } } } },
    });
    await seller.page.reload();

    const sellerBoard = await openPanel(seller.page, 'Auctions');

    await sellerBoard.getByRole('button', { name: 'Add' }).click();
    await sellerBoard.getByRole('button', { name: 'Sell Master Ball' }).click();
    await putItUp(seller.page, /^Auction Master Ball$/, 5);

    // Listed: the board comes back with the lot on it, under the
    // seller's own name
    await expect(sellerBoard.getByText('It is on the block until the day is up.')).toBeVisible();
    await expect(sellerBoard.getByText(/listed by you/)).toBeVisible();

    // The other side of the board
    await grantGold(buyer, 100);

    const buyerBoard = await openPanel(buyer.page, 'Auctions');
    const lot = lotOf(buyerBoard, seller);

    await expect(lot).toBeVisible({ timeout: 20_000 });
    await expect(lot.getByText('Master Ball')).toBeVisible();
    await bid(buyerBoard, lot, 10);

    // The gold left the bidder's purse as the bid was made rather than
    // when the lot closed: a standing bid is always paid for
    await expect(buyerBoard.getByText('90 gold', { exact: true })).toBeVisible();

    await closeBidding(seller.uid);

    // Nothing happens at the closing instant — the winner collects
    // when they come back for it
    const collect = lot.getByRole('button', { name: 'Collect' });

    await expect(collect).toBeVisible({ timeout: 20_000 });
    await expect(lot.getByText('won for 10 gold')).toBeVisible();
    await collect.click();
    await expect(buyerBoard.getByText('Collected.')).toBeVisible();

    // The ball is in the winner's bag
    await buyerBoard.getByRole('button', { name: 'Close' }).click();

    const bag = await openPanel(buyer.page, 'Inventory');

    await expect(bag.getByText('Master Ball')).toBeVisible();

    // And the purse is the seller's, paid when the winner collected
    await expect(sellerBoard.getByText('10 gold', { exact: true })).toBeVisible({
      timeout: 20_000,
    });
  });

  test('a pokemon goes up, is bid on, and lands in the winner`s box', async ({ browser }) => {
    const seller = await arrive(browser);
    const buyer = await arrive(browser);

    // A flawless copy of whatever the seller was handed. Perfect values
    // are one of the four things that make a pokemon worth a day of the
    // board, and the copy leaves them a second pokemon — nobody may
    // list their last one
    const [starter] = await findDocuments('caught', 'owner', seller.uid);

    expect(starter, 'the starter should be there').toBeTruthy();
    await writeDocument('caught', `flawless-${seller.uid}`, {
      ...starter.fields,
      ivs: { integerValue: String(PERFECT_IVS) },
      auctionable: { booleanValue: true },
      caughtAt: { stringValue: new Date().toISOString() },
    });
    await seller.page.reload();

    const sellerBoard = await openPanel(seller.page, 'Auctions');

    await sellerBoard.getByRole('button', { name: 'Add' }).click();

    // The records are a box of squares rather than a list of names, so
    // the one thing worth listing is pressed where it sits. It is the
    // only square: everything that does not qualify is left out
    const box = sellerBoard.getByRole('application', { name: /^Box of pokemon/ });

    await expect(box).toBeVisible();

    const bounds = await box.boundingBox();

    await box.click({ position: { x: (bounds?.width ?? 0) / 12, y: (bounds?.height ?? 0) / 10 } });
    await putItUp(seller.page, /^Auction /, 5);

    await expect(sellerBoard.getByText('It is on the block until the day is up.')).toBeVisible();

    await grantGold(buyer, 100);

    const buyerBoard = await openPanel(buyer.page, 'Auctions');
    const lot = lotOf(buyerBoard, seller);

    // What a bidder is buying: the values, said as stars rather than as
    // six numbers
    await expect(lot).toBeVisible({ timeout: 20_000 });
    await expect(lot.getByText('★★★★★★')).toBeVisible();
    await bid(buyerBoard, lot, 20);

    await closeBidding(seller.uid);

    const collect = lot.getByRole('button', { name: 'Collect' });

    await expect(collect).toBeVisible({ timeout: 20_000 });
    await collect.click();
    await expect(buyerBoard.getByText('Collected.')).toBeVisible();

    // Two pokemon in the winner's box now: the one they were handed and
    // the one they won
    await buyerBoard.getByRole('button', { name: 'Close' }).click();

    const catches = await openPanel(buyer.page, 'Catches');

    await expect(
      catches.getByRole('application', { name: /^Box of pokemon, 2 of 30 squares filled/ }),
    ).toBeVisible();
  });
});
