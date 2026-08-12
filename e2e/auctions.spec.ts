import { expect, test } from '@playwright/test';
import { dismissGift, expectShut, openBar, signIn } from './game';

/**
 * The board: what is up for auction, and the one thing to do about it
 * that is not reading it.
 *
 * A fresh emulator has an empty board, and that is the interesting
 * state rather than a hole in the coverage — the two columns have to
 * stand up and say they are empty, side by side, rather than
 * collapsing into one line of prose.
 */

test.describe('the auction board', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissGift(page);
  });

  test('is two boards side by side, items and pokemon', async ({ page }) => {
    const board = await openBar(page, 'Auctions');

    await expect(board.getByText('Loading auctions…')).toBeHidden({ timeout: 20_000 });

    const items = board.getByRole('heading', { name: 'Items' });
    const pokemon = board.getByRole('heading', { name: 'Pokemon', exact: true });

    await expect(items).toBeVisible();
    await expect(pokemon).toBeVisible();

    // Beside one another rather than stacked: the layout is the whole
    // of what this dialog was rearranged for
    const left = await items.boundingBox();
    const right = await pokemon.boundingBox();

    expect(left?.x ?? 0).toBeLessThan(right?.x ?? 0);
    expect(Math.abs((left?.y ?? 0) - (right?.y ?? 0))).toBeLessThan(4);
  });

  test('offers selling from the top bar rather than from the bottom of the list', async ({
    page,
  }) => {
    const board = await openBar(page, 'Auctions');
    const add = board.getByRole('button', { name: 'Add' });

    // Beside the heading, which is the top of the panel
    const heading = board.getByText('Auctions', { exact: true });
    const above = await add.boundingBox();
    const named = await heading.boundingBox();

    await expect(add).toBeVisible();
    expect(Math.abs((above?.y ?? 0) - (named?.y ?? 0))).toBeLessThan(40);

    await add.click();
    await expect(board.getByRole('heading', { name: 'Sell' })).toBeVisible();
  });

  test('closes and gives the world back', async ({ page }) => {
    const board = await openBar(page, 'Auctions');

    await board.getByRole('button', { name: 'Close' }).click();
    await expectShut(board);
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
  });
});
