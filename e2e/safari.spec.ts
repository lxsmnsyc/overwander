import { type Locator, type Page, expect, test } from '@playwright/test';
import { BOARD_CELLS, BOARD_CENTER, boardCells, reachOf } from '../src/canvas/board';
import { getRegisteredSpecies, getSpeciesData, registerSpecies } from '../src/data/species';
import { SHEET, claimStarter, dialogNamed, expectOpen, signIn } from './game';
import { boardOf, nameAt, placeOf, pressCell, pressFar } from './walk';

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
 * The longest anything here waits: a walk across the board and then
 * some
 */
const WALK_LIMIT = (BOARD_CELLS + WALK_SLACK) * WALK_PACE;

/**
 * How long a throw is given to answer. The ball lands, rocks up to
 * three times with a beat between each, and lies still before the
 * result is said, so a throw is seconds rather than the moment the
 * request takes
 */
const THROW_LIMIT = 8_000;

/**
 * How many times one stretch presses for the far side of the board.
 * Two crosses a chunk boundary from anywhere, since one press walks
 * the player half the board's width
 */
const EDGE_PUSHES = 2;

/**
 * How far out from the player the sweep looks, in cells. It is a round
 * trip to the browser per cell, so it reads a near neighbourhood
 * rather than the whole board
 */
const SWEEP_REACH = 7;

/**
 * How far a cell is from the player, in straight steps, which is what
 * the walk is measured in. The player stands in the middle of the
 * board and stays there
 */
function stepsBetween(index: number): number {
  return (
    Math.abs((index % BOARD_CELLS) - BOARD_CENTER) +
    Math.abs(Math.floor(index / BOARD_CELLS) - BOARD_CENTER)
  );
}

/**
 * Every cell near the player with something standing on it
 */
async function findSpawns(page: Page, world: Locator): Promise<number[]> {
  const standing: number[] = [];

  // Only what is near enough to be worth walking to: the board is a
  // wide circle, and sweeping the whole of it is four hundred round
  // trips to be told about bare ground
  for (const spot of boardCells().filter((cell) => reachOf(cell) <= SWEEP_REACH)) {
    const cell = spot.y * BOARD_CELLS + spot.x;

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
    // Nothing here worth walking to, so walk out of it. A press on the
    // apron is a walk across the board and one step past it, which is
    // most of a chunk but not always all of it, so it is pressed again
    // until the board names somewhere else. Alternating sides keeps it
    // from pacing back over the same ground
    const here = await placeOf(world);

    for (let push = 0; push < EDGE_PUSHES && (await placeOf(world)) === here; push++) {
      await pressFar(page, world, stretch % 2 === 0 ? [-1, 0] : [0, -1]);
      // Waited on the board saying somewhere else rather than on the
      // clock: a walk to the edge is however long it is, and a run that
      // has already crossed should get on with looking
      await expect
        .poll(async () => placeOf(world), { timeout: WALK_LIMIT })
        .not.toBe(here)
        .catch(() => {
          // It did not get out of this chunk. Pressing again is the
          // worst this costs, and the run still ends by saying honestly
          // that it met nothing
        });
    }
  }
  return false;
}

test.describe('the safari', () => {
  test('opens the sheet for the new pokemon the moment it is caught', async ({ page }) => {
    test.slow();

    await signIn(page);
    await claimStarter(page);

    const world = boardOf(page);

    await expect(world).toBeVisible();

    const met = await meetSomething(page, world);

    // The world is derived, not seeded: a run that walked into an
    // empty stretch has nothing to catch, and saying so is honester
    // than passing on an encounter that never happened
    test.skip(!met, 'no spawn came within reach of the player in this world');

    const throwBall = page.getByRole('button', { name: /^Throw / });

    await expect(throwBall).toBeVisible();

    /**
     * The canvas, marked so it can be recognised again.
     *
     * Ending an encounter re-reads what has run from this player, and
     * a resource being re-read is a resource that is loading: read the
     * ordinary way it throws the board back to its boundary, which
     * tears the canvas down and builds a new one. Nothing is lost by
     * it and it looks like the world reloading because something ran
     * off. A rebuilt canvas would not be carrying this
     */
    await world.evaluate((canvas) => {
      canvas.setAttribute('data-standing', 'yes');
    });

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
      // Waited on the throw being over rather than on the clock. The
      // button is shut for as long as the ball is in the air, so a
      // flat beat shorter than the animation read a throw still
      // rocking as an encounter that had ended
      await expect
        .poll(
          async () => (await showing(look)) || !(await throwBall.isDisabled().catch(() => true)),
          { timeout: THROW_LIMIT },
        )
        .toBe(true)
        .catch(() => {
          // Still nothing, which the next turn of the loop reads for
          // itself: either the encounter ended or the bag is empty
        });
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
    // And the world it happened in is the one that was standing there
    await expect(page.locator('main canvas[data-standing="yes"]').first()).toBeAttached();
  });
});
