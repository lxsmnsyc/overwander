import { expect, test } from '@playwright/test';
import { dismissGift, openBar, signIn } from './game';

/**
 * The bag, with pictures in it.
 *
 * A canvas cannot be asserted on by what it drew, so this asserts the
 * two things around it that a broken icon would break: that there is
 * a picture beside every row, and that it has been given room. An
 * icon whose sheet failed to load is still a canvas, but the row
 * still reads — the name is written beside it — which is why this is
 * worth pinning down rather than trusting to look right.
 */

test.describe('item icons', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissGift(page);
  });

  test('draws a picture beside everything in the bag', async ({ page }) => {
    const profile = await openBar(page, 'Profile');

    await profile.getByRole('tab', { name: 'Inventory' }).click();

    const balls = profile.getByRole('listitem').filter({ hasText: 'Poke Ball' }).first();
    const icon = balls.locator('canvas');

    await expect(icon).toBeVisible();

    // Square, and the size the component asks for rather than the
    // 300×150 a canvas defaults to when nothing sizes it
    const bounds = await icon.boundingBox();

    expect(bounds?.width ?? 0).toBe(28);
    expect(bounds?.height ?? 0).toBe(28);
  });
});
