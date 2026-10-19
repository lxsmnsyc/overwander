import { expect, test } from '@playwright/test';
import { insertRow, uidOf } from './admin';
import { openPanel, signIn } from './game';

/**
 * Boxes, the way a player uses them: make one, pick a pokemon and move
 * it in, and find it there rather than in Default.
 */

test.describe('boxes', () => {
  // One pokemon written straight into the store rather than claimed from
  // the gifts: what is under test is where it is filed, not how it came
  test.beforeEach(async ({ page }) => {
    const owner = await uidOf(await signIn(page));

    await insertRow('caught', {
      id: `box-spec-${owner}`,
      owner,
      type: 0,
      species: 25,
      level: 12,
      individual_value: 1,
      trait_value: 2,
      ivs: 0,
      gender: 1,
      nature: 0,
      slots: 0,
      health: 20,
      max_health: 40,
      ball: 15,
      caught_at_local: new Date('2026-08-20T12:00:00Z'),
      caught_at_offset: 480,
      friendship: 70,
      origin_timestamp: 0,
      origin_x: 0,
      origin_y: 0,
      origin_biome: 0,
    });
  });

  test('makes a box and files a pokemon into it', async ({ page }) => {
    const boxes = await openPanel(page, 'Boxes');
    const rail = boxes.getByRole('navigation', { name: 'Boxes' });

    // A new player has Default and nothing else, with their starter in it
    await expect(rail.getByRole('button', { name: /^Default\s*1$/ })).toBeVisible();

    await boxes.getByRole('button', { name: 'New box', exact: true }).click();
    await rail.getByRole('textbox', { name: 'New box' }).fill('Starters');
    await rail.getByRole('button', { name: 'Make it' }).click();

    // Made and opened, and empty
    await expect(rail.getByRole('button', { name: /^Starters\s*0$/ })).toBeVisible();
    await expect(boxes.getByRole('heading', { name: 'Starters' })).toBeVisible();

    await rail.getByRole('button', { name: /^Default/ }).click();
    await boxes.getByRole('button', { name: 'Select', exact: true }).click();

    const box = boxes.getByRole('group', { name: /^Box of pokemon/ });

    await box.getByRole('button').first().click();
    await boxes.getByRole('button', { name: 'Move 1 to' }).click();
    await page.getByRole('menuitem', { name: /^Starters/ }).click();

    await expect(rail.getByRole('button', { name: /^Starters\s*1$/ })).toBeVisible();
    await expect(rail.getByRole('button', { name: /^Default\s*0$/ })).toBeVisible();

    await rail.getByRole('button', { name: /^Starters/ }).click();
    await expect(box.getByRole('button')).toHaveCount(1);
  });
});
