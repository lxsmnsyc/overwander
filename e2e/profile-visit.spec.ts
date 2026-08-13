import { expect, test } from '@playwright/test';
import { dialogNamed, dismissGift, expectOpen, openPanel, signIn } from './game';
import { stageSeller } from './stranger';

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
    await dismissGift(page);

    const board = await openPanel(page, 'Auctions');
    const named = board.getByRole('button', { name: seller.nickname, exact: true });

    // The board follows the auctions collection, so the staged lot
    // lands a subscription's round trip after the panel does
    await expect(named).toBeVisible({ timeout: 20_000 });
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
});
