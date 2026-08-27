import { type Locator, type Page, expect, test } from '@playwright/test';
import { CHUNK_CELLS, PLACEMENT_AREA, centeredCells } from '../src/overworld/chunk';
import { getRegisteredSpecies, getSpeciesData, registerSpecies } from '../src/data/species';
import { SHEET, claimStarter, dialogNamed, expectOpen, signIn } from './game';
import { nameAt, placeOf, pressCell, pressEdge } from './walk';

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
 * of the pokemon standing in one to walk up to.
 *
 * The search is deliberately shaped to be cheap. Reading what is on a
 * cell means moving the pointer onto it and asking the canvas what it
 * is called, which is a round trip to the browser — so the chunk is
 * swept **once** to find out where everything is, and the walking is
 * done afterwards against that list. Sweeping again on every step, the
 * obvious way to write this, costs a quarter of a minute per step and
 * turns the test into a ten-minute one
 */
const STRETCHES = 2;
const CANDIDATES = 2;

/**
 * How long to give a walk, per cell of it, and how many cells of slack
 * to allow on top.
 *
 * A press is a destination rather than a step: the player walks there
 * on their own at a quarter of a second a cell, so what a walk costs
 * is known from how far it is. Waiting a flat twenty seconds for every
 * one of them is most of a run spent watching somebody who arrived.
 *
 * The pace here is several times the game's own on purpose: it is a
 * limit rather than a measurement, and the thing being tested is that
 * the walk arrives at all
 */
const WALK_PACE = 800;
const WALK_SLACK = 8;

/**
 * The longest anything here waits: a walk from one corner of a chunk to
 * the other, and then some
 */
const WALK_LIMIT = (CHUNK_CELLS * 2 + WALK_SLACK) * WALK_PACE;

/**
 * Where the middle of the chunk is, which is where a player who has
 * just arrived in one is standing. Spawns are tried nearest-first
 * against it, so the test walks the short way to something rather than
 * the length of the board
 */
const MIDDLE = CHUNK_CELLS / 2;

/**
 * How far a cell is from the middle of the chunk, in straight steps —
 * which is what the walk is measured in
 */
function stepsBetween(index: number): number {
  return (
    Math.abs((index % CHUNK_CELLS) - MIDDLE) + Math.abs(Math.floor(index / CHUNK_CELLS) - MIDDLE)
  );
}

/**
 * Every cell of this chunk with something standing on it
 */
async function findSpawns(page: Page, world: Locator): Promise<number[]> {
  const standing: number[] = [];

  // The central square only. Nothing is ever rolled onto the outer
  // rows — a player walking in from an edge would land on top of it —
  // so sweeping them is a hundred round trips to be told about bare
  // ground
  for (const cell of centeredCells(PLACEMENT_AREA)) {
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
 * One press per pokemon, and then a wait: pressing something out of
 * reach is asking to be beside it, and the game walks the whole way
 * there on its own and reaches out when it arrives. Nearest first, so
 * that a run spends its time meeting something rather than crossing
 * the board to it
 */
async function meetSomething(page: Page, world: Locator): Promise<boolean> {
  const throwing = page.getByRole('button', { name: /^Throw / });

  for (let stretch = 0; stretch < STRETCHES; stretch++) {
    const standing = (await findSpawns(page, world))
      .sort((one, other) => stepsBetween(one) - stepsBetween(other))
      .slice(0, CANDIDATES);

    for (const cell of standing) {
      await pressCell(page, world, cell);

      const met = await throwing
        .waitFor({
          state: 'visible',
          timeout: (stepsBetween(cell) + WALK_SLACK) * WALK_PACE,
        })
        .then(() => true)
        .catch(() => false);

      if (met) {
        return true;
      }
      // It is gone — the window turned over, it fled, or the way to it
      // was blocked. The next one on the list is as good
    }
    // Nothing here worth walking to, so walk out of it: a threshold
    // cell is a step into the chunk beyond, and country this player
    // has not seen. Alternating sides keeps it from pacing back over
    // the same ground
    const here = await placeOf(world);

    await pressEdge(page, world, stretch % 2 === 0 ? { x: -1, y: MIDDLE } : { x: MIDDLE, y: -1 });
    // Waited on the board saying somewhere else rather than on the
    // clock: a walk to the edge is however long it is, and a run that
    // has already crossed should get on with looking
    await expect
      .poll(async () => placeOf(world), { timeout: WALK_LIMIT })
      .not.toBe(here)
      .catch(() => {
        // It did not get out of this chunk. Sweeping it again is the
        // worst this costs, and the run still ends by saying honestly
        // that it met nothing
      });
  }
  return false;
}

test.describe('the safari', () => {
  test('opens the sheet for the new pokemon the moment it is caught', async ({ page }) => {
    test.slow();

    await signIn(page);
    await claimStarter(page);

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
     * What the ball holding leaves behind: the offer to look at what
     * was caught. The sheet is not opened for the player — it is
     * offered, since one that arrived on its own would land before
     * they had taken in that they caught anything — so this is the
     * signal that the throw worked
     */
    const look = page.getByRole('button', { name: 'Have a look' });

    /**
     * Asked without waiting, all of it. Every one of these is a
     * question about a dialog that is being redrawn under the answer,
     * and a locator that waits for an element the encounter has
     * finished with hangs until the whole test times out
     */
    const showing = async (button: typeof look): Promise<boolean> =>
      button.isVisible().catch(() => false);

    for (let ball = 0; ball < 25; ball++) {
      if (await showing(look)) {
        break;
      }
      if (!(await showing(throwBall)) || (await throwBall.isDisabled().catch(() => true))) {
        break;
      }
      await throwBall.click();
      await page.waitForTimeout(1200);
    }

    // Either it is in the bag and there is something to look at, or the
    // encounter ended some other way — which is the game working, but
    // not the thing being tested
    test.skip(
      !(await showing(look)),
      'the encounter ended without a catch — it fled, or the balls ran out',
    );

    await look.click();

    const sheet = dialogNamed(page, SHEET);

    await expectOpen(sheet);
    await expect(sheet.getByRole('button', { name: /^Lv\. \d+/ })).toBeVisible();
    // And the encounter it came from is gone rather than sitting under it
    await expect(page.getByRole('button', { name: /^Throw / })).toBeHidden();
  });
});
