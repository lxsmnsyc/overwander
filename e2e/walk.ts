import { type Locator, type Page, expect } from '@playwright/test';
import {
  BOARD_CELLS,
  BOARD_CENTER,
  BOARD_RADIUS,
  fitPicture,
  projectBoardCell,
  projectCell,
  reachOf,
  setBoardScreen,
} from '../src/canvas/overworld/board';
import { CHUNK_CELLS } from '../src/overworld/chunk';
import type Landmark from '../src/data/overworld/landmark';
import World from '../src/overworld/world';
import { GENERATION, findRows, uidOf, upsertRow } from './admin';
import { reloadGame } from './game';
import type { Player } from './game';

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
  return new World(process.env.VITE_WORLD_SEED ?? 'overworld', undefined, GENERATION);
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
  point: () => { x: number; y: number },
): { x: number; y: number } {
  // A screen taller than it is wide is drawn flat rather than laid
  // back, so the projection is told which screen this is before it is
  // asked where anything landed. The point comes as a thunk for that
  // reason: worked out first, it would answer for the last screen
  setBoardScreen(bounds.width, bounds.height);

  const at = point();
  const frame = fitPicture(bounds.width, bounds.height);

  return {
    x: bounds.x + frame.x + at.x * frame.width,
    y: bounds.y + frame.y + at.y * frame.height,
  };
}

/** The board itself, which is the whole page under everything else */
export function boardOf(page: Page): Locator {
  // By its role rather than by being the first canvas in the page: the
  // board is drawn on one canvas and pressed on another, the painting
  // one comes first, and it is `aria-hidden` with no name and no title
  // on it. Read off that one, everything this file asks the board
  // comes back empty
  return page.getByRole('application', { name: /^Chunk map\./ });
}

/** Where a cell sits on screen */
export async function cellAt(
  board: Locator,
  index: number,
): Promise<{ x: number; y: number } | null> {
  const bounds = await board.boundingBox();

  return bounds == null ? null : spotOf(bounds, () => projectCell(index));
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
 * Press the furthest cell of the live circle in one direction, which
 * is how a walk covers ground. The country drawn past it is pressable
 * too, but only the live circle is guaranteed to be inside the picture
 * however the board is turned, and a click has to land on the canvas
 */
export async function pressFar(page: Page, board: Locator, way: [number, number]): Promise<void> {
  const bounds = await board.boundingBox();

  if (bounds == null) {
    return;
  }

  let reach = { x: BOARD_CENTER, y: BOARD_CENTER };

  for (let step = 1; step < BOARD_CELLS; step++) {
    const candidate = { x: BOARD_CENTER + way[0] * step, y: BOARD_CENTER + way[1] * step };

    if (reachOf(candidate) > BOARD_RADIUS) {
      break;
    }
    reach = candidate;
  }

  // The point is a thunk: the screen has to be named from the board's
  // own box before anything is put through the projection
  const spot = spotOf(bounds, () => projectBoardCell(reach));

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
 * Stand the player one step from a landmark. The page is reloaded so
 * it reads the position back, and the walk to the landmark is the only
 * thing skipped.
 *
 * The row is written **after** the page has written its own. A new
 * player has no row, so the page rolls a start position and saves it
 * once the world is up. A row written before that save is overwritten
 * by it, and the player is back in their start town.
 *
 * Resolves the **board** cell the landmark will be drawn on. The board
 * is a window that keeps the player in the middle of it, so where
 * something sits on screen is worked out from how far it is from them
 * rather than from where it sits in its chunk
 */
export async function standBeside(page: Page, player: Player, at: Standing): Promise<number> {
  const cellX = at.cell % CHUNK_CELLS;
  const cellY = Math.floor(at.cell / CHUNK_CELLS);
  // One cell over, so the press is a step rather than a hike. The
  // landmark is never on the outer rows, so there is always room
  const stoodX = cellX > 0 ? cellX - 1 : cellX + 1;
  const uid = await uidOf(player);

  // Wait for the page's own save of its start position
  await expect
    .poll(async () => (await findRows('positions', 'player', uid)).length, { timeout: 30_000 })
    .toBeGreaterThan(0);

  await upsertRow('positions', {
    player: uid,
    generation: GENERATION,
    chunk_x: at.chunkX,
    chunk_y: at.chunkY,
    cell_x: stoodX,
    cell_y: cellY,
    moved_at: Date.now(),
  });
  await reloadGame(page);
  return BOARD_CENTER * BOARD_CELLS + BOARD_CENTER + (cellX - stoodX);
}
