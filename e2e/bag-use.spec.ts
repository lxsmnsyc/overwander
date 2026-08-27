import { expect, test } from '@playwright/test';
import { Items } from '../src/data/ids/items';
import { setBagItem, uidOf } from './admin';
import {
  SHEET,
  claimStarter,
  dialogNamed,
  expectOpen,
  expectShut,
  openPanel,
  pressBoxSquare,
  signIn,
} from './game';

/**
 * An item spent out of the bag.
 *
 * The bag asks item first and pokemon second, and the press on the
 * pokemon is the last one: what it comes to is a line of toast over
 * the bag the player is already standing in. It used to hand the pair
 * to the catch sheet and let that do the spending, which meant every
 * potion opened a whole screen about the pokemon it was spent on and
 * left the player to close their way back out.
 *
 * The candy is written into the bag rather than found: it is a rare
 * drop, and a new account has none.
 */

test.describe('using an item out of the bag', () => {
  test('spends it where the player is standing', async ({ page }) => {
    const player = await signIn(page);

    await claimStarter(page);
    await setBagItem(await uidOf(player), Items.RareCandy, 2);
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();

    const bag = await openPanel(page, 'Inventory');

    await bag.getByRole('button', { name: /^Rare Candy, 2 carried/ }).click();

    // Which pokemon it goes on, and the last press
    const picker = dialogNamed(page, 'Use it on');

    await expectOpen(picker);
    await pressBoxSquare(page, picker, 'Use');

    await expectShut(picker);
    // The whole of it: the record is not a screen the bag walks into
    await expect(dialogNamed(page, SHEET)).not.toBeAttached();

    // What it came to, said over the bag
    await expect(page.getByText(/^Grew to level \d+\.$/)).toBeVisible();

    // And the bag is still the bag, with one candy fewer in it
    await expect(bag.getByRole('button', { name: /^Rare Candy, 1 carried/ })).toBeVisible();
  });
});
