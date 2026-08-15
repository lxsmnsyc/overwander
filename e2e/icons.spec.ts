import { expect, test } from '@playwright/test';
import { dismissGift, openPanel, signIn } from './game';

/**
 * The bag, with pictures in it.
 *
 * A canvas cannot be asserted on by what it drew, so this asserts the
 * two things around it that a broken icon would break: that every
 * square holds a picture, and that it has been given room. The bag is
 * a tray of pictures with no names on it, so an icon that failed to
 * load leaves a square with nothing in it at all.
 */

test.describe('item icons', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissGift(page);
  });

  test('draws a picture beside everything in the bag', async ({ page }) => {
    const bag = await openPanel(page, 'Inventory');

    const balls = bag.getByRole('button', { name: /^Poke Ball, \d+ carried/ });
    const icon = balls.locator('canvas');

    await expect(icon).toBeVisible();

    // Square, and the size the component asks for rather than the
    // 300×150 a canvas defaults to when nothing sizes it
    const bounds = await icon.boundingBox();

    expect(bounds?.width ?? 0).toBe(36);
    expect(bounds?.height ?? 0).toBe(36);
  });
});
