import { expect, test } from '@playwright/test';
import { type Player, claimStarter, expectShut, signIn } from './game';
import { openAuctionBoard } from './walk';
import { clearAuctions } from './admin';
import { stageSeller } from './stranger';

/**
 * The board: what is up for auction, and the one thing to do about it
 * that is not reading it.
 *
 * A fresh emulator has an empty board, and that is the interesting
 * state rather than a hole in the coverage — the list has to stand up
 * and say it is empty rather than leaving the panel looking broken.
 */

let player: Player;

test.describe('the auction board', () => {
  test.beforeEach(async ({ page }) => {
    // The board is global and nothing expires a lot, so what previous
    // runs left on it would be on it still — and a spec that hovers
    // one seller's lot would find several
    await clearAuctions();
    player = await signIn(page);
    await claimStarter(page);
  });

  test('draws its lots as trays of squares rather than a list of names', async ({ page }) => {
    // Somebody else's lot, so the board has something on it whatever
    // the emulator was left holding
    const seller = await stageSeller('Bracken');
    const board = await openAuctionBoard(page, player);

    await expect(board.getByText('Loading auctions…')).toBeHidden({ timeout: 20_000 });

    // The same trays the rest of the game keeps these things in: an
    // item lot is a square of the bag, a pokemon lot is a square of the
    // box. A lot is recognised by its picture rather than read
    const square = board.getByRole('button', {
      name: new RegExp(`^Poke Ball —.*by ${seller.nickname}`),
    });

    await expect(square).toBeVisible({ timeout: 20_000 });
    await expect(board.getByRole('heading', { name: 'Items' })).toBeVisible();

    // Everything a row used to carry is in the card the square puts up,
    // including whose lot it is and the one thing to do about it
    await square.hover();

    const card = page.getByRole('dialog', { name: 'Info' });

    await expect(card).toBeVisible();
    await expect(card.getByText('Owned by')).toBeVisible();
    await expect(card.getByRole('button', { name: seller.nickname })).toBeVisible();
    await expect(card.getByRole('button', { name: /^Bid/ })).toBeVisible();
  });

  test('offers selling from the panel bar rather than from the bottom of the list', async ({
    page,
  }) => {
    const board = await openAuctionBoard(page, player);
    const add = board.getByRole('button', { name: 'Add' });
    // In the panel's own bar, on the line the way out is on. The lots
    // scroll, and a key at the end of them scrolls away with them
    const leave = board.getByRole('button', { name: 'Close' });

    await expect(add).toBeVisible();

    const adding = await add.boundingBox();
    const leaving = await leave.boundingBox();

    expect(Math.abs((adding?.y ?? 0) - (leaving?.y ?? 0))).toBeLessThan(40);

    await add.click();
    await expect(board.getByRole('heading', { name: 'Sell' })).toBeVisible();

    // Selling takes the whole panel: the lots are put away rather than
    // pushed down, since nobody is shopping and listing at once
    await expect(board.getByText('Search the lots')).toBeHidden();

    // And the key that opened it is the way back
    await board.getByRole('button', { name: 'Board', exact: true }).click();
    await expect(board.getByRole('heading', { name: 'Sell' })).toBeHidden();
  });

  test('closes and gives the world back', async ({ page }) => {
    const board = await openAuctionBoard(page, player);

    await board.getByRole('button', { name: 'Close' }).click();
    await expectShut(board);
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
  });
});
