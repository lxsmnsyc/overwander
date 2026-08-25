import { expect, test } from '@playwright/test';
import { claimStarter, signIn } from './game';

// Temporary probe: screenshot the board to eyeball sea blending.
test('shows the chunk', async ({ page }) => {
  await signIn(page);
  await claimStarter(page);

  const world = page.locator('main canvas').first();

  await expect(world).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/__blend.png' });
});
