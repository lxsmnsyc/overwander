import { expect, test } from '@playwright/test';
import { dismissGift, expectShut, openPanel, signIn } from './game';
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
    await dismissGift(page);
  });

  test('is one list, whatever is standing on the lots', async ({ page }) => {
    // Somebody else's lot, so the board has something on it whatever
    // the emulator was left holding
    const seller = await stageSeller('Bracken');
    const board = await openPanel(page, 'Auctions');

    await expect(board.getByText('Loading auctions…')).toBeHidden({ timeout: 20_000 });
    await expect(board.getByRole('listitem').filter({ hasText: seller.nickname })).toBeVisible({
      timeout: 20_000,
    });

    // One list rather than a column for items and a column for
    // pokemon: a board is read in the order things were listed, and
    // sorting it by what a lot happens to be is sorting it by the one
    // thing a bidder is not looking for. It carries no heading of its
    // own either — the dialog is already called Auctions
    await expect(board.getByRole('heading', { name: 'Items' })).toBeHidden();
    await expect(board.getByRole('heading', { name: 'Pokemon', exact: true })).toBeHidden();
    await expect(board.getByRole('list')).toHaveCount(1);
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
