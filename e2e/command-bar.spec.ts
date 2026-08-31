import { expect, test } from '@playwright/test';
import { signIn } from './game';

/**
 * The staff command bar, opened with Ctrl+K.
 *
 * Every command here is checked through the screen rather than
 * through what it returned, because the two things that broke it were
 * both about the screen: a teleport that wrote the position row from
 * the server and left the board fenced off as though a second screen
 * had walked away with the player, and a `/locate weather:` counting
 * its hour in UTC while the game reads the sky in the player's own
 * zone. Both are invisible to a unit test and obvious here
 */
test('the command bar runs its commands', async ({ page }) => {
  await signIn(page);

  const bar = page.getByRole('combobox', { name: 'Command' });
  // What the last line did, printed under the box rather than
  // announced and taken away
  const answer = page
    .locator('[tc-dialog-panel]')
    .filter({ has: bar })
    .locator('[role="status"], [role="alert"]');
  // The role arrives on a subscription, so the bar is not offered for
  // the first moment of the session
  const open = async (): Promise<void> => {
    await expect(async () => {
      await page.keyboard.press('Control+k');
      await expect(bar).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
  };
  const say = async (line: string, said: RegExp): Promise<void> => {
    await open();
    await bar.fill(line);
    await page.keyboard.press('Enter');
    await expect(answer).toHaveText(said);
    // Put away before reading the world behind it
    await page.keyboard.press('Escape');
    await expect(bar).toBeHidden();
  };

  // Completion: the list offers the commands and then the parameters
  await open();
  await bar.fill('loc');
  await expect(page.getByRole('option', { name: 'locate' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(bar).toHaveValue('locate ');
  await expect(page.getByRole('option', { name: 'species:' })).toBeVisible();
  await page.keyboard.press('Escape');

  await say('tp x:544 y:1794', /\(544, 1794\), cell \d+, \d+\./);
  // The board moves with it rather than fencing itself off
  await expect(page.getByRole('application')).toHaveAccessibleName(/\(544, 1794\)/);

  // The sky the game is showing is the sky `/locate` counts in, so
  // asking for it from under it answers where the player is standing
  const sky = await page.getByRole('img').first().getAttribute('aria-label');

  await say(`locate weather:"${sky ?? ''}"`, /where you are standing/);
  await say('locate biome:Ocean', /Ocean \(-?\d+, -?\d+\)/);
  await say('locate species:Pikachu', /chunks away|where you are standing/);
  // To the caller rather than to everybody: an open gift stands on
  // every shelf in the stack, including the ones other specs read
  await say('gift-item to:self item:"Rare Candy" amount:3 reason:"A test"', /is on .*shelf\./);
  await say('ban player:self', /not yours to act on/);

  await open();
  await bar.fill('view player:self');
  await page.keyboard.press('Enter');
  await expect(page.locator('[tc-dialog][data-open]')).toBeVisible();
});
