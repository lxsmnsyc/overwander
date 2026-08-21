import { expect, test } from '@playwright/test';
import { findRows, uidOf } from './admin';
import { SHEET, claimStarter, dialogNamed, expectOpen, openPanel, signIn } from './game';
import { stageCatchLot, stageSeller } from './stranger';

/**
 * Looking at somebody else.
 *
 * A trainer is met in the middle of something — a lot of theirs on the
 * board, a party of theirs in a lobby — and the answer to "who is
 * that" is the profile they already have. What is being tested is that
 * it opens at all, and that nothing on it can be pressed: a profile
 * that offered to sign somebody else out, or to swap their buddy,
 * would be offering a write the rules refuse anyway.
 */

test.describe('another trainer', () => {
  test('opens from the board, with nothing on it to press', async ({ page }) => {
    const seller = await stageSeller('Wisteria');

    await signIn(page);
    await claimStarter(page);

    const board = await openPanel(page, 'Auctions');
    const square = board.getByRole('button', { name: new RegExp(`by ${seller.nickname}`) });

    // The board follows the auctions collection, so the staged lot
    // lands a subscription's round trip after the panel does. Who listed
    // it is in the card the square puts up, and it is the way to them
    await expect(square).toBeVisible({ timeout: 20_000 });
    await square.hover();

    const card = page.getByRole('dialog', { name: 'Info' });
    const named = card.getByRole('button', { name: seller.nickname, exact: true });

    await expect(named).toBeVisible();
    await named.click();

    const profile = dialogNamed(page, seller.nickname);

    await expectOpen(profile);

    // Everything that writes is gone. The buddy swap and the sign-out
    // are the two buttons the player's own profile carries, and
    // neither belongs on somebody else's
    await expect(profile.getByRole('button', { name: 'Sign out' })).toBeHidden();
    await expect(profile.getByRole('button', { name: 'Choose a buddy' })).toBeHidden();

    // And the bids are gone with them, which is a rule rather than a
    // choice: a bidding history is the one thing on the board that
    // cannot be read by anybody but its owner. That leaves the
    // battles, and one tab is no tabs at all
    await expect(profile.getByRole('tab')).toHaveCount(0);
    await expect(profile.getByText('No battles fought yet.')).toBeVisible();
  });

  test('opens from the hands a pokemon has passed through', async ({ page }) => {
    const seller = await stageSeller('Hawthorn');
    const player = await signIn(page);

    await claimStarter(page);

    // A pokemon of theirs on the block, which is the one place a
    // player meets a record that was somebody else's. It is a copy of
    // the player's own starter — a catch has three dozen fields and
    // the sheet reads every one of them, so the honest way to get a
    // valid record is to take a valid record
    const [starter] = await findRows('caught', 'owner', await uidOf(player));

    expect(starter, 'the starter should be there').toBeTruthy();
    await stageCatchLot(seller, String(starter.id));

    const board = await openPanel(page, 'Auctions');
    // Every lot of theirs says who listed it, and the staging put an
    // item of theirs up as well; the pokemon is a square of the box
    // rather than of the bag, and the card over it opens the record
    const lot = board.getByRole('img', { name: new RegExp(`by ${seller.nickname}`) });

    await expect(lot).toBeVisible({ timeout: 20_000 });
    await lot.hover();

    const card = page.getByRole('dialog', { name: 'Info' });

    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'View' }).click();

    const sheet = dialogNamed(page, SHEET);

    await expectOpen(sheet);

    // Whose hands it passed through, and the way to them. It is
    // read-only — this is somebody else's pokemon — and the name is
    // still a way to the trainer behind it
    const trainer = sheet.getByRole('button', { name: seller.nickname, exact: true });

    await expect(trainer).toBeVisible();
    await trainer.click();
    await expectOpen(dialogNamed(page, seller.nickname));
  });
});
