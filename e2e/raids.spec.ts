import { expect, test } from '@playwright/test';
import { dialogNamed, dismissGift, expectShut, openPanel, signIn } from './game';

/**
 * The lobbies gathering in the current window.
 *
 * What the list holds depends on the world and the hour, and neither
 * is this test's to arrange: a fresh emulator has no raids in it, and
 * one that has been walked around in may have several. So this asserts
 * the two things that are true either way — that the panel resolves to
 * *an answer* rather than sitting on "Loading raids…", and that a
 * lobby, if there is one, opens into itself and takes the panel's name
 * with it.
 */

/**
 * How the panel names itself while it is showing the list. A lobby
 * renames it to the lair, which is how a test knows one opened
 */
const LIST_TITLE = 'Raids';

test.describe('the raids panel', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissGift(page);
  });

  test('settles on either a list of lobbies or the fact that there are none', async ({ page }) => {
    const raids = await openPanel(page, 'Raids');

    // Whichever it is, it is not still loading. The window comes from
    // the server's clock, so the listing cannot even be opened until a
    // round trip has landed — a panel stuck on its loading line is the
    // failure this is here to catch
    await expect(raids.getByText('Loading raids…')).toBeHidden({ timeout: 20_000 });

    const empty = raids.getByText('No raids are gathering right now.');
    const listed = raids.getByRole('listitem').getByRole('button').first();

    await expect(empty.or(listed)).toBeVisible();
  });

  test('opens a lobby into the panel, named for the lair', async ({ page }) => {
    const raids = await openPanel(page, 'Raids');

    await expect(raids.getByText('Loading raids…')).toBeHidden({ timeout: 20_000 });

    const rows = raids.getByRole('listitem').getByRole('button');

    if ((await rows.count()) === 0) {
      test.skip(true, 'no lobby is gathering in this window');
      return;
    }

    const named = (await rows.first().textContent())?.trim() ?? '';

    await rows.first().click();

    // The lair names the panel it fills, so the dialog the lobby is in
    // is no longer the one called "Raids"
    await expect(dialogNamed(page, named)).toBeAttached();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

    // And walking out gives the list its own name back
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialogNamed(page, LIST_TITLE)).toBeAttached();
  });

  test('closes and gives the world back', async ({ page }) => {
    const raids = await openPanel(page, 'Raids');

    await raids.getByRole('button', { name: 'Close' }).click();
    await expectShut(raids);
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
  });
});
