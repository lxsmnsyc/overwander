import { type Page, expect, test } from '@playwright/test';
import {
  CLAIMED,
  GIFT,
  claimStarter,
  expectShut,
  openBox,
  openPanel,
  openShelfTab,
  reloadGame,
  signIn,
} from './game';

/**
 * The first thing that happens to anybody.
 *
 * A new player has no pokemon, and a game whose every screen is about
 * pokemon has nothing to show them. So the three a trainer has always
 * started from stand on every shelf, with the balls to catch the next
 * one, and wait there until somebody comes for them.
 */

test.describe('the starter gift', () => {
  test('waits on the shelf for a new player', async ({ page }) => {
    await signIn(page);

    const gifts = await openPanel(page, GIFT);
    const pokemon = gifts.getByRole('button', { name: /^Claim Lv\./ });

    await expect(pokemon.first()).toBeVisible({ timeout: CLAIMED });
    // Every starter stands on the shelf, so there is more than one to pick from
    expect(await pokemon.count()).toBeGreaterThan(1);

    // What is waiting is read on the box's own card: the same level,
    // stars and moves a pokemon already in the box is read by
    const square = await pokemon.first().boundingBox();

    expect(square).not.toBeNull();
    // Moved to rather than hovered: the card that opens covers the square, and
    // a hover that finds something over its target tries again for ever
    await page.mouse.move(
      (square?.x ?? 0) + (square?.width ?? 0) / 2,
      (square?.y ?? 0) + (square?.height ?? 0) / 2,
    );

    const card = page.getByRole('dialog', { name: 'Gift', exact: true });

    await expect(card).toBeVisible();
    await expect(card.getByText(/^Lv\. \d+$/)).toBeVisible();
    await expect(card.getByRole('img', { name: /\d of \d stars/ })).toBeVisible();
    await expect(card.getByText('A first partner, for a trainer with none.')).toBeVisible();

    // The balls are a gift of their own, on the shelf's other tab
    await openShelfTab(page, gifts, 'Items');
    await expect(gifts.getByRole('button', { name: /^Claim \d+ × Poke Ball/ })).toBeVisible();
  });

  test('hands over one pokemon and the balls, once', async ({ page }) => {
    await signIn(page);

    const waiting = await countWaiting(page);

    await claimStarter(page);

    // One square in the box, and it is the pokemon that was waiting
    const box = await openBox(page);

    await expect(box.getByRole('button', { name: /Lv\. \d+/ })).toHaveCount(1);
    await page.getByRole('button', { name: 'Close' }).last().click();

    const bag = await openPanel(page, 'Bag');

    const square = bag.getByRole('button', { name: /Poke Ball, \d+ carried/ });

    await expect(square).toBeVisible();

    // A square's tooltip goes when the square leaves the page. Nothing
    // sends a mouse-leave for that, so it would be left over whatever
    // took the square's place
    const tooltip = page.getByRole('tooltip');

    await page.mouse.move(0, 0);
    await square.hover();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
    await square.evaluate((node) => {
      node.closest('li, div')?.remove();
    });
    await expect(tooltip).toBeHidden();

    // Coming back is not the same gift again. A claim is written down
    // server-side, and a reload that offered what was already taken
    // would be a way to farm it
    await reloadGame(page);

    const gifts = await openPanel(page, GIFT);
    const pokemon = gifts.getByRole('button', { name: /^Claim Lv\./ });

    // The ones that were not taken are still standing there; the one
    // that was, and the balls, are gone
    await expect(pokemon).toHaveCount(waiting - 1, { timeout: CLAIMED });
    await openShelfTab(page, gifts, 'Items');
    await expect(gifts.getByRole('button', { name: /^Claim \d+ × Poke Ball/ })).toHaveCount(0);
  });
});

/** How many starters stand on a new player's shelf */
async function countWaiting(page: Page): Promise<number> {
  const gifts = await openPanel(page, GIFT);
  const pokemon = gifts.getByRole('button', { name: /^Claim Lv\./ });

  await expect(pokemon.first()).toBeVisible({ timeout: CLAIMED });

  const count = await pokemon.count();

  await gifts.getByRole('button', { name: 'Close' }).click();
  await expectShut(gifts);
  return count;
}
