import { type SnapshotRecord, spawnId } from '../../../auth/snapshot-record';
import { toLocalTime } from '../../../auth/local-time';
import type Biome from '../../../data/ids/biome';
import type Weather from '../../../data/overworld/weather';
import type Decoration from '../../../data/overworld/decoration';
import type { ItemStack } from '../../../data/overworld/item-pool';
import type Landmark from '../../../data/overworld/landmark';
import type Npc from '../../../data/overworld/npc';
import type Phenomenon from '../../../data/overworld/phenomenon';
import ChunkSnapshot, { SPAWN_COUNT, type Spawn } from '../../../overworld/chunk-snapshot';
import { CHUNK_CELLS, cellInChunk, chunkOfCell } from '../../../overworld/chunk';
import { type BoardGround, readBoardGround } from '../../../overworld/ground';
import type { Buddy } from '../../../overworld/core';
import getWorld from '../../../overworld/current';
import deriveEncounter from '../../../overworld/encounter';
import namePlace from '../../../overworld/place';
import { spawnKey } from '../../../overworld/safari';
import { DARK_DAY_LAMP_CELLS } from '../../../data/overworld/weather';
import createOverworld from '../../../overworld/setup';
import { BOARD_CELLS, BOARD_CENTER, BOARD_MARGIN, BOARD_RADIUS, PUBLISHED_SPAWNS } from './metrics';

/**
 * The board is a window on world cells rather than a chunk, so
 * everything it draws is keyed by where it sits in that window and
 * the chunk it came out of is looked up when the server has to be
 * told which cell was pressed.
 */

/**
 * A cell of the board, said in the words the server knows it by: the
 * window it belongs to and where it sits in that window's chunk
 */
export interface Placed {
  snapshot: ChunkSnapshot;
  cell: number;
}

/** One of the chunks the board window overlaps */
export interface BoardChunk {
  x: number;
  y: number;
  snapshot: ChunkSnapshot;
  /** Where one of its cells falls on the board, or null when off it */
  board: (cell: number) => number | null;
  /** The same cell as a world cell, which is how a claim is remembered */
  world: (cell: number) => [x: number, y: number];
}

/**
 * A window with the chunk it belongs to. The record itself says only
 * when it was rolled and what it rolled, so the coordinates ride
 * beside it rather than being read again where it is used
 */
export interface WatchedWindow {
  x: number;
  y: number;
  record: SnapshotRecord;
}

export interface BoardView {
  /** The world cell the board's own cell 0 sits on */
  originX: number;
  originY: number;
  /** The chunk the player is standing in, which is what names the place */
  chunkX: number;
  chunkY: number;
  /** The country under the player, which is now a fact about the cell */
  biome: Biome;
  weather: Weather;
  /**
   * How far the player sees in the dark here, in cells. It only means
   * anything under a sky that has put the lights out, and it is the
   * buddy's answer as much as the sky's
   */
  lamp: number;
  /** Whether a meeting shows what it is holding. A Frisk buddy is what looks */
  revealsHeld: boolean;
  /**
   * Whether how ready a meeting is to run is said before the first
   * ball. A Forewarn buddy is what knows
   */
  revealsFlight: boolean;
  /**
   * Whether what a meeting can do is read before it is caught. A Trace
   * buddy is what reads it
   */
  revealsAbility: boolean;
  /** The window of the chunk the player is standing in */
  snapshot: ChunkSnapshot;
  /** Every window the board overlaps, which is at most four */
  chunks: BoardChunk[];
  /**
   * Which window covers a board cell, and where the cell sits in it.
   * Null while the chunk that cell belongs to has no window yet, which
   * is also when nothing is drawn there to press
   */
  at: (cell: number) => Placed | null;
  landmarks: Map<number, Landmark>;
  /**
   * The ground the board draws, cell by cell and a little way past
   * its own edges, read out of the world's fields
   */
  ground: BoardGround;
  /** The board's solid rock, which a walk goes round */
  walls: Set<number>;
  decorations: Map<number, Decoration>;
  /**
   * The window's spawns by cell, each with the id it was published
   * under, so an interaction can derive the same encounter every
   * observer sees
   */
  spawns: Map<number, { id: string; spawn: Spawn; shiny: boolean }>;
  caches: Map<number, ItemStack[]>;
  phenomena: Map<number, Phenomenon>;
  /** What every plant on the board is bearing: patches and trees together */
  berries: Map<number, ItemStack>;
  wanderers: Map<number, Npc>;
  coats: Map<number, string>;
}

/** Where a board is, in the words the game names it by */
export function naming(view: BoardView): string {
  return namePlace(view.chunkX, view.chunkY);
}

/** How far a board cell is from the player, who stands in the middle */
function reachOf(cell: number): number {
  return Math.hypot(
    (cell % BOARD_CELLS) - BOARD_CENTER,
    Math.floor(cell / BOARD_CELLS) - BOARD_CENTER,
  );
}

/** The chunks a square of the board, laid at this origin, overlaps */
function chunksOver(
  originX: number,
  originY: number,
  from: number,
  span: number,
): [number, number][] {
  const chunks: [number, number][] = [];

  for (let y = chunkOfCell(originY + from); y <= chunkOfCell(originY + from + span - 1); y++) {
    for (let x = chunkOfCell(originX + from); x <= chunkOfCell(originX + from + span - 1); x++) {
      chunks.push([x, y]);
    }
  }
  return chunks;
}

/**
 * The chunks whose windows the board needs.
 *
 * Only the ones the player can reach into, not the ones they can see:
 * what a window holds is what stands on a cell this quarter hour, and
 * nothing out in the country is met until it has been walked up to.
 * The landmarks and the scenery further out are the chunk seeds' own
 * answer and cost nothing to derive
 */
export function boardChunks(originX: number, originY: number): [x: number, y: number][] {
  const reach = Math.ceil(BOARD_RADIUS);

  return chunksOver(originX, originY, BOARD_CENTER - reach, reach * 2 + 1);
}

/** And the chunks it draws country out of, which is the whole square */
export function viewChunks(originX: number, originY: number): [x: number, y: number][] {
  return chunksOver(originX, originY, 0, BOARD_CELLS);
}

/**
 * Build the board's view from the windows the store currently holds.
 *
 * Everything but the spawns re-derives from the chunk seeds and the
 * windows, so the subscriptions only have to carry those two. A chunk
 * with no window yet contributes nothing: its ground is still drawn,
 * since the ground is the world's rather than the window's
 */
export function buildBoardView(
  originX: number,
  originY: number,
  records: Map<string, WatchedWindow>,
  offset: number,
  player: string | null,
  buddy: Buddy | null,
  fled: Set<string>,
): BoardView {
  const world = getWorld();
  const playerX = chunkOfCell(originX + BOARD_CENTER);
  const playerY = chunkOfCell(originY + BOARD_CENTER);

  // The same engine the server stages encounters with: a lure decides
  // how many of a window's rolls are there for this player
  const overworld = createOverworld(player ?? '', player == null ? null : buddy);
  const visible = overworld.checkSpawnCount(SPAWN_COUNT);
  const landmarks = new Map<number, Landmark>();
  const decorations = new Map<number, Decoration>();
  const spawns = new Map<number, { id: string; spawn: Spawn; shiny: boolean }>();
  const caches = new Map<number, ItemStack[]>();
  const phenomena = new Map<number, Phenomenon>();
  const berries = new Map<number, ItemStack>();
  const wanderers = new Map<number, Npc>();
  const coats = new Map<number, string>();
  const chunks: BoardChunk[] = [];
  const covering = new Map<string, ChunkSnapshot>();

  for (const [x, y] of viewChunks(originX, originY)) {
    const chunk = world.getChunk(x, y);
    // Where the chunk's own cell 0 sits on the board, so a chunk cell
    // is placed by two additions rather than a division apiece
    const shiftX = x * CHUNK_CELLS - originX;
    const shiftY = y * CHUNK_CELLS - originY;
    const board = (cell: number): number | null => {
      const bx = (cell % CHUNK_CELLS) + shiftX;
      const by = Math.floor(cell / CHUNK_CELLS) + shiftY;

      return bx < 0 || by < 0 || bx >= BOARD_CELLS || by >= BOARD_CELLS
        ? null
        : by * BOARD_CELLS + bx;
    };
    const carry = <T>(from: Map<number, T>, into: Map<number, T>): void => {
      for (const [cell, value] of from) {
        const seat = board(cell);

        if (seat != null) {
          into.set(seat, value);
        }
      }
    };

    // The fixtures are the chunk seed's answer rather than a window's,
    // so they are drawn whether or not the window has landed. Pressing
    // one before it has says so
    carry(chunk.getLandmarkCells(), landmarks);
    carry(chunk.getDecorationCells(), decorations);

    const record = records.get(`${x},${y}`);

    if (record == null) {
      continue;
    }

    const snapshot = new ChunkSnapshot(chunk, record.record.timestamp, offset);
    // Rolling locally reproduces the published placement — same seed,
    // same window, same count — and is what pins each spawn to a cell
    snapshot.getSpawns(PUBLISHED_SPAWNS);

    chunks.push({
      x,
      y,
      snapshot,
      board,
      world: (cell) => [
        x * CHUNK_CELLS + (cell % CHUNK_CELLS),
        y * CHUNK_CELLS + Math.floor(cell / CHUNK_CELLS),
      ],
    });
    covering.set(`${x},${y}`, snapshot);
    carry(snapshot.getItemCaches(), caches);
    carry(snapshot.getPhenomena(), phenomena);
    carry(snapshot.getBerryPatches(), berries);
    carry(snapshot.getApricornTrees(), berries);
    carry(snapshot.getWanderingNpcs(), wanderers);
    carry(snapshot.getWandererCoats(), coats);

    const cells = [...snapshot.getSpawnCells()];

    cells.forEach(([cell], index) => {
      // Roll order and publication order are the same, so the nth
      // placed cell carries the nth published spawn
      if (index >= visible || index >= record.record.spawns.length) {
        return;
      }

      const seat = board(cell);

      // On the board rather than out in the country beyond it: what
      // is drawn past the board is a view, and nothing is standing in
      // a view
      if (seat == null || reachOf(seat) > BOARD_RADIUS) {
        return;
      }

      const stored = record.record.spawns[index];

      // One that has already run from this player is not standing
      // there any more — for them. It stays in the window, since the
      // window is everybody's, and it is left out of what this player
      // is shown rather than out of what was rolled
      if (fled.has(spawnKey(x, y, record.record.timestamp, stored.individualValue))) {
        return;
      }

      // The name is derived from the window rather than stored with
      // the roll, so the two cannot disagree about which spawn it is
      const id = spawnId(snapshot.key, record.record.timestamp, index);
      const spawn: Spawn = [stored.species, stored.individualValue, stored.traitValue];

      spawns.set(seat, {
        id,
        spawn,
        // Whether it sparkles for *this* player, worked out the way the
        // server will work it out when the meeting is staged: the same
        // derivation, the same species-day boost, and the same overworld
        // engine asked what the buddy adds to the odds. A shiny standing
        // in a field is the one thing in the world worth crossing it
        // for, so it is drawn in its own coat rather than left as a
        // surprise sprung after the ball is thrown
        shiny:
          player != null &&
          deriveEncounter(snapshot, spawn, player, {
            shinyBoost: overworld.checkEncounterShiny(id),
          }).shiny,
      });
    });
  }

  const ground = readBoardGround(world, originX, originY, BOARD_MARGIN, BOARD_CELLS);
  const walls = new Set<number>();

  for (let cell = 0; cell < BOARD_CELLS * BOARD_CELLS; cell++) {
    if (ground.role(cell % BOARD_CELLS, Math.floor(cell / BOARD_CELLS)) === 'wall') {
      walls.add(cell);
    }
  }

  // The window under the player, or the one it is about to be. A
  // window's instant snaps to its interval, so a snapshot rolled off
  // the clock is the same window the server publishes; walking into a
  // chunk is not a reason to take the whole board away while its
  // record crosses the wire
  const under =
    covering.get(`${playerX},${playerY}`) ??
    new ChunkSnapshot(world.getChunk(playerX, playerY), toLocalTime(Date.now(), offset), offset);

  return {
    originX,
    originY,
    chunkX: playerX,
    chunkY: playerY,
    biome: world.getCellBiome(originX + BOARD_CENTER, originY + BOARD_CENTER),
    weather: world.getWeather(playerX, playerY, under.weatherWindow),
    lamp: overworld.checkLampReach(DARK_DAY_LAMP_CELLS),
    revealsHeld: overworld.checkRevealsHeld(),
    revealsFlight: overworld.checkRevealsFlight(),
    revealsAbility: overworld.checkRevealsAbility(),
    snapshot: under,
    chunks,
    at: (cell) => {
      const worldX = originX + (cell % BOARD_CELLS);
      const worldY = originY + Math.floor(cell / BOARD_CELLS);
      const snapshot = covering.get(`${chunkOfCell(worldX)},${chunkOfCell(worldY)}`);

      return snapshot == null
        ? null
        : { snapshot, cell: cellInChunk(worldY) * CHUNK_CELLS + cellInChunk(worldX) };
    },
    landmarks,
    ground,
    walls,
    decorations,
    spawns,
    caches,
    phenomena,
    berries,
    wanderers,
    coats,
  };
}
