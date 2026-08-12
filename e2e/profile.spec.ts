import { expect, test } from '@playwright/test';
import { dismissGift, openBar, signIn } from './game';

/**
 * Everything the player owns, behind one button on the bar.
 *
 * A new account is a known quantity — one pokemon, twenty balls, no
 * battles and no bids — so the profile is the one screen a browser
 * test can assert real numbers against rather than "something
 * appeared". That is what makes it worth testing: it is where the
 * starter grant either happened or did not.
 */

test.describe('the profile', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissGift(page);
  });

  test('says who the player is and what they are worth', async ({ page }) => {
    const profile = await openBar(page, 'Profile');

    await expect(profile.getByText(/\d+ gold/)).toBeVisible();
    await expect(profile.getByRole('button', { name: 'Sign out' })).toBeVisible();

    for (const tab of ['Catches', 'Inventory', 'Battles', 'Bids']) {
      await expect(profile.getByRole('tab', { name: tab })).toBeVisible();
    }
  });

  test('draws the catches as a box rather than a list of names', async ({ page }) => {
    const profile = await openBar(page, 'Profile');

    await profile.getByRole('tab', { name: 'Catches' }).click();

    const box = profile.locator('canvas');

    await expect(box).toBeVisible();

    // Wide enough to be a box of squares. A canvas that failed to be
    // measured draws itself one pixel wide and is otherwise visible
    const bounds = await box.boundingBox();

    expect(bounds?.width ?? 0).toBeGreaterThan(200);
  });

  test('carries the balls a new player was handed', async ({ page }) => {
    const profile = await openBar(page, 'Profile');

    await profile.getByRole('tab', { name: 'Inventory' }).click();
    await expect(profile.getByText(/Poke Ball/)).toBeVisible();
  });

  test('has nothing to show under battles or bids yet', async ({ page }) => {
    const profile = await openBar(page, 'Profile');

    await profile.getByRole('tab', { name: 'Battles' }).click();
    await expect(profile.getByText('No battles fought yet.')).toBeVisible();

    await profile.getByRole('tab', { name: 'Bids' }).click();
    await expect(profile.getByText('You have not bid on anything.')).toBeVisible();
  });

  test('signs out back to the way in', async ({ page }) => {
    const profile = await openBar(page, 'Profile');

    await profile.getByRole('button', { name: 'Sign out' }).click();

    // The world is gone and the form is back. Signing out from inside
    // the profile means the dialog is unmounted along with the page
    // that held it, which is the part worth watching
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeHidden();
  });
});
