import { expect, test } from '@playwright/test';
import { claimStarter, openPanel, signIn } from './game';

/**
 * The bag, with pictures in it.
 *
 * The pictures are CSS backgrounds off a sheet rather than anything
 * drawn, and a background cannot be asserted on by what it shows. So
 * this asserts the two things around it that a broken icon would
 * break: that the square holds a picture at all, and that it has been
 * given room. The bag is a tray of pictures with no names on it, so an
 * icon that failed to load leaves a square with nothing in it.
 */

test.describe('item icons', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await claimStarter(page);
  });

  test('draws a picture beside everything in the bag', async ({ page }) => {
    const bag = await openPanel(page, 'Bag');

    const balls = bag.getByRole('button', { name: /^Poke Ball, \d+ carried/ });
    // The sheet is a background on a span, and the span is only there
    // once the sheet it names has loaded
    const icon = balls.locator('[style*="background-image"]').first();

    await expect(icon).toBeVisible();
    await expect(icon).toHaveCSS('background-repeat', 'no-repeat');

    // Square, and given room: a square of a tray fills its share of
    // the grid, so what is asserted is the shape rather than a number
    const bounds = await icon.boundingBox();

    expect(bounds?.width ?? 0).toBeGreaterThan(0);
    expect(bounds?.height ?? 0).toBeCloseTo(bounds?.width ?? 0, 0);
  });
});
