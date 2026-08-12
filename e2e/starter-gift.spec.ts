import { expect, test } from '@playwright/test';
import { CLAIMED, GIFT, dialogNamed, expectOpen, expectShut, offCentre, signIn } from './game';

/**
 * The first thing that happens to anybody.
 *
 * A new player has no pokemon, and a game whose every screen is about
 * pokemon has nothing to show them. So the world hands one over before
 * they have done anything to earn it, with the balls to catch the next
 * one, and says so in the only dialog in the game that asks nothing.
 */

test.describe('the starter gift', () => {
  test('greets a new player with a pokemon and the balls to catch more', async ({ page }) => {
    await signIn(page);

    const gift = dialogNamed(page, GIFT);

    await expectOpen(gift, CLAIMED);
    // Exactly, because the sentence a screen reader is given starts
    // with the same word and would match a loose search as well
    await expect(gift.getByText('Congratulations!', { exact: true })).toBeVisible();

    // What it is, written the way the sheet writes it
    await expect(gift.getByText(/^Lv\. \d+ /)).toBeVisible();
    // And what came with it
    await expect(gift.getByText(/Poke Ball × \d+/)).toBeVisible();

    await gift.getByRole('button', { name: 'Thanks' }).click();
    await expectShut(gift);
  });

  test('names itself in the middle of the panel', async ({ page }) => {
    await signIn(page);

    const gift = dialogNamed(page, GIFT);
    const title = gift.getByText(GIFT);

    await expectOpen(gift, CLAIMED);
    await expect(title).toBeVisible();
    expect(await offCentre(gift, title)).toBeLessThan(4);
  });

  test('is given once and not again', async ({ page }) => {
    const player = await signIn(page);
    const gift = dialogNamed(page, GIFT);

    await expectOpen(gift, CLAIMED);
    await gift.getByRole('button', { name: 'Thanks' }).click();
    await expectShut(gift);

    // Coming back is not another pokemon. The claim is written down
    // server-side, and a reload that handed out a second starter would
    // be a way to farm them
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thanks' })).toBeHidden();

    expect(player.email).toContain('@example.com');
  });
});
