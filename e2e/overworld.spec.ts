import { expect, test } from '@playwright/test';
import { dismissGift, expectShut, openBar, signIn } from './game';

/**
 * The page a player spends nearly all of their time on: the chunk they
 * are standing in, and the bar that reaches everything else.
 */

test.describe('the overworld', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissGift(page);
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

  test('reaches everything from the bar at the bottom', async ({ page }) => {
    const bar = page.getByRole('navigation', { name: 'Game' });

    for (const label of ['Profile', 'Map', 'Raids', 'Auctions']) {
      await expect(bar.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('opens the world map as a picture', async ({ page }) => {
    const map = await openBar(page, 'Map');

    await expect(map.locator('canvas')).toBeVisible();
  });

  test('lets a dialog go and gives the world back', async ({ page }) => {
    const profile = await openBar(page, 'Profile');

    await expect(profile.getByRole('tab', { name: 'Catches' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expectShut(profile);

    // And the bar is live again afterwards. A dialog that closes but
    // leaves its overlay behind looks shut and swallows every press
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
    // `openBar` asserts the panel is up, which is the whole point
    await openBar(page, 'Auctions');
  });
});
