import Biome, { isWaterBiome } from '../data/ids/biome';
import { isCaveOpen, isCaveWater } from './cave';
import { STONE_FREQUENCY, rockLevel } from './fields';
import { isSurfaceWater } from './surface';
import type World from './world';
import { Depth } from './depth';

export { isHillside } from './surface';

/**
 * What one cell of the world is made of.
 *
 * The ground used to be grown inside a chunk: a few blobs of water
 * and rock started from the chunk's own seed and kept inside its
 * placement area, which drew every chunk as a framed board with a
 * clear rim. It is read out of world-space fields instead, so a lake
 * runs off one chunk and into the next because neither of them ever
 * knew where it began.
 *
 * Everything here is a pure function of the world and a cell, so two
 * clients standing either side of a border draw the same shore.
 */

/** Rock is a cave's alone: above ground nothing is walled off. */
export type GroundRole = 'ground' | 'water' | 'wall';

/**
 * How far under the rock level the water is still shelf: the lighter
 * tiles the deep is drawn to meet, so they gather where the stone is
 * about to break the surface rather than sitting in patches of their
 * own
 */
const SHELF_REACH = 0.1;

/**
 * What one cell of the world is: the country it belongs to and what
 * a player finds underfoot there
 */
export function readGround(world: World, x: number, y: number): { biome: Biome; role: GroundRole } {
  const biome = world.getCellBiome(x, y);

  // Underground there is only stone and the space in it. The country
  // overhead still decides what lives down there, so the biome is the
  // surface's, but nothing else about the cell is
  if (world.depth === Depth.Cave) {
    if (!isCaveOpen(world, x, y)) {
      return { biome, role: 'wall' };
    }
    // Rain never reaches a cave, but water does: what the rock holds
    // stands in the tunnels the same way a lake stands in a field
    return { biome, role: isCaveWater(world, x, y) ? 'water' : 'ground' };
  }
  // Everything that is not water is walked on. The stone field still
  // says where a hillside is, for the caves and for the shelf, but it
  // walls nothing off up here: what used to be an outcrop is open country
  return { biome, role: isSurfaceWater(world, x, y, biome) ? 'water' : 'ground' };
}

/** What a player finds underfoot at one cell */
export function roleAt(world: World, x: number, y: number): GroundRole {
  return readGround(world, x, y).role;
}

/** Whether this water is a volcano's lava, which nobody walks on and nothing stands on */
export function isLavaAt(world: World, x: number, y: number): boolean {
  const { biome, role } = readGround(world, x, y);

  return role === 'water' && biome === Biome.Volcano;
}

/**
 * Whether this water is drawn with the lighter shelf tiles: the water
 * shallow enough for the shoal under it to show through.
 *
 * Purely a look. A shelf cell is swum exactly like the deep beside it
 */
export function isShelfAt(world: World, x: number, y: number): boolean {
  const { biome, role } = readGround(world, x, y);

  // The seas and the wetlands only: a lake in a field is drawn with
  // the shoreline its own edge gives it, and shelf laid over that
  // would rub the shore out
  if (role !== 'water' || !isWaterBiome(biome)) {
    return false;
  }
  // Where the stone field is close to breaking the surface, which is
  // a shoal rather than an island now that nothing is walled off
  return (
    world.stone.noise(x * STONE_FREQUENCY, y * STONE_FREQUENCY) > rockLevel(biome) - SHELF_REACH
  );
}
