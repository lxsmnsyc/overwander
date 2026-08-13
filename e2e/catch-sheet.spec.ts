import { expect, test } from '@playwright/test';
import { SHEET, dismissGift, offCentre, openCatch, signIn } from './game';

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

test.describe('the catch sheet', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await dismissGift(page);
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
    // The reason rides on the button rather than filling the row
    await expect(evolve).toHaveAttribute('title', /needs|uses|not/);
  });

  test('counts out the training points at the end of the list', async ({ page }) => {
    const sheet = await openCatch(page);

    await sheet.getByText('EV', { exact: true }).click();
    await expect(sheet.getByText(/Remaining: \d+/)).toBeVisible();
  });

  test('offers the bag as one button that says how full the pokemon is', async ({ page }) => {
    const sheet = await openCatch(page);

    await expect(sheet.getByRole('button', { name: /^Give item \d+\/\d+$/ })).toBeVisible();
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
            if (gone instanceof Element && gone.querySelector('[role=dialog], canvas') != null) {
              torn.count += 1;
            }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    });

    await sheet.getByRole('button', { name: /Actions/ }).click();
    await page.getByRole('menuitem', { name: 'Favorite', exact: true }).click();

    // The record came back marked: the menu now offers to undo it
    await sheet.getByRole('button', { name: /Actions/ }).click();
    await expect(page.getByRole('menuitem', { name: 'Unfavorite' })).toBeVisible();

    // The menu is left open on purpose. Escape now closes the sheet
    // itself — a dialog answers it wherever the keyboard is — and an
    // unmounted sheet is exactly what this test counts
    const torn = await page.evaluate(() => window.torn?.count ?? -1);

    expect(torn, 'nothing should have been unmounted while the favorite was written').toBe(0);
    await expect(sheet.getByText(SHEET)).toBeVisible();
  });
});
