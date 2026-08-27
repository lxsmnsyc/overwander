import { expect, test } from '@playwright/test';
import {
  claimStarter,
  dialogNamed,
  expectOpen,
  expectShut,
  openPanel,
  settled,
  signIn,
} from './game';
import { clearAuctions, insertRow, uidOf } from './admin';
import { stageSeller } from './stranger';
import { openAuctionBoard } from './walk';

/**
 * Asking somebody to be your friend.
 *
 * Both ways in are tested: the lookup by friend code, and the menu on
 * a profile being visited. Neither can be tested with one account
 * alone, so the other trainer is opened straight in the emulator — a
 * real account, with a friend code written the way the server mints
 * one
 */

test.describe('friends', () => {
  test('asks somebody by their friend code', async ({ page }) => {
    const stranger = await stageSeller('Rosemary');

    await signIn(page);
    await claimStarter(page);

    const profile = await openPanel(page, 'Profile');

    await profile.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Add friend' }).click();

    const finder = dialogNamed(page, 'Add a friend');

    await expectOpen(finder);
    // The player's own code is on the panel for the sharing half
    await expect(finder.getByText(/\d{4}-\d{4}-\d{4}/)).toBeVisible({ timeout: 20_000 });
    await finder.getByLabel('Friend code').fill(stranger.code);
    await finder.getByRole('button', { name: 'Look up' }).click();

    const row = finder.getByRole('listitem').filter({ hasText: stranger.nickname });

    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole('button', { name: 'Add', exact: true }).click();

    // Asked, so the only press left is taking it back
    await expect(row.getByRole('button', { name: 'Cancel request' })).toBeVisible({
      timeout: 20_000,
    });
    await finder.getByRole('button', { name: 'Close' }).click();
    // Gone rather than going: the finder floats inside the profile's
    // own container, so its row would double every read below
    await expectShut(finder);

    // And it is waiting under the requests tab, on the outgoing half.
    // The lists follow the store, so nothing had to be reopened
    await profile.getByRole('tab', { name: /Friend Requests/ }).click();
    await expect(profile.getByText('Waiting on an answer')).toBeVisible({ timeout: 20_000 });
    // Inside the pane rather than anywhere in the panel: the closed
    // finder stays mounted in the profile's portal container, still
    // holding the same name
    await expect(profile.getByRole('tabpanel').getByText(stranger.nickname)).toBeVisible();
  });

  test('says so when nobody plays under a code', async ({ page }) => {
    await signIn(page);
    await claimStarter(page);

    const profile = await openPanel(page, 'Profile');

    await profile.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Add friend' }).click();

    const finder = dialogNamed(page, 'Add a friend');

    await expectOpen(finder);
    await finder.getByLabel('Friend code').fill('9999-9999-9998');
    await finder.getByRole('button', { name: 'Look up' }).click();
    await expect(finder.getByText('Nobody plays under that code.')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('asks the trainer whose profile is open', async ({ page }) => {
    // Nothing but this lot on the board, so the square hovered is the
    // one the card comes up for
    await clearAuctions();

    const seller = await stageSeller('Juniper');
    const player = await signIn(page);

    await claimStarter(page);

    const board = await openAuctionBoard(page, player);
    const square = board.getByRole('button', { name: new RegExp(`by ${seller.nickname}`) });

    await expect(square).toBeVisible({ timeout: 20_000 });
    await square.hover();

    const card = page.getByRole('dialog', { name: 'Info' });

    await card.getByRole('button', { name: seller.nickname, exact: true }).click();

    const visited = dialogNamed(page, seller.nickname);

    await expectOpen(visited);

    // The one thing a reader can do to somebody else, and after it the
    // menu offers the undo instead
    await visited.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Add friend' }).click();
    // The menu fades as it shuts, and re-opening it mid-fade leaves
    // terracotta's transition with nothing to show
    await settled(page);
    await visited.getByRole('button', { name: 'Actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Cancel request' })).toBeVisible({
      timeout: 20_000,
    });
  });

  test('answers somebody who asked first', async ({ page }) => {
    const stranger = await stageSeller('Marigold');
    const player = await signIn(page);

    await claimStarter(page);

    // The other half of the game: a request written the way the
    // server writes one, since nothing here can sign in as them
    await insertRow('friend_requests', {
      sender: stranger.uid,
      recipient: await uidOf(player),
      sent_at: Date.now(),
    });

    const profile = await openPanel(page, 'Profile');

    // The tab wears the count, and it arrived while the panel was
    // open: the lists follow the store rather than being fetched once
    const tab = profile.getByRole('tab', { name: /Friend Requests/ });

    await expect(tab).toContainText('1', { timeout: 20_000 });
    await tab.click();

    const asking = profile.getByRole('listitem').filter({ hasText: stranger.nickname });

    await expect(asking).toBeVisible({ timeout: 20_000 });
    await asking.getByRole('button', { name: 'Accept' }).click();

    // And they are on the list, which is the read that proves both
    // halves of the friendship were written
    await profile.getByRole('tab', { name: 'Friends', exact: true }).click();
    await expect(profile.getByText(stranger.nickname)).toBeVisible({ timeout: 20_000 });
    await expect(
      profile.getByRole('listitem').filter({ hasText: stranger.nickname }).getByRole('button', {
        name: 'Remove',
      }),
    ).toBeVisible();
  });

  test('shuts somebody out, and lists them where the block can be lifted', async ({ page }) => {
    await clearAuctions();

    const seller = await stageSeller('Nettle');
    const player = await signIn(page);

    await claimStarter(page);

    const board = await openAuctionBoard(page, player);
    const square = board.getByRole('button', { name: new RegExp(`by ${seller.nickname}`) });

    await expect(square).toBeVisible({ timeout: 20_000 });
    await square.hover();
    await page
      .getByRole('dialog', { name: 'Info' })
      .getByRole('button', { name: seller.nickname, exact: true })
      .click();

    const visited = dialogNamed(page, seller.nickname);

    await expectOpen(visited);
    await visited.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Block' }).click();
    await settled(page);

    // Blocked, so the menu is the one press that undoes it and
    // nothing else: there is nothing left to ask a blocked trainer
    await visited.getByRole('button', { name: 'Actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Unblock' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('menuitem', { name: 'Block', exact: true })).toBeHidden();
    // Shut with the button that opened it: Escape from inside a menu
    // closes the dialog under it as well
    await visited.getByRole('button', { name: 'Actions' }).click();
    await settled(page);
    await visited.getByRole('button', { name: 'Close' }).click();
    // The board is still open under it, and its overlay is what the
    // menu at the bottom would be pressed through
    await board.getByRole('button', { name: 'Close' }).click();

    // And they are on the player's own list, which is the only place
    // a block can be found again once the profile is shut
    const profile = await openPanel(page, 'Profile');

    await profile.getByRole('tab', { name: 'Friends', exact: true }).click();
    await expect(profile.getByText(/Blocked\./)).toBeVisible({ timeout: 20_000 });
    await expect(
      profile
        .getByRole('listitem')
        .filter({ hasText: seller.nickname })
        .getByRole('button', { name: 'Unblock' }),
    ).toBeVisible();
  });
});
