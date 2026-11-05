import { type Locator, type Page, expect, test } from '@playwright/test';
import { DEMO_TEAM_SIZE } from '../src/overworld/raid/demo';

/**
 * A fight, in a browser.
 *
 * Every battle the game itself stages is one somebody walked to,
 * filled a lobby for and paid a host's start button for, and none of
 * that can be arranged from here — so the fight under test is the one
 * `/demo/raid` stages, which is the point of that page. It is the real
 * engine (`createRaidBattle`) over the real shapes, drawn by the real
 * canvas and the real cards; what it is missing is the raid record
 * behind it, and nothing on screen comes from that.
 *
 * So this covers what a browser can see and a unit test cannot: that
 * the field measures itself against the room it was given, that a card
 * exists for every pokemon in the viewer's party, and that the fight
 * runs to its end and says how it ended.
 */

/**
 * How long to give a fight to settle. The engine runs in real time,
 * and a boss against four parties takes minutes
 */
const SETTLING = 400_000;

/**
 * The cards themselves.
 *
 * Direct children rather than every `listitem` under the row: a card
 * holds a grid of four move boxes and each of those is a list item
 * too, so asking for the descendants of a six-pokemon party answers
 * thirty
 */
function cardsOf(page: Page): Locator {
  return page.getByRole('list', { name: 'Your party' }).locator('> li');
}

test.describe('a battle', () => {
  test('runs to its end', async ({ page }) => {
    test.setTimeout(SETTLING + 60_000);
    await page.goto('/demo/raid?seed=poketerra');

    // The field takes the width it is offered rather than sitting
    // letterboxed in the middle of a page of nothing
    const field = page.locator('canvas').first();

    // The demo route is compiled on its first visit, which can outlast the default wait
    await expect(field).toBeVisible({ timeout: 90_000 });

    const bounds = await field.boundingBox();
    const room = page.viewportSize();

    expect(bounds?.width ?? 0).toBeGreaterThan((room?.width ?? 0) * 0.5);
    expect(bounds?.height ?? 0).toBeGreaterThan(200);

    // A card for each of the viewer's own pokemon, saying what it is
    const cards = cardsOf(page);

    await expect(cards).toHaveCount(DEMO_TEAM_SIZE);

    const first = cards.first();

    await expect(first.getByText(/^Lv\. \d+$/)).toBeVisible();

    // And it is a fight rather than a picture of one: the engine runs
    // until the page reports how it ended
    await expect(
      page.getByText(
        /^(The boss is still standing|The parties took it down|Nobody left standing)\.$/,
      ),
    ).toBeVisible({ timeout: SETTLING });
  });
});
