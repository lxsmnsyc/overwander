import { expect, test } from '@playwright/test';
import { CLAIMED, GIFT, claimStarter, openBox, openPanel, signIn } from './game';

/**
 * The first thing that happens to anybody.
 *
 * A new player has no pokemon, and a game whose every screen is about
 * pokemon has nothing to show them. So the world sets one aside for
 * them, with the balls to catch the next one, and waits on the gift
 * shelf until they come for it.
 */

test.describe('the starter gift', () => {
  test('waits on the shelf for a new player', async ({ page }) => {
    await signIn(page);

    const gifts = await openPanel(page, GIFT);
    const pokemon = gifts.getByRole('img', { name: /^Claim Lv\./ });

    await expect(pokemon).toBeVisible({ timeout: CLAIMED });
    // The balls are a gift of their own rather than a footnote under
    // the pokemon: they are what makes the world playable at all
    await expect(gifts.getByRole('button', { name: /^Claim \d+ × Poke Ball/ })).toBeVisible();

    // What is waiting is named the way the sheet names it
    await pokemon.hover();

    const card = page.getByRole('dialog', { name: 'Gift' });

    await expect(card).toBeVisible();
    await expect(card.getByText(/^Lv\. \d+ /)).toBeVisible();
  });

  test('hands over the pokemon and the balls when they are taken', async ({ page }) => {
    await signIn(page);
    await claimStarter(page);

    // One square in the box, and it is the pokemon that was waiting
    const box = await openBox(page);

    await expect(box.getByRole('button', { name: /Lv\. \d+/ })).toHaveCount(1);
    await page.getByRole('button', { name: 'Close' }).last().click();

    const bag = await openPanel(page, 'Inventory');

    await expect(bag.getByRole('button', { name: /Poke Ball, \d+ carried/ })).toBeVisible();
  });

  test('is given once and not again', async ({ page }) => {
    const player = await signIn(page);

    await claimStarter(page);

    // Coming back is not another pokemon. The gift is marked taken
    // server-side, and a reload that offered a second starter would be
    // a way to farm them
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();

    const gifts = await openPanel(page, GIFT);

    await expect(gifts.getByText('Nothing is waiting for you.')).toBeVisible({ timeout: CLAIMED });
    expect(player.email).toContain('@example.com');
  });
});
