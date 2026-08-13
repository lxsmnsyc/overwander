import { expect, test } from '@playwright/test';
import { dismissGift, newPlayer, signIn } from './game';
import { enterRaid, stageRaid } from './raid';

/**
 * Leaving a battle.
 *
 * This is the one that keeps coming back, and it kept coming back
 * because nothing could see it: a raid needs a lair, a lobby, a party
 * and a host's press, and none of that could be staged from a browser
 * — so every fix for it was reasoning about code rather than watching
 * the button.
 *
 * So the point of this spec is not that it passes. It is that when
 * Leave misbehaves again, this says *how*: whether the world came
 * back, whether the panel the fight was started from is sitting on top
 * of it, or whether the battle simply reopened.
 */

test.describe('leaving a battle', () => {
  test('puts the player back in the world', async ({ page }) => {
    const player = newPlayer();
    const faults: string[] = [];

    // Anything the page throws while the battle is up. The last two
    // reports of this were an exception in the click handler, and an
    // exception that never reaches the test is a button that "does
    // nothing"
    page.on('pageerror', (error) => {
      faults.push(error.message);
    });

    await signIn(page, player);
    await dismissGift(page);
    await stageRaid(player);
    await enterRaid(page);

    // The fight is up: its own title, its own way out
    const leave = page.getByRole('button', { name: 'Leave', exact: true });

    await expect(leave).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^Raid Battle/)).toBeVisible();

    await leave.click();

    // The world, and nothing over it. Each of these is a different
    // way the button has failed before, so they are asserted apart:
    // the battle still up, the raids panel back on top of the world,
    // or the lobby putting the player straight back into the fight
    await expect(leave, 'the battle should be gone').toBeHidden();
    await expect(
      page.getByRole('dialog', { name: 'Raids' }),
      'the raids panel should not be left open over the world',
    ).not.toBeAttached();
    await expect(
      page.getByRole('navigation', { name: 'Game' }),
      'the overworld bar should be back',
    ).toBeVisible();

    // And it stays left. The lobby watches its own record, and that
    // record still names the battle — a lobby left mounted would put
    // the player back in it a moment later
    await page.waitForTimeout(2000);
    await expect(leave, 'the battle should not reopen').toBeHidden();

    expect(faults, 'nothing should have thrown while leaving').toEqual([]);
  });

  test('counts down before the fight starts', async ({ page }) => {
    const player = newPlayer();

    await signIn(page, player);
    await dismissGift(page);
    await stageRaid(player);
    await enterRaid(page);

    // Three seconds of looking at the field before anything happens in
    // it. The count is the only part of a battle that is not the
    // engine's, so it is the only part a browser can pin down
    const counting = page.getByRole('status').filter({ hasText: /^[123]$/ });

    await expect(counting).toBeVisible({ timeout: 30_000 });
    await expect(counting).toBeHidden({ timeout: 10_000 });
  });
});
