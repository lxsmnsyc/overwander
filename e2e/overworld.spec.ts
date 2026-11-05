import { type Page, expect, test } from '@playwright/test';
import Landmark from '../src/data/overworld/landmark';
import { GENERATION, findRows, sql, uidOf } from './admin';
import { type Player, expectShut, openMenu, openPanel, settled, signIn } from './game';
import { boardOf, findLandmark, placeOf, standBeside } from './walk';

/**
 * The page a player spends nearly all of their time on: the chunk they
 * are standing in, and the one button that reaches everything else.
 */

/**
 * One player and one page for the whole file: the world loads once, and
 * the tests run in order on it. Signing out is last
 */
test.describe('the overworld', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let player: Player;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000);
    page = await (await browser.newContext()).newPage();
    player = await signIn(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test('draws the chunk and nothing else', async () => {
    const world = boardOf(page);

    await expect(world).toBeVisible();

    // The map is the page. Anything laid out around it — a heading, a
    // strip of prose explaining what an overworld is — was taken out
    // on purpose, and this is what says it stays out
    const bounds = await world.boundingBox();

    expect(bounds?.height ?? 0).toBeGreaterThan(300);
  });

  test('reaches everything from the one button at the bottom', async () => {
    const menu = await openMenu(page);

    // Everything that is not the world, as a keypad. There is no key
    // for the auctions: the lots are read at a board out in the world,
    // which is what makes trading somewhere a player goes
    for (const label of [
      'World',
      'Notices',
      'Profile',
      'Boxes',
      'Bag',
      'Pokedex',
      'Quests',
      'Gifts',
      'Battle',
      'Raids',
      'Settings',
      'News',
    ]) {
      // A key with something waiting wears a count after its name ("Gifts 16")
      await expect(
        menu.getByRole('button', { name: new RegExp(`^${label}( \\d+)?$`) }),
      ).toBeEnabled();
    }
  });

  /**
   * Walking on the keyboard, and going on walking while the key is
   * held. The chunk the board names is the coarsest thing that can be
   * read back, so the walk is the one out of the chunk: a held key
   * that only ever took one step would never get there
   */
  test('walks while a direction is held, and out of the chunk', async () => {
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

  /**
   * The helper every staged spec stands on: the player is put beside a
   * landmark worked out in Node, and the board names that landmark's
   * chunk once the page has read the position back
   */
  test('stands the player beside a landmark', async () => {
    const centre = findLandmark(Landmark.PokemonCenter);

    expect(centre, 'a Pokemon Center stands within reach of the origin').not.toBeNull();
    if (centre == null) {
      return;
    }

    const world = boardOf(page);

    await standBeside(page, player, centre);
    await expect(world).toBeVisible();
    expect(await placeOf(world)).toContain(`(${centre.chunkX}, ${centre.chunkY})`);
  });

  /**
   * A player signed in twice has two boards writing one position row.
   * The other screen is staged by writing the row directly: what is
   * tested is what this screen does when the walk turns up elsewhere,
   * heard over the live socket
   */
  test('stands down when the walk moves to another screen', async () => {
    const uid = await uidOf(player);
    const takeOver = page.getByRole('button', { name: 'Walk here instead' });

    await settled(page);
    await expect
      .poll(async () => (await findRows('positions', 'player', uid)).length, { timeout: 30_000 })
      .toBeGreaterThan(0);

    const [row] = await findRows('positions', 'player', uid);
    const startedAt = Number(row.chunk_x);

    // Nobody else is walking yet
    await expect(takeOver).toBeHidden();

    // Stamped ahead of anything this screen has written, since a screen
    // that took a foreign write for its own would never stand down
    await sql`
      update positions set chunk_x = ${startedAt + 5}, moved_at = ${Date.now() + 60_000}
      where player = ${uid} and generation = ${GENERATION}
    `;
    await expect(takeOver).toBeVisible({ timeout: 30_000 });

    // Taking it back stands this screen up where the other one left off
    await takeOver.click();
    await expect(takeOver).toBeHidden();
  });

  test('lets a dialog go and gives the world back', async () => {
    const profile = await openPanel(page, 'Profile');

    await expect(profile.getByRole('tab', { name: 'Battles' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expectShut(profile);

    // And the menu is live again afterwards. A dialog that closes but
    // leaves its overlay behind looks shut and swallows every press
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible();
    // `openPanel` asserts the panel is up, which is the whole point
    const boxes = await openPanel(page, 'Boxes');

    await page.keyboard.press('Escape');
    await expectShut(boxes);
  });

  test('signs out back to the way in', async () => {
    // What the page throws while the world is torn down, so a failure to
    // reach the form says why
    const faults: string[] = [];

    page.on('pageerror', (error) => {
      faults.push(error.message);
    });
    const profile = await openPanel(page, 'Profile');

    await profile.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    // The world is gone and the form is back
    await expect(page.getByLabel('Email'), faults.join('; ')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeHidden();
  });
});
