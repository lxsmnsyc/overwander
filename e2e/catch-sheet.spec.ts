import { expect, test } from '@playwright/test';
import { SHEET, chooseAction, claimStarter, offCentre, openCatch, signIn } from './game';

/**
 * One pokemon in full.
 *
 * It is the longest screen in the game and the one most changed by
 * hand, so it is the one worth pinning down: what it is called, what
 * it says about the pokemon, and — the part no unit test can see —
 * that pressing something on it does not take the page down.
 */

declare global {
  interface Window {
    /**
     * How many subtrees holding a dialog or a canvas have been taken
     * out of the document. It is left on the window because the count
     * has to survive between two `evaluate` calls — one to start
     * watching, one to read the tally back
     */
    torn?: { count: number };
  }
}

/**
 * How wide the square an evolution's picture stands in is, in pixels.
 * It is `size-16` in the markup, and it is a number here because the
 * point of it is that it does not depend on what is standing in it
 */
const EVOLUTION_SQUARE = 64;

test.describe('the catch sheet', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await claimStarter(page);
  });

  test('is named for what it is, with the pokemon named inside it', async ({ page }) => {
    const sheet = await openCatch(page);
    const title = sheet.getByText(SHEET);

    // The window is called Pokemon Info; the pokemon's own name lives
    // under its sprite, where it belongs to the pokemon
    expect(await offCentre(sheet, title)).toBeLessThan(4);
    await expect(sheet.getByRole('button', { name: /Actions/ })).toBeVisible();

    // Category, type and gender read as one line under the name
    await expect(sheet.getByText(/Pokemon$/).first()).toBeVisible();
  });

  test('offers the level and the thing that raises it as one control', async ({ page }) => {
    const sheet = await openCatch(page);

    await expect(sheet.getByRole('button', { name: /^Lv\. \d+ → \d+ \(\d+\)$/ })).toBeVisible();
  });

  test('shows what it could become and why it cannot yet', async ({ page }) => {
    const sheet = await openCatch(page);
    const evolve = sheet.getByRole('button', { name: 'Evolve' }).first();

    // A starter is level 5, so its evolution is listed and refused
    await expect(evolve).toBeVisible();
    await expect(evolve).toBeDisabled();
    // What it is working towards reads off the row as a sum with the
    // picture beside it — that shape, plus a level or a stone — and
    // the row itself spells the shorthand out. Which of them it is
    // depends on the starter the world handed out this run, so the
    // sentence is checked rather than the condition inside it
    const row = sheet.getByRole('listitem', { name: /^To evolve, .+\.$/ }).first();

    await expect(row).toBeVisible();

    /**
     * And the picture beside it stands in a square of its own.
     *
     * A pokemon is whatever size it was drawn at, so pictures sized by
     * their own sheets list a branching line at a different height on
     * every row, with the condition beside each in a different place.
     * The square is what makes the rows a list rather than a stack of
     * unrelated pictures, and it is the same square whatever is in it
     */
    const picture = row.getByRole('img').first();

    // Measured until it settles: a dialog's panel grows into place
    // from half its size, and a box measured on the way in is the
    // fraction of itself the panel had reached
    await expect(async () => {
      const held = await picture.locator('xpath=..').boundingBox();
      const drawn = await picture.boundingBox();

      expect(held?.width).toBeCloseTo(EVOLUTION_SQUARE, 0);
      expect(held?.height).toBeCloseTo(EVOLUTION_SQUARE, 0);
      expect(drawn?.width ?? 0).toBeLessThanOrEqual(EVOLUTION_SQUARE + 1);
      expect(drawn?.height ?? 0).toBeLessThanOrEqual(EVOLUTION_SQUARE + 1);
    }).toPass({ timeout: 5_000 });
  });

  test('counts out the training points at the end of the list', async ({ page }) => {
    const sheet = await openCatch(page);

    await sheet.getByText('EV', { exact: true }).click();
    await expect(sheet.getByText(/Remaining: \d+/)).toBeVisible();
  });

  test('draws the room a pokemon has to carry things as squares', async ({ page }) => {
    const sheet = await openCatch(page);

    // The tray says how full it is by how many squares are filled, so
    // the empty one is both the count and the way to fill it
    await expect(sheet.getByRole('button', { name: 'Give it an item' }).first()).toBeVisible();
  });

  test('marks a favorite without tearing the page down', async ({ page }) => {
    const sheet = await openCatch(page);

    // Everything that writes to a record re-reads it afterwards, and a
    // read that suspends unmounts the panel — and the page behind it.
    // Watching for that directly: anything removed from the document
    // while the write is in flight is counted, and the answer has to
    // be nothing
    await page.evaluate(() => {
      const torn = { count: 0 };

      window.torn = torn;
      new MutationObserver((records) => {
        for (const record of records) {
          for (const gone of record.removedNodes) {
            // Counted by what a screen is made of — a terracotta dialog
            // or a sprite canvas. Hover cards are `role=dialog` too and
            // come and go with the pointer, and their fade means they
            // are taken down from a container that has already been
            // detached, where no ancestor is left to tell them apart by
            if (gone instanceof Element && gone.querySelector('[tc-dialog], canvas') != null) {
              torn.count += 1;
            }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    });

    await chooseAction(page, sheet, 'Favorite');

    // The record came back marked: the menu now offers to undo it
    await sheet.getByRole('button', { name: /Actions/ }).click();
    await expect(page.getByRole('menuitem', { name: 'Unfavorite' })).toBeVisible();

    // The menu is left open on purpose: what this test counts is
    // whether anything under it was torn down and rebuilt
    const torn = await page.evaluate(() => window.torn?.count ?? -1);

    expect(torn, 'nothing should have been unmounted while the favorite was written').toBe(0);
    await expect(sheet.getByText(SHEET)).toBeVisible();
  });

  test('names a pokemon and calls it that afterwards', async ({ page }) => {
    const sheet = await openCatch(page);
    // Whatever the starter is, the sheet is headed by its species
    // until somebody says otherwise
    const species = (await sheet.getByRole('heading', { level: 3 }).first().textContent()) ?? '';

    await chooseAction(page, sheet, 'Set nickname');

    // The box is there to type in the moment it opens, rather than
    // behind a "do you want to rename it?" step
    const naming = page.getByRole('dialog', { name: 'Change nickname?' });
    const box = naming.getByRole('textbox');

    await expect(box).toBeVisible();
    // Opened on the name it has, which for an unnamed one is nothing
    await expect(box).toHaveValue('');

    // The box holds twelve characters and no more; what it does with
    // them — the doubled space counted as one — is the cleaning
    await box.fill('Sir  Scratch');
    // What it will actually be stored as, said before it is sent
    await expect(naming.getByText('It will be called Sir Scratch.')).toBeVisible();
    await naming.getByRole('button', { name: 'Save' }).click();

    // The sheet is headed by the name now, with the species under it
    await expect(sheet.getByRole('heading', { level: 3, name: 'Sir Scratch' })).toBeVisible();
    await expect(sheet.getByText(species.replace('✦ ', ''), { exact: true })).toBeVisible();

    // ...and the menu offers to change it rather than to set one
    await chooseAction(page, sheet, 'Change nickname');
    await expect(box).toHaveValue('Sir Scratch');

    // Emptying the box hands the pokemon back to its species
    await box.fill('');
    await naming.getByRole('button', { name: 'Save' }).click();
    await expect(
      sheet.getByRole('heading', { level: 3, name: species.replace('✦ ', '') }),
    ).toBeVisible();
  });
});
