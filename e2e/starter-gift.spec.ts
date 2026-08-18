import { expect, test } from '@playwright/test';
import { CLAIMED, GIFT, claimStarter, openBox, openPanel, signIn } from './game';

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
    const pokemon = gifts.getByRole('img', { name: /^Claim Lv\./ });

    await expect(pokemon.first()).toBeVisible({ timeout: CLAIMED });
    // The three starters, waiting for whoever asks
    await expect(pokemon).toHaveCount(3);
    // The balls are a gift of their own rather than a footnote under
    // the pokemon: they are what makes the world playable at all
    await expect(gifts.getByRole('button', { name: /^Claim \d+ × Poke Ball/ })).toBeVisible();

    // What is waiting is read on the box's own card: the same level,
    // stars and moves a pokemon already in the box is read by
    await pokemon.first().hover();

    const card = page.getByRole('dialog', { name: 'Gift' });

    await expect(card).toBeVisible();
    await expect(card.getByText(/^Lv\. \d+$/)).toBeVisible();
    await expect(card.getByRole('img', { name: /\d of \d stars/ })).toBeVisible();
    await expect(card.getByText('A first partner, for a trainer with none.')).toBeVisible();
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

  test('is taken once each and not again', async ({ page }) => {
    const player = await signIn(page);

    await claimStarter(page);

    // Coming back is not the same gift again. A claim is written down
    // server-side, and a reload that offered what was already taken
    // would be a way to farm it
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();

    const gifts = await openPanel(page, GIFT);
    const pokemon = gifts.getByRole('img', { name: /^Claim Lv\./ });

    // The two that were not taken are still standing there; the one
    // that was, and the balls, are gone
    await expect(pokemon).toHaveCount(2, { timeout: CLAIMED });
    await expect(gifts.getByRole('button', { name: /^Claim \d+ × Poke Ball/ })).toHaveCount(0);
    expect(player.email).toContain('@example.com');
  });
});
