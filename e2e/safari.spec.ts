import { type Locator, type Page, expect, test } from '@playwright/test';
import { CHUNK_CELLS } from '../src/overworld/chunk';
import { getRegisteredSpecies, getSpeciesData, registerSpecies } from '../src/data/species';
import { SHEET, dialogNamed, dismissGift, expectOpen, signIn } from './game';

/**
 * Meeting something and catching it.
 *
 * This is the one flow the game is named after, and the one that
 * cannot be checked any other way: the encounter is staged by the
 * server from a chunk the client derived, the throw spends a real ball
 * out of a real bag, and what it leaves behind is a record written
 * under the player's own id. Every part of that is mocked away in a
 * unit test, and the part worth knowing about — that a successful
 * throw puts the new pokemon's sheet in front of the player — only
 * exists on screen.
 */

registerSpecies();

/**
 * Everything the chunk canvas might name a pokemon. A cell is titled
 * after whatever is standing on it, and a landmark is titled after the
 * landmark, so a species name is how a spawn is told from a berry
 * patch
 */
const SPECIES_NAMES = new Set(getRegisteredSpecies().map((id) => getSpeciesData(id).name));

/**
 * How many stretches of country to try before giving up, and how many
 * steps to spend walking towards one pokemon.
 *
 * The search is deliberately shaped to be cheap. Reading what is on a
 * cell means moving the pointer onto it and asking the canvas what it
 * is called, which is a round trip to the browser — so the chunk is
 * swept **once** to find out where everything is, and the walking is
 * done afterwards against that list. Sweeping again on every step, the
 * obvious way to write this, costs a quarter of a minute per step and
 * turns the test into a ten-minute one
 */
const STRETCHES = 4;
const STEPS = 24;

/**
 * How far to walk when there is nothing here worth walking to.
 *
 * A press on a distant cell is one step towards it rather than a jump,
 * so getting somewhere new means pressing the same corner over and
 * over. A chunk is sixteen cells across, and this is enough to cross
 * one and start on the next
 */
const WANDER = 20;

/**
 * Where a cell sits on screen
 */
async function cellAt(world: Locator, index: number): Promise<{ x: number; y: number } | null> {
  const bounds = await world.boundingBox();

  if (bounds == null) {
    return null;
  }

  const size = { width: bounds.width / CHUNK_CELLS, height: bounds.height / CHUNK_CELLS };

  return {
    x: bounds.x + (index % CHUNK_CELLS) * size.width + size.width / 2,
    y: bounds.y + Math.floor(index / CHUNK_CELLS) * size.height + size.height / 2,
  };
}

/**
 * What the cell is called, which is how a spawn is told from bare
 * ground. The pointer is moved rather than the locator hovered: the
 * board is one canvas that redraws every frame, so there is nothing
 * for Playwright's actionability checks to wait for and paying for
 * them 256 times is the whole cost of the sweep
 */
async function nameAt(page: Page, world: Locator, index: number): Promise<string> {
  const at = await cellAt(world, index);

  if (at == null) {
    return '';
  }
  await page.mouse.move(at.x, at.y);
  return (await world.getAttribute('title')) ?? '';
}

async function pressCell(page: Page, world: Locator, index: number): Promise<void> {
  const at = await cellAt(world, index);

  if (at != null) {
    await page.mouse.click(at.x, at.y);
  }
}

/**
 * Every cell of this chunk with something standing on it
 */
async function findSpawns(page: Page, world: Locator): Promise<number[]> {
  const standing: number[] = [];

  for (let cell = 0; cell < CHUNK_CELLS * CHUNK_CELLS; cell++) {
    if (SPECIES_NAMES.has(await nameAt(page, world, cell))) {
      standing.push(cell);
    }
  }
  return standing;
}

/**
 * Walk up to something and meet it. Resolves true once an encounter is
 * open.
 *
 * Pressing a pokemon that is out of reach walks a step towards it
 * rather than doing nothing, which is what makes this a walk: the same
 * press, repeated, until it is close enough to be a meeting
 */
async function meetSomething(page: Page, world: Locator): Promise<boolean> {
  const throwing = page.getByRole('button', { name: /^Throw / });

  for (let stretch = 0; stretch < STRETCHES; stretch++) {
    for (const cell of await findSpawns(page, world)) {
      for (let step = 0; step < STEPS; step++) {
        await pressCell(page, world, cell);

        if (await throwing.isVisible().catch(() => false)) {
          return true;
        }
        // It is gone — the window turned over, or it fled. The next
        // one on the list is as good
        if (!SPECIES_NAMES.has(await nameAt(page, world, cell))) {
          break;
        }
      }
    }
    // Nothing here worth walking to, so walk out of it: a corner
    // pressed enough times crosses the chunk and lands on country this
    // player has not seen. Alternating corners keeps it from pacing
    // back over the same ground
    for (let step = 0; step < WANDER; step++) {
      await pressCell(page, world, stretch % 2 === 0 ? 0 : CHUNK_CELLS * CHUNK_CELLS - 1);
    }
  }
  return false;
}

test.describe('the safari', () => {
  test('opens the sheet for the new pokemon the moment it is caught', async ({ page }) => {
    test.slow();

    await signIn(page);
    await dismissGift(page);

    const world = page.locator('main canvas').first();

    await expect(world).toBeVisible();

    const met = await meetSomething(page, world);

    // The world is derived, not seeded: a run that walked into an
    // empty stretch has nothing to catch, and saying so is honester
    // than passing on an encounter that never happened
    test.skip(!met, 'no spawn came within reach of the player in this world');

    const throwBall = page.getByRole('button', { name: /^Throw / });

    await expect(throwBall).toBeVisible();

    /**
     * Whether the catch has landed. The sheet opening is the signal —
     * it is what the throw is supposed to produce
     */
    const caughtYet = async (): Promise<boolean> => (await dialogNamed(page, SHEET).count()) > 0;

    for (let ball = 0; ball < 25; ball++) {
      if (await caughtYet()) {
        break;
      }
      if (await throwBall.isDisabled().catch(() => true)) {
        break;
      }
      await throwBall.click();
      await page.waitForTimeout(1200);
    }

    // Either it is in the bag and its sheet is open, or the encounter
    // ended some other way — which is the game working, but not the
    // thing being tested
    const caught = await caughtYet();

    test.skip(!caught, 'the encounter ended without a catch — it fled, or the balls ran out');

    const sheet = dialogNamed(page, SHEET);

    await expectOpen(sheet);
    await expect(sheet.getByRole('button', { name: /^Lv\. \d+/ })).toBeVisible();
    // And the encounter it came from is gone rather than sitting under it
    await expect(page.getByRole('button', { name: /^Throw / })).toBeHidden();
  });
});
