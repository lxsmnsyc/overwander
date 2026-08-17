import { expect, test } from '@playwright/test';
import { claimStarter, expectShut, openPanel, signIn } from './game';
import { stageSeller } from './stranger';

/**
 * The board: what is up for auction, and the one thing to do about it
 * that is not reading it.
 *
 * A fresh emulator has an empty board, and that is the interesting
 * state rather than a hole in the coverage — the list has to stand up
 * and say it is empty rather than leaving the panel looking broken.
 */

test.describe('the auction board', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await claimStarter(page);
  });

  test('draws its lots as trays of squares rather than a list of names', async ({ page }) => {
    // Somebody else's lot, so the board has something on it whatever
    // the emulator was left holding
    const seller = await stageSeller('Bracken');
    const board = await openPanel(page, 'Auctions');

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

  test('offers selling from the top bar rather than from the bottom of the list', async ({
    page,
  }) => {
    const board = await openPanel(page, 'Auctions');
    const add = board.getByRole('button', { name: 'Add' });

    // Beside the heading, which is the top of the panel
    const heading = board.getByText('Auctions', { exact: true });
    const above = await add.boundingBox();
    const named = await heading.boundingBox();

    await expect(add).toBeVisible();
    expect(Math.abs((above?.y ?? 0) - (named?.y ?? 0))).toBeLessThan(40);

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
    const board = await openPanel(page, 'Auctions');

    await board.getByRole('button', { name: 'Close' }).click();
    await expectShut(board);
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
  });
});
