import { expect, test } from '@playwright/test';
import { claimStarter, expectShut, openMenu, openPanel, signIn } from './game';
import { boardOf, placeOf } from './walk';

/**
 * The page a player spends nearly all of their time on: the chunk they
 * are standing in, and the one button that reaches everything else.
 */

test.describe('the overworld', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await claimStarter(page);
  });

  test('draws the chunk and nothing else', async ({ page }) => {
    const world = boardOf(page);

    await expect(world).toBeVisible();

    // The map is the page. Anything laid out around it — a heading, a
    // strip of prose explaining what an overworld is — was taken out
    // on purpose, and this is what says it stays out
    const bounds = await world.boundingBox();

    expect(bounds?.height ?? 0).toBeGreaterThan(300);
  });

  test('reaches everything from the one button at the bottom', async ({ page }) => {
    const menu = await openMenu(page);

    // Everything that is not the world, as a keypad. There is no key
    // for the auctions: the lots are read at a board out in the world,
    // which is what makes trading somewhere a player goes
    for (const label of [
      'World',
      'Notices',
      'Profile',
      'Catches',
      'Bag',
      'Pokedex',
      'Quests',
      'Gifts',
      'Battle',
      'Raids',
      'Settings',
      'News',
    ]) {
      await expect(menu.getByRole('button', { name: label, exact: true })).toBeEnabled();
    }
  });

  /**
   * Walking on the keyboard, and going on walking while the key is
   * held. The chunk the board names is the coarsest thing that can be
   * read back, so the walk is the one out of the chunk: a held key
   * that only ever took one step would never get there
   */
  test('walks while a direction is held, and out of the chunk', async ({ page }) => {
    test.slow();

    const world = boardOf(page);

    await expect(world).toBeVisible();

    // Waited for rather than read: the board names its chunk once it
    // has read one, and until then it names nothing at all
    await expect.poll(async () => placeOf(world), { timeout: 30_000 }).not.toBe('');

    const from = await placeOf(world);
    // Alternating, because a held key walks into scenery and stays
    // there: what is being tested is that it walks at all, not that it
    // can find its own way round a boulder
    const ways = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'] as const;
    let left = from;

    for (const way of ways) {
      await page.keyboard.down(way);
      await expect
        .poll(async () => placeOf(world), { timeout: 12_000 })
        .not.toBe(from)
        .catch(() => {
          // That way was blocked, or is the edge of the world. The
          // next one is as good
        });
      await page.keyboard.up(way);
      left = await placeOf(world);
      if (left !== from) {
        break;
      }
    }

    expect(left, 'the keyboard walked the player out of the chunk').not.toBe(from);
  });

  test('opens the world map as a picture', async ({ page }) => {
    const map = await openPanel(page, 'World');

    await expect(map.locator('canvas')).toBeVisible();
  });

  test('lets a dialog go and gives the world back', async ({ page }) => {
    const profile = await openPanel(page, 'Profile');

    await expect(profile.getByRole('tab', { name: 'Battles' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expectShut(profile);

    // And the menu is live again afterwards. A dialog that closes but
    // leaves its overlay behind looks shut and swallows every press
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
    // `openPanel` asserts the panel is up, which is the whole point
    await openPanel(page, 'Catches');
  });
});
