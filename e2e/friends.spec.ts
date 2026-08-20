import { expect, test } from '@playwright/test';
import { claimStarter, dialogNamed, expectOpen, openPanel, settled, signIn } from './game';
import { uidOf, writeDocument } from './emulator';
import { stageSeller } from './stranger';

/**
 * Asking somebody to be your friend.
 *
 * Both ways in are tested: the lookup by address, and the menu on a
 * profile being visited. Neither can be tested with one account alone,
 * so the other trainer is opened straight in the emulator — a real
 * account, since an address is what a friend is found by
 */

test.describe('friends', () => {
  test('asks somebody by the address they signed up with', async ({ page }) => {
    const stranger = await stageSeller('Rosemary');

    await signIn(page);
    await claimStarter(page);

    const profile = await openPanel(page, 'Profile');

    await profile.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Add friend' }).click();

    const finder = dialogNamed(page, 'Add a friend');

    await expectOpen(finder);
    await finder.getByLabel('Email address').fill(stranger.email);
    await finder.getByRole('button', { name: 'Look up' }).click();

    const row = finder.getByRole('listitem').filter({ hasText: stranger.nickname });

    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole('button', { name: 'Add', exact: true }).click();

    // Asked, so the only press left is taking it back
    await expect(row.getByRole('button', { name: 'Cancel request' })).toBeVisible({
      timeout: 20_000,
    });
    await finder.getByRole('button', { name: 'Close' }).click();

    // And it is waiting under the requests tab, on the outgoing half.
    // The lists follow the store, so nothing had to be reopened
    await profile.getByRole('tab', { name: /Friend Requests/ }).click();
    await expect(profile.getByText('Waiting on an answer')).toBeVisible({ timeout: 20_000 });
    await expect(profile.getByText(stranger.nickname)).toBeVisible();
  });

  test('says so when nobody plays under an address', async ({ page }) => {
    await signIn(page);
    await claimStarter(page);

    const profile = await openPanel(page, 'Profile');

    await profile.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Add friend' }).click();

    const finder = dialogNamed(page, 'Add a friend');

    await expectOpen(finder);
    await finder.getByLabel('Email address').fill('nobody-at-all@example.com');
    await finder.getByRole('button', { name: 'Look up' }).click();
    await expect(finder.getByText('Nobody plays under that address.')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('asks the trainer whose profile is open', async ({ page }) => {
    const seller = await stageSeller('Juniper');

    await signIn(page);
    await claimStarter(page);

    const board = await openPanel(page, 'Auctions');
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
    await writeDocument('friendRequests', `${stranger.uid}:${await uidOf(player)}`, {
      from: { stringValue: stranger.uid },
      to: { stringValue: await uidOf(player) },
      sentAt: { integerValue: String(Date.now()) },
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
    const seller = await stageSeller('Nettle');

    await signIn(page);
    await claimStarter(page);

    const board = await openPanel(page, 'Auctions');
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
