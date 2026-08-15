import { expect, test } from '@playwright/test';
import { Items } from '../src/data/ids/items';
import { patchDocument, uidOf } from './emulator';
import { SHEET, dialogNamed, dismissGift, expectOpen, openCatch, signIn } from './game';

/**
 * A PP Up, spent.
 *
 * It is the one kind of item that asks a question back before it is
 * spent: a bottle goes on **one** move, nothing takes the points off
 * again, and which move is the player's decision rather than the
 * game's. So the spec watches for the thing that would be worst to get
 * wrong — that pressing the item in the bag spends nothing until the
 * move has been chosen and confirmed.
 *
 * The bottle is written into the bag rather than found: it is a
 * shop item at ten thousand gold, and a new account has neither.
 */

const INCREASE = 'Increase PP';

test.describe('a PP Up', () => {
  test('is spent on a chosen move, and only once it is confirmed', async ({ page }) => {
    const player = await signIn(page);

    await dismissGift(page);
    await patchDocument('bags', await uidOf(player), {
      items: { mapValue: { fields: { [String(Items.PPUp)]: { integerValue: '2' } } } },
    });
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();

    const sheet = await openCatch(page);

    // The bag, filtered to what would do this pokemon any good
    await sheet.getByRole('button', { name: /Actions/ }).click();
    await page.getByRole('menuitem', { name: 'Use item' }).click();
    await sheet.getByRole('button', { name: /^Use PP Up,/ }).click();

    // Nothing has been spent yet: the item asks which move first
    const asked = dialogNamed(page, INCREASE);

    await expectOpen(asked);

    // Backing out leaves the bag as it was, which is the whole point of
    // asking
    await asked.getByRole('button', { name: 'Cancel' }).click();
    await expect(asked).not.toBeAttached();

    await sheet.getByRole('button', { name: /Actions/ }).click();
    await page.getByRole('menuitem', { name: 'Use item' }).click();
    // Both bottles still in the bag: backing out of the question spent
    // nothing, and the square in the bag is what says how many are left
    await expect(sheet.getByRole('button', { name: /^Use PP Up, 2 carried/ })).toBeVisible();

    // Round again, and through it this time
    await sheet.getByRole('button', { name: /^Use PP Up,/ }).click();
    await expectOpen(asked);

    // Every move it knows, with what the points would buy: the wait
    // between casts is shorter, so the PP goes up
    await expect(asked.getByText(/\d+ → \d+ PP/).first()).toBeVisible();
    await asked.getByRole('button', { name: 'Use PP Up' }).click();

    // What it came to, said back on the sheet behind
    await expect(asked).not.toBeAttached();
    await expect(dialogNamed(page, SHEET).getByText(/carries 1 of 3/)).toBeVisible();
  });
});
