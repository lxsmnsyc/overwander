import { type Browser, type Locator, type Page, expect, test } from '@playwright/test';
import { PERFECT_IVS } from '../src/data/constants/stats';
import { Items } from '../src/data/ids/items';
import { findRows, insertRow, patchRow, setBagItem, setGold, uidOf } from './admin';
import {
  type Player,
  claimStarter,
  dialogNamed,
  expectOpen,
  openPanel,
  pressBoxSquare,
  signIn,
} from './game';

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

  await claimStarter(page);
  return { page, player, uid: await uidOf(player) };
}

/**
 * Put gold in a player's purse. It is a server-only field — a client
 * that could write it could mint its own bids — so it is written as
 * the emulator's owner
 */
async function grantGold(trader: Trader, gold: number): Promise<void> {
  await setGold(trader.uid, gold);
  await trader.page.reload();
  await expect(trader.page.getByRole('navigation', { name: 'Game' })).toBeVisible();
}

/**
 * Wind a seller's lot back so bidding has closed. Nothing runs at that
 * instant — a closed lot is only one nobody may bid on any more — so
 * moving the time is the whole of what "a day later" means here
 */
async function closeBidding(sellerUid: string): Promise<void> {
  const [auction] = await findRows('auctions', 'seller', sellerUid);

  expect(auction, 'the listing should have written an auction').toBeTruthy();
  await patchRow('auctions', 'id', String(auction.id), { ends_at: Date.now() - 60_000 });
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
 * The seller's lot on the board: a square with a picture on it, in the
 * tray its kind belongs to. Squares are announced with who listed them,
 * and no two runs share a name
 */
function lotOf(board: Locator, seller: Trader, kind: 'item' | 'catch'): Locator {
  return board.getByRole(kind === 'item' ? 'button' : 'img', {
    name: new RegExp(`by ${nicknameOf(seller)}`),
  });
}

/**
 * Everything a lot has to say, and every button it offers: the card that
 * comes up when the pointer rests on its square.
 *
 * The pointer is taken away first, because hovering where it already is
 * moves nothing and opens nothing — a card is opened by *arriving* at a
 * square
 */
async function cardOf(page: Page, lot: Locator): Promise<Locator> {
  await expect(lot).toBeVisible({ timeout: 20_000 });
  await page.mouse.move(0, 0);
  await lot.hover();

  const card = page.getByRole('dialog', { name: 'Info' });

  await expect(card).toBeVisible();
  return card;
}

/**
 * Bid on it, and wait for the bid to land. The floor is the seller's
 * opening bid; anything up to what the bidder holds is legal, so the
 * amount is typed rather than nudged
 */
async function bid(page: Page, board: Locator, lot: Locator, amount: number): Promise<void> {
  // The card carries one bid button, wearing the floor as a badge; the
  // amount itself is named in the dialog it opens
  await (await cardOf(page, lot)).getByRole('button', { name: /^Bid/ }).click();

  const naming = dialogNamed(page, /^Bid on /);

  await expectOpen(naming);
  await naming.getByLabel('Bid').fill(String(amount));
  await naming.getByRole('button', { name: `Bid ${amount} gold` }).click();
  await expect(
    board.getByText(`Bid ${amount} gold — it is yours unless somebody raises it.`),
  ).toBeVisible();
}

/**
 * Narrow a board to one seller's lots. The board accumulates a lot per
 * run for as long as the stack lives, and a closed lot re-sorts the
 * squares under a pointer already aimed at one — searched down to one
 * seller, the square being read is the only square there is.
 *
 * The seller's own lot is waited for first: the search box only draws
 * once the board is long enough to need one, so a board still arriving
 * has neither. A short board has no box and needs no narrowing
 */
async function narrowTo(board: Locator, seller: Trader, lot: Locator): Promise<void> {
  await expect(lot).toBeVisible({ timeout: 20_000 });

  const search = board.getByRole('searchbox');

  if (await search.isVisible()) {
    await search.fill(nicknameOf(seller));
  }
}

/**
 * The purse badge at the head of a board. Asked for as the first match
 * because a lot's square wears its price in the same words, and the
 * shared board can be holding somebody's lot at exactly this figure —
 * the badge is drawn above the trays, so it is always first
 */
function purseOf(board: Locator, gold: number): Locator {
  return board.getByText(`${gold} gold`, { exact: true }).first();
}

test.describe('the auction house', () => {
  test('an item goes up, is bid on, and is collected', async ({ browser }) => {
    const seller = await arrive(browser);
    const buyer = await arrive(browser);

    // A Master Ball: the special band, which is the only band the
    // block takes
    await setBagItem(seller.uid, Items.MasterBall, 1);
    await seller.page.reload();

    const sellerBoard = await openPanel(seller.page, 'Auctions');

    await sellerBoard.getByRole('button', { name: 'Add' }).click();
    // The bag is a tray of pictures, so the square says what pressing
    // it does and how many are in it
    await sellerBoard.getByRole('button', { name: /^Sell Master Ball,/ }).click();
    await putItUp(seller.page, /^Auction Master Ball$/, 5);

    // Listed: the board comes back with the lot on it, on the tray the
    // items are kept in and under the seller's own name
    await expect(sellerBoard.getByRole('button', { name: /^Master Ball —.*by you/ })).toBeVisible();

    // The other side of the board
    await grantGold(buyer, 100);

    const buyerBoard = await openPanel(buyer.page, 'Auctions');

    const lot = lotOf(buyerBoard, seller, 'item');

    await narrowTo(buyerBoard, seller, lot);

    // What it is and whose it is, in the card the square puts up
    const card = await cardOf(buyer.page, lot);

    await expect(card.getByText('Master Ball')).toBeVisible();
    await expect(card.getByText(nicknameOf(seller))).toBeVisible();
    await bid(buyer.page, buyerBoard, lot, 10);

    // The gold left the bidder's purse as the bid was made rather than
    // when the lot closed: a standing bid is always paid for
    await expect(purseOf(buyerBoard, 90)).toBeVisible();

    await closeBidding(seller.uid);

    // Nothing happens at the closing instant — the winner collects
    // when they come back for it. The square wears what it went for and
    // the card carries the way to take it
    await expect(lot.getByText('won for 10 gold')).toBeVisible({ timeout: 20_000 });

    const won = await cardOf(buyer.page, lot);
    const collect = won.getByRole('button', { name: 'Collect' });

    await expect(collect).toBeVisible({ timeout: 20_000 });
    await collect.click();
    await expect(buyerBoard.getByText('Collected.')).toBeVisible();

    // The ball is in the winner's bag
    await buyerBoard.getByRole('button', { name: 'Close' }).click();

    const bag = await openPanel(buyer.page, 'Inventory');

    await expect(bag.getByRole('button', { name: /^Master Ball, 1 carried/ })).toBeVisible();

    // And the purse is the seller's, paid when the winner collected
    await expect(purseOf(sellerBoard, 10)).toBeVisible({ timeout: 20_000 });
  });

  test('a pokemon goes up, is bid on, and lands in the winner`s box', async ({ browser }) => {
    const seller = await arrive(browser);
    const buyer = await arrive(browser);

    // A flawless copy of whatever the seller was handed. Perfect values
    // are one of the four things that make a pokemon worth a day of the
    // board, and the copy leaves them a second pokemon — nobody may
    // list their last one
    const [starter] = await findRows('caught', 'owner', seller.uid);

    expect(starter, 'the starter should be there').toBeTruthy();
    await insertRow('caught', {
      ...starter,
      id: `flawless-${seller.uid}`,
      ivs: PERFECT_IVS,
      auctionable: true,
    });
    await seller.page.reload();

    const sellerBoard = await openPanel(seller.page, 'Auctions');

    await sellerBoard.getByRole('button', { name: 'Add' }).click();

    // The records are a box of squares rather than a list of names, so
    // the one thing worth listing is taken from its card. It is the only
    // square: everything that does not qualify is left out
    const box = sellerBoard.getByRole('group', { name: /^Box of pokemon/ });

    await expect(box).toBeVisible();
    await pressBoxSquare(seller.page, box, 'Sell');
    await putItUp(seller.page, /^Auction /, 5);

    await expect(sellerBoard.getByRole('img', { name: /by you/ })).toBeVisible({
      timeout: 20_000,
    });

    await grantGold(buyer, 100);

    const buyerBoard = await openPanel(buyer.page, 'Auctions');

    const lot = lotOf(buyerBoard, seller, 'catch');

    await narrowTo(buyerBoard, seller, lot);

    // What a bidder is buying, on the card the square puts up: the
    // values, said as stars rather than as six numbers
    const card = await cardOf(buyer.page, lot);

    await expect(card.getByText('★★★★★★')).toBeVisible();
    await bid(buyer.page, buyerBoard, lot, 20);

    await closeBidding(seller.uid);

    const won = await cardOf(buyer.page, lot);
    const collect = won.getByRole('button', { name: 'Collect' });

    await expect(collect).toBeVisible({ timeout: 20_000 });
    await collect.click();
    await expect(buyerBoard.getByText('Collected.')).toBeVisible();

    // Two pokemon in the winner's box now: the one they were handed and
    // the one they won
    await buyerBoard.getByRole('button', { name: 'Close' }).click();

    const catches = await openPanel(buyer.page, 'Catches');

    await expect(
      catches.getByRole('group', { name: /^Box of pokemon, 2 of 30 squares filled/ }),
    ).toBeVisible();
  });
});
