import { type Locator, type Page, expect, test } from '@playwright/test';
import { DEMO_TEAM_SIZE } from '../src/overworld/demo-raid';

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
 * is *running* rather than a still frame of one.
 */

/**
 * How long to give the fight to visibly do something. Moves are cast
 * over seconds and the first exchange lands well inside this
 */
const MOVING = 15_000;

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
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/raid?seed=poketerra');
  });

  test('draws the field at the size of the room it was given', async ({ page }) => {
    const field = page.locator('canvas').first();

    await expect(field).toBeVisible();

    const bounds = await field.boundingBox();
    const room = page.viewportSize();

    // Not a letterboxed picture in the middle of a page of nothing:
    // the canvas takes the width it is offered
    expect(bounds?.width ?? 0).toBeGreaterThan((room?.width ?? 0) * 0.5);
    expect(bounds?.height ?? 0).toBeGreaterThan(200);
  });

  test('gives the viewer a card for each of their own pokemon', async ({ page }) => {
    const cards = cardsOf(page);

    await expect(page.getByRole('list', { name: 'Your party' })).toBeVisible();
    await expect(cards).toHaveCount(DEMO_TEAM_SIZE);

    // What a card is for: what it is, and what it can throw
    const first = cards.first();

    await expect(first.getByText(/^Lv\. \d+$/)).toBeVisible();
    await expect(first.locator('li[title]').first()).toBeVisible();
  });

  test('is a fight rather than a picture of one', async ({ page }) => {
    const party = page.getByRole('list', { name: 'Your party' });
    /**
     * What the whole party has left, as one string. Any one of the six
     * moving is the engine running
     */
    const left = async (): Promise<string> =>
      (await party.locator('span.tabular-nums').allTextContents()).join(',');

    await expect(cardsOf(page).first()).toBeVisible();

    const started = await left();

    // Somebody's health moves — a hit landing, a status ticking, a
    // berry going off. A field that never changes is one whose engine
    // never started, which looks exactly like a working screenshot
    await expect
      .poll(left, { timeout: MOVING, message: 'the battle should be running' })
      .not.toBe(started);
  });

  test('stages a different fight for a different seed', async ({ page }) => {
    await expect(page.getByText('seed poketerra')).toBeVisible();

    await page.getByRole('button', { name: 'Roll another' }).click();

    await expect(page.getByText('seed poketerra')).toBeHidden();
    await expect(page.getByText(/^seed /)).toBeVisible();
    // And the new fight is a fight: the party is rebuilt rather than
    // left pointing at the battle that was ended under it
    await expect(cardsOf(page)).toHaveCount(DEMO_TEAM_SIZE);
  });
});
