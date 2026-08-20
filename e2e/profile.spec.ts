import { expect, test } from '@playwright/test';
import { claimStarter, openBox, openPanel, signIn } from './game';

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
    await claimStarter(page);
  });

  test('says who the player is and what they are worth', async ({ page }) => {
    const profile = await openPanel(page, 'Profile');

    await expect(profile.getByText(/\d+ gold/)).toBeVisible();
    // The way out is behind the account menu now, along with the way
    // to somebody else's profile
    await profile.getByRole('button', { name: 'Actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Add friend' })).toBeVisible();
    // Shut with the button that opened it: Escape from inside a menu
    // in a dialog closes the dialog under it as well
    await profile.getByRole('button', { name: 'Actions' }).click();

    // What is left under the tabs: the catches and the bag are behind
    // the menu now, since neither is a fact about who somebody is
    for (const tab of ['Battles', 'Friends', 'Friend Requests', 'Bids']) {
      await expect(profile.getByRole('tab', { name: tab })).toBeVisible();
    }
  });

  // A panel carrying another tab's name is what a mispaired set of ids
  // looks like from outside, and the pairing is terracotta's to get
  // right — so this is the assertion that says it still does
  test('names each panel after the tab that opens it', async ({ page }) => {
    const profile = await openPanel(page, 'Profile');

    for (const tab of ['Battles', 'Friends', 'Bids']) {
      await profile.getByRole('tab', { name: tab, exact: true }).click();
      await expect(profile.getByRole('tabpanel', { name: tab, exact: true })).toBeVisible();
    }
  });

  test('draws the catches as a box rather than a list of names', async ({ page }) => {
    const box = await openBox(page);

    // Wide enough to be a box of squares, with the pokemon the account
    // was handed standing in one of them. Polled, since the dialog
    // holding it grows into place
    await expect.poll(async () => (await box.boundingBox())?.width ?? 0).toBeGreaterThan(200);
    await expect(box.getByRole('button').first()).toBeVisible();
  });

  test('carries the balls a new player was handed', async ({ page }) => {
    const bag = await openPanel(page, 'Inventory');

    // The bag names nothing on its face: a square says what it holds
    // to whoever is listening, and shows it to everyone else
    await expect(bag.getByRole('button', { name: /^Poke Ball, \d+ carried/ })).toBeVisible();
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

    await profile.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    // The world is gone and the form is back. Signing out from inside
    // the profile means the dialog is unmounted along with the page
    // that held it, which is the part worth watching
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeHidden();
  });
});
