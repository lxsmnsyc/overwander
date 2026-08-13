import { type Page, expect, test } from '@playwright/test';
import { dismissGift, expectShut, openPanel, signIn } from './game';

/**
 * The world, as a picture of where the player is and what is around
 * them.
 *
 * The map derives entirely from the climate noise — no snapshot, no
 * clock, nothing stored — so the camera is free to look anywhere, and
 * the thing worth checking in a browser is that it does: that the
 * arrow keys move it, that Home brings it back, and that the picture
 * itself is a picture rather than a one-pixel canvas that failed to
 * measure the room it was given.
 */

/**
 * Where the camera says it is looking. The map names itself by it, so
 * the label is both what a screen reader hears and the only readable
 * account of a canvas
 */
async function lookingAt(page: Page): Promise<string> {
  return (await page.locator('canvas[aria-label^="World map"]').getAttribute('aria-label')) ?? '';
}

test.describe('the world map', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissGift(page);
  });

  test('opens as a picture of the world', async ({ page }) => {
    const map = await openPanel(page, 'World');
    const picture = map.locator('canvas');

    await expect(picture).toBeVisible();

    const bounds = await picture.boundingBox();

    expect(bounds?.width ?? 0).toBeGreaterThan(300);
    expect(await lookingAt(page)).toContain('chunks across');
  });

  test('pans with the arrow keys and comes back with Home', async ({ page }) => {
    const map = await openPanel(page, 'World');
    const picture = map.locator('canvas');

    await picture.click();

    const home = await lookingAt(page);

    // Shift crosses the world faster, which is what makes one press
    // enough to move the camera off the chunk the player is standing on
    await page.keyboard.press('Shift+ArrowRight');
    await expect
      .poll(async () => lookingAt(page), { message: 'the camera should have moved' })
      .not.toBe(home);

    await page.keyboard.press('Home');
    await expect
      .poll(async () => lookingAt(page), { message: 'Home should come back to the player' })
      .toBe(home);
  });

  test('closes and gives the world back', async ({ page }) => {
    const map = await openPanel(page, 'World');

    await map.getByRole('button', { name: 'Close' }).click();
    await expectShut(map);
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
  });
});
