import { type Locator, type Page, expect } from '@playwright/test';
import { type BoardCell, fitPicture, projectBoardCell, projectCell } from '../src/canvas/board';
import { CHUNK_CELLS } from '../src/overworld/chunk';
import Landmark, { LANDMARK_NAMES } from '../src/data/overworld/landmark';
import World from '../src/overworld/world';
import { uidOf, upsertRow } from './admin';
import { type Player, dialogNamed, expectOpen } from './game';

/**
 * Getting somewhere in the world.
 *
 * The board is one canvas that redraws every frame, so there is nothing
 * for Playwright to hover or press by name: a cell is a point on a
 * tilted plane, worked out through the game's own projection. These are
 * the readings and presses that every spec which walks anywhere needs.
 *
 * Walking *to* a distant landmark is a different problem, and one the
 * suite skips the way [`raid.ts`](./raid.ts) skips the walk to a lair:
 * the world is derived from a seed, so where a landmark stands can be
 * worked out in Node, and the player is stood next to it before the
 * page is loaded. Everything after the press is the real game.
 */

/**
 * The world the browser is deriving. The seed is the deployment's, and
 * the fallback is the one development and the tests share
 */
export function world(): World {
  return new World(process.env.VITE_WORLD_SEED ?? 'overworld');
}

/**
 * Where a fraction of the picture sits on screen.
 *
 * Through the game's own projection and the game's own fitting rather
 * than by dividing the box into a grid. The board is drawn as a tilted
 * plane — the far rows are narrower and shallower than the near ones —
 * so an evenly divided box would aim at the wrong cell everywhere
 * except the middle. And the canvas is the whole page, with the
 * picture fitted inside it, so the element's own box is not the
 * picture either
 */
export function spotOf(
  bounds: { x: number; y: number; width: number; height: number },
  point: { x: number; y: number },
): { x: number; y: number } {
  const frame = fitPicture(bounds.width, bounds.height);

  return {
    x: bounds.x + frame.x + point.x * frame.width,
    y: bounds.y + frame.y + point.y * frame.height,
  };
}

/** The board itself, which is the whole page under everything else */
export function boardOf(page: Page): Locator {
  return page.locator('main canvas').first();
}

/** Where a cell sits on screen */
export async function cellAt(
  board: Locator,
  index: number,
): Promise<{ x: number; y: number } | null> {
  const bounds = await board.boundingBox();

  return bounds == null ? null : spotOf(bounds, projectCell(index));
}

/**
 * What the cell is called, which is how a spawn is told from bare
 * ground. The pointer is moved rather than the locator hovered: there
 * is nothing for Playwright's actionability checks to wait for on a
 * canvas, and paying for them once per cell is the whole cost of a
 * sweep
 */
export async function nameAt(page: Page, board: Locator, index: number): Promise<string> {
  const at = await cellAt(board, index);

  if (at == null) {
    return '';
  }
  await page.mouse.move(at.x, at.y);
  return (await board.getAttribute('title')) ?? '';
}

export async function pressCell(page: Page, board: Locator, index: number): Promise<void> {
  const at = await cellAt(board, index);

  if (at != null) {
    await page.mouse.click(at.x, at.y);
  }
}

/**
 * Press one of the threshold cells around the chunk, which is how a
 * player leaves it: the walk goes to the edge and takes one more step
 * over it, into the chunk beyond
 */
export async function pressEdge(page: Page, board: Locator, cell: BoardCell): Promise<void> {
  const bounds = await board.boundingBox();

  if (bounds == null) {
    return;
  }
  const spot = spotOf(bounds, projectBoardCell(cell));

  await page.mouse.click(spot.x, spot.y);
}

/**
 * Which chunk the player is standing in, read off the board's own
 * name: "Savanna (209, -105)".
 *
 * The whole label will not do — it ends with whatever the cursor is
 * pointing at, and pressing a threshold moves the cursor onto it and
 * renames the label there and then. The country and the coordinates
 * are the part that only changes when a boundary is crossed
 */
export async function placeOf(board: Locator): Promise<string> {
  const said = (await board.getAttribute('aria-label')) ?? '';

  return /Chunk map\. ([^.]+)\./.exec(said)?.[1] ?? said;
}

/** One landmark, and the chunk it stands in */
export interface Standing {
  chunkX: number;
  chunkY: number;
  cell: number;
}

/**
 * How far out from the origin to look for a landmark before giving up.
 * A ring of chunks rather than a walk: nothing is loaded, drawn or
 * asked of the server, so this is arithmetic
 */
const SEARCH_RINGS = 12;

/**
 * The nearest chunk to the origin holding this landmark.
 *
 * Every chunk derives its landmarks from the world seed, so where one
 * stands is a fact a test can work out rather than a place it has to
 * find by walking
 */
export function findLandmark(kind: Landmark): Standing | null {
  const derived = world();

  for (let ring = 0; ring <= SEARCH_RINGS; ring++) {
    for (let chunkY = -ring; chunkY <= ring; chunkY++) {
      for (let chunkX = -ring; chunkX <= ring; chunkX++) {
        // Only the ring's own edge: the inside of it was swept by the
        // rounds before this one
        if (Math.max(Math.abs(chunkX), Math.abs(chunkY)) !== ring) {
          continue;
        }
        for (const [cell, landmark] of derived.getChunk(chunkX, chunkY).getLandmarkCells()) {
          if (landmark === kind) {
            return { chunkX, chunkY, cell };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Stand the player one step from a landmark, before the page has read
 * where they are. Written straight into the store the way a staged
 * raid is: the walk is the only thing skipped
 */
export async function standBeside(player: Player, at: Standing): Promise<void> {
  const cellX = at.cell % CHUNK_CELLS;
  const cellY = Math.floor(at.cell / CHUNK_CELLS);

  await upsertRow('positions', {
    player: await uidOf(player),
    chunk_x: at.chunkX,
    chunk_y: at.chunkY,
    // One cell over, so the press is a step rather than a hike. The
    // landmark is never on the outer rows, so there is always room
    cell_x: cellX > 0 ? cellX - 1 : cellX + 1,
    cell_y: cellY,
    moved_at: Date.now(),
  });
}

/**
 * Open the auction house the way a player does: by standing at a board.
 *
 * There is no key for it in the menu — the lots are read at a board out
 * in the world, which is what makes trading somewhere a player goes —
 * so a spec that wants the panel has to go there too
 */
export async function openAuctionBoard(page: Page, player: Player): Promise<Locator> {
  const standing = findLandmark(Landmark.AuctionBoard);

  if (standing == null) {
    throw new Error('no auction board stands within reach of the origin');
  }
  const board = boardOf(page);

  // Written down and then checked, rather than written down and
  // trusted. The world saves where the player is standing as they
  // walk, so a save still in the air when the row is written puts them
  // back where they started; what says it took is the chunk the board
  // names once the page has read it again
  await expect(async () => {
    await standBeside(player, standing);
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Game' })).toBeVisible({ timeout: 20_000 });
    await expect(board).toBeVisible();
    expect(await placeOf(board)).toContain(`(${standing.chunkX}, ${standing.chunkY})`);
  }).toPass({ timeout: 60_000 });

  // Aimed at rather than fired at. The chunk is still being read when
  // the canvas first appears, and a press at a board that is not drawn
  // yet lands on bare ground — so the cell is hovered until it says
  // what is standing on it, which is also what proves the arithmetic
  // above found the right one
  await expect(async () => {
    expect(await nameAt(page, board, standing.cell)).toContain(
      LANDMARK_NAMES[Landmark.AuctionBoard],
    );
  }).toPass({ timeout: 30_000 });

  // The walk is one step, and the panel opens when it arrives
  await pressCell(page, board, standing.cell);

  const lots = dialogNamed(page, 'Auctions');

  await expectOpen(lots, 20_000);
  return lots;
}
