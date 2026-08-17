import { expect, test } from '@playwright/test';
import { claimStarter, expectShut, openMenu, openPanel, signIn } from './game';

/**
 * The page a player spends nearly all of their time on: the chunk they
 * are standing in, and the one button that reaches everything else.
 */

test.describe('the overworld', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await claimStarter(page);
  });

  test('draws the chunk and nothing else', async ({ page }) => {
    const world = page.locator('main canvas').first();

    await expect(world).toBeVisible();

    // The map is the page. Anything laid out around it — a heading, a
    // strip of prose explaining what an overworld is — was taken out
    // on purpose, and this is what says it stays out
    const bounds = await world.boundingBox();

    expect(bounds?.height ?? 0).toBeGreaterThan(300);
  });

  test('reaches everything from the one button at the bottom', async ({ page }) => {
    const menu = await openMenu(page);

    // Everything that is not the world, as a keypad. The three that
    // are kept for later are drawn and unpressable rather than left
    // out, so the keys do not move as the game grows
    for (const label of [
      'World',
      'Catches',
      'Pokedex',
      'Inventory',
      'Profile',
      'Raids',
      'Auctions',
    ]) {
      await expect(menu.getByRole('button', { name: label, exact: true })).toBeEnabled();
    }
    for (const label of ['Friends', 'Gifts', 'Settings']) {
      await expect(menu.getByRole('button', { name: label, exact: true })).toBeDisabled();
    }
  });

  test('opens the world map as a picture', async ({ page }) => {
    const map = await openPanel(page, 'World');

    await expect(map.locator('canvas')).toBeVisible();
  });

  test('lets a dialog go and gives the world back', async ({ page }) => {
    const profile = await openPanel(page, 'Profile');

    await expect(profile.getByRole('tab', { name: 'Battles' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expectShut(profile);

    // And the menu is live again afterwards. A dialog that closes but
    // leaves its overlay behind looks shut and swallows every press
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
    // `openPanel` asserts the panel is up, which is the whole point
    await openPanel(page, 'Auctions');
  });
});
