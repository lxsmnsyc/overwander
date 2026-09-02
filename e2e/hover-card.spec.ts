import { expect, test } from '@playwright/test';
import { claimStarter, openPanel, signIn } from './game';

/**
 * The card that opens on hover, and the one way out of it that has
 * nothing to do with the pointer.
 *
 * A card is closed by the pointer leaving, which is no help when what
 * the card is about is taken out of the page instead — a row whose
 * list redrew, a square whose stack ran out. Nothing sends a
 * mouse-leave for that, so the card is left standing over whatever
 * took its place.
 */

test.describe('a hover card', () => {
  test('goes when the thing it is about leaves the page', async ({ page }) => {
    await signIn(page);
    await claimStarter(page);

    const bag = await openPanel(page, 'Bag');
    const square = bag.getByRole('button', { name: /^Poke Ball, \d+ carried/ });
    const card = page.getByRole('dialog', { name: /^Info$/ });

    // From a corner first: a hover that moves the pointer nowhere
    // sends no `mouseenter`, and the card never opens
    await page.mouse.move(0, 0);
    await square.hover();
    await expect(card).toBeVisible({ timeout: 5_000 });

    // The whole square goes while the pointer is still on it, which is
    // what a list redrawing under a card looks like from here
    await square.evaluate((node) => {
      node.closest('li, div')?.remove();
    });
    await expect(card).toBeHidden();
  });

  // The same from the other end: here Solid takes the square down
  // itself, and the card has to go with it rather than with the
  // pointer that never left
  test('goes when a search filters its square away', async ({ page }) => {
    await signIn(page);
    await claimStarter(page);

    const bag = await openPanel(page, 'Bag');
    const square = bag.getByRole('button', { name: /^Poke Ball, \d+ carried/ });
    const card = page.getByRole('dialog', { name: /^Info$/ });

    await page.mouse.move(0, 0);
    await square.hover();
    await expect(card).toBeVisible({ timeout: 5_000 });

    await bag.getByRole('searchbox').first().fill('nothing matches this');
    await expect(square).toHaveCount(0);
    await expect(card).toBeHidden();
  });
});
