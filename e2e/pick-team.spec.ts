import { expect, test } from '@playwright/test';
import { findRows, insertRow, uidOf } from './admin';
import { claimGift, expectShut, newPlayer, openPanel, signIn } from './game';

/**
 * Forming a team: the box and the saved teams are two tabs, and the
 * box's own controls hand focus back when the box closes. That used to
 * land on the box's tab and select it again, so pressing Teams went
 * straight back to the box
 */
test.describe('forming a team', () => {
  test('opens the saved teams when Teams is pressed', async ({ page }) => {
    const player = newPlayer();

    await signIn(page, player);

    // The starter alone: a team needs someone to stand in it
    const gifts = await openPanel(page, 'Gifts');
    const starter = gifts.getByRole('button', { name: /^Claim Lv\./ }).first();

    await expect(starter).toBeVisible({ timeout: 60_000 });

    const named = (await starter.getAttribute('aria-label')) ?? '';
    const taking = gifts.getByRole('button', { name: named, exact: true });

    await claimGift(page, taking, async () => (await taking.count()) === 0);
    await gifts.getByRole('button', { name: 'Close' }).click();
    await expectShut(gifts);

    const uid = await uidOf(player);
    const [caught] = await findRows('caught', 'owner', uid);

    await insertRow('team_presets', { id: `e2e-${uid}`, player: uid, name: 'Saved', made_at: 0 });
    await insertRow('team_preset_catches', {
      preset_id: `e2e-${uid}`,
      slot: 0,
      caught_id: String(caught.id),
    });

    // A lobby of one is enough to be asked for a team
    const battle = await openPanel(page, 'Battle');

    await battle.getByRole('button', { name: 'Host a battle' }).click();
    await page.getByRole('button', { name: 'Form a team' }).click();

    const form = page.getByRole('dialog', { name: 'Form a team' });
    const box = form.getByRole('tab', { name: 'Your pokemon' });
    const saved = form.getByRole('tab', { name: /^Teams/ });

    await expect(form.getByRole('group', { name: /^Box of pokemon/ })).toBeVisible();

    // The box built again while its own tab has focus, which is what
    // the dialog does on the way in
    await saved.click();
    await box.click();
    await expect(form.getByRole('group', { name: /^Box of pokemon/ })).toBeVisible();

    await saved.click();
    await expect(saved).toHaveAttribute('aria-selected', 'true');
    await expect(form.getByRole('listitem', { name: 'Saved' })).toBeVisible();
  });
});
