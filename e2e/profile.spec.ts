import { expect, test } from '@playwright/test';
import { dismissGift, openBox, openPanel, signIn } from './game';

/**
 * Who the player is, and what they were given to start with.
 *
 * A new account is a known quantity — one pokemon, twenty balls, no
 * battles and no bids — so these are the screens a browser test can
 * assert real numbers against rather than "something appeared". That
 * is what makes them worth testing: they are where the starter grant
 * either happened or did not. The pokemon and the bag are panels of
 * their own behind the menu now, so they are opened as such
 */

test.describe('the profile', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissGift(page);
  });

  test('says who the player is and what they are worth', async ({ page }) => {
    const profile = await openPanel(page, 'Profile');

    await expect(profile.getByText(/\d+ gold/)).toBeVisible();
    await expect(profile.getByRole('button', { name: 'Sign out' })).toBeVisible();

    // What is left under the tabs: the catches and the bag are behind
    // the menu now, since neither is a fact about who somebody is
    for (const tab of ['Battles', 'Bids']) {
      await expect(profile.getByRole('tab', { name: tab })).toBeVisible();
    }
  });

  test('draws the catches as a box rather than a list of names', async ({ page }) => {
    const box = await openBox(page);

    // Wide enough to be a box of squares. A canvas that failed to be
    // measured draws itself one pixel wide and is otherwise visible
    const bounds = await box.boundingBox();

    expect(bounds?.width ?? 0).toBeGreaterThan(200);
  });

  test('carries the balls a new player was handed', async ({ page }) => {
    const bag = await openPanel(page, 'Inventory');

    await expect(bag.getByText(/Poke Ball/)).toBeVisible();
  });

  test('has nothing to show under battles or bids yet', async ({ page }) => {
    const profile = await openPanel(page, 'Profile');

    await profile.getByRole('tab', { name: 'Battles' }).click();
    await expect(profile.getByText('No battles fought yet.')).toBeVisible();

    await profile.getByRole('tab', { name: 'Bids' }).click();
    await expect(profile.getByText('You have not bid on anything.')).toBeVisible();
  });

  test('signs out back to the way in', async ({ page }) => {
    const profile = await openPanel(page, 'Profile');

    await profile.getByRole('button', { name: 'Sign out' }).click();

    // The world is gone and the form is back. Signing out from inside
    // the profile means the dialog is unmounted along with the page
    // that held it, which is the part worth watching
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeHidden();
  });
});
