import { type SpawnRoll, spawnId } from '../../../auth/snapshot-record';
import type Biome from '../../../data/ids/biome';
import type Weather from '../../../data/overworld/weather';
import type Decoration from '../../../data/overworld/decoration';
import type { ItemStack } from '../../../data/overworld/item-pool';
import type Landmark from '../../../data/overworld/landmark';
import ChunkSnapshot, { SPAWN_COUNT, type Spawn } from '../../../overworld/chunk-snapshot';
import type { Buddy } from '../../../overworld/core';
import getWorld from '../../../overworld/current';
import deriveEncounter from '../../../overworld/encounter';
import namePlace from '../../../overworld/place';
import { spawnKey } from '../../../overworld/safari';
import createOverworld from '../../../overworld/setup';
import { PUBLISHED_SPAWNS } from './metrics';

/**
 * Where a chunk is, in the words the game names it by: the country
 * and the two numbers that pick it out of the world. It is said at
 * the top of the menu and told to a screen reader as the name of the
 * board, which is the same fact twice and so is written once
 */
export function naming(chunk: ChunkView): string {
  return namePlace(chunk.x, chunk.y);
}

export interface ChunkView {
  x: number;
  y: number;
  biome: Biome;
  /**
   * What the sky over this chunk is doing this hour. Derived here
   * beside the biome, since both are facts about the place rather than
   * about the window's spawns
   */
  weather: Weather;
  snapshot: ChunkSnapshot;
  landmarks: Map<number, Landmark>;
  /**
   * The chunk's terrain spots, for the ground drawing: pools on
   * land, banks in a wetland
   */
  spots: Set<number>;
  /**
   * An open-sea chunk's shallow patches, for the ground drawing
   */
  shallows: Set<number>;
  /**
   * The spot cells that are solid rock, which a walk goes round
   */
  rocks: Set<number>;
  /**
   * The chunk's scenery by cell. Nothing is done with it — it is what
   * makes a taiga look like a taiga rather than a grassland in another
   * colour
   */
  decorations: Map<number, Decoration>;
  /**
   * The window's spawns by cell, each with the id it was published
   * under, so an interaction can derive the same encounter every
   * observer sees
   */
  spawns: Map<number, { id: string; spawn: Spawn; shiny: boolean }>;
  caches: Map<number, ItemStack[]>;
}

/**
 * Build the chunk's view from the window and the spawns the store
 * currently holds. Everything else — landmarks, caches, grottos,
 * raids — re-derives from the chunk seed and the window, so the
 * subscription only has to carry those two
 */
export function buildChunkView(
  x: number,
  y: number,
  timestamp: number,
  offset: number,
  published: SpawnRoll[],
  player: string | null,
  buddy: Buddy | null,
  fled: Set<string>,
): ChunkView {
  const world = getWorld();
  const chunk = world.getChunk(x, y);
  const snapshot = new ChunkSnapshot(chunk, timestamp, offset);
  // Rolling locally reproduces the published placement — same seed,
  // same window, same count — and is what pins each spawn to a cell
  snapshot.getSpawns(PUBLISHED_SPAWNS);

  const spawns = new Map<number, { id: string; spawn: Spawn; shiny: boolean }>();
  const cells = [...snapshot.getSpawnCells()];
  // The same engine the server stages encounters with: a lure decides
  // how many of the window's rolls are there for this player
  const overworld = createOverworld(player ?? '', player == null ? null : buddy);
  const visible = overworld.checkSpawnCount(SPAWN_COUNT);

  cells.forEach(([cell], index) => {
    // Roll order and publication order are the same, so the nth
    // placed cell carries the nth published spawn
    if (index >= visible || index >= published.length) {
      return;
    }

    const stored = published[index];

    // One that has already run from this player is not standing
    // there any more — for them. It stays in the window, since the
    // window is everybody's, and it is left out of what this player
    // is shown rather than out of what was rolled
    if (fled.has(spawnKey(x, y, timestamp, stored.individualValue))) {
      return;
    }

    // The name is derived from the window rather than stored with
    // the roll, so the two cannot disagree about which spawn it is
    const id = spawnId(snapshot.key, timestamp, index);
    const spawn: Spawn = [stored.species, stored.individualValue, stored.traitValue];

    spawns.set(cell, {
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

  return {
    x,
    y,
    biome: chunk.biome,
    weather: world.getWeather(x, y, snapshot.weatherWindow),
    snapshot,
    landmarks: chunk.getLandmarkCells(),
    spots: chunk.getSpotCells(),
    shallows: chunk.getShallowCells(),
    rocks: chunk.getRockCells(),
    decorations: chunk.getDecorationCells(),
    spawns,
    caches: snapshot.getItemCaches(),
  };
}
