import BiomeTileset from './biome-tileset';

/**
 * A biome's tileset, loaded once.
 *
 * Nothing about a loaded tileset belongs to whoever asked for it, so
 * unlike a charset there is nothing to clone: the one strip answers
 * every chunk of that biome at once. A biome with no tileset yet is
 * remembered as a failure, so walking through it costs one 404 rather
 * than one per chunk.
 *
 * Kept per **biome** rather than per file, because two biomes that
 * share a tileset take different terrains out of it and so cut
 * different strips. They still fetch the same two files, which the
 * browser has already cached by the time the second asks.
 */

const SHEETS = new Map<number, Promise<BiomeTileset | null>>();

async function fetchTileset(biome: number): Promise<BiomeTileset | null> {
  try {
    const tileset = await BiomeTileset.fetch(biome);

    await tileset.load();
    return tileset;
  } catch {
    return null;
  }
}

/**
 * The ground of a biome, or null where none has been packed yet. A
 * board with nothing to draw draws the flat colour it drew before
 * there were any tilesets
 */
export default async function loadBiomeTileset(biome: number): Promise<BiomeTileset | null> {
  const known = SHEETS.get(biome);

  if (known != null) {
    return known;
  }
  const loading = fetchTileset(biome);

  SHEETS.set(biome, loading);
  return loading;
}
