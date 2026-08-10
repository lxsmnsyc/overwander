import AleaRNG from '../core/alea';
import PerlinNoise from '../core/perlin';
import { getBiome } from '../data/ids/biome';
import Chunk from './chunk';

/**
 * How many chunks one climate noise cell spans: lower values make
 * broader, smoother biome regions
 */
const CLIMATE_FREQUENCY = 1 / 24;

/**
 * Climate is sampled at the chunk center: integer chunk coordinates
 * would land exactly on the noise lattice, where Perlin noise is
 * always zero and every chunk would share one biome
 */
const CLIMATE_OFFSET = 0.5;

/**
 * Perlin values cluster near zero, which starves the biomes whose
 * targets sit at the edges of the -1 to 1 scale. A clamped linear
 * gain pushes mid values outward without amplifying the near-zero
 * jitter that a power curve would (its slope explodes at zero and
 * speckles region borders)
 */
const CLIMATE_SPREAD = 1.5;

function spreadNoise(value: number): number {
  return Math.max(-1, Math.min(1, value * CLIMATE_SPREAD));
}

/**
 * How wide the world is, in chunks. It is square and finite: at
 * 4096 chunks a side, with 16 cells to a chunk, that is 65,536 cells
 * across — far more ground than a population can wear out, but
 * bounded, so every coordinate the game stores has a known range
 */
export const WORLD_SIZE = 4096;

/**
 * The world is centered on the origin, so the coordinates run from
 * -2048 to 2047 on both axes
 */
export const WORLD_MIN = -WORLD_SIZE / 2;
export const WORLD_MAX = WORLD_SIZE / 2 - 1;

/**
 * Whether the chunk coordinates name a chunk inside the world
 */
export function isInWorld(x: number, y: number): boolean {
  return x >= WORLD_MIN && x <= WORLD_MAX && y >= WORLD_MIN && y <= WORLD_MAX;
}

/**
 * The nearest coordinate inside the world. The edge is a wall rather
 * than a seam: wrapping would put chunk -2048 next to chunk 2047,
 * whose climate is unrelated, and the join would show
 */
export function clampToWorld(value: number): number {
  return Math.min(WORLD_MAX, Math.max(WORLD_MIN, Math.trunc(value)));
}

/**
 * The overworld: one seed deterministically fans out into three
 * climate noise channels. The derivation draw order (humidity,
 * elevation, temperature) is part of the world format — reordering
 * it reshapes every world
 */
export default class World {
  readonly humidity: PerlinNoise;
  readonly elevation: PerlinNoise;
  readonly temperature: PerlinNoise;

  constructor(public seed: string) {
    const rng = new AleaRNG(seed);

    this.humidity = new PerlinNoise(String(rng.int32()));
    this.elevation = new PerlinNoise(String(rng.int32()));
    this.temperature = new PerlinNoise(String(rng.int32()));
  }

  /**
   * Resolve the chunk at the given chunk coordinates: its climate
   * sample classifies into a biome, and its seed extends the world
   * seed with the coordinates.
   *
   * Coordinates outside the world resolve to the nearest edge chunk
   * rather than to a chunk of their own, so a request for one — a
   * hand-written server call, say — cannot generate ground that does
   * not exist
   */
  getChunk(chunkX: number, chunkY: number): Chunk {
    const x = clampToWorld(chunkX);
    const y = clampToWorld(chunkY);

    const sampleX = (x + CLIMATE_OFFSET) * CLIMATE_FREQUENCY;
    const sampleY = (y + CLIMATE_OFFSET) * CLIMATE_FREQUENCY;

    const biome = getBiome(
      spreadNoise(this.humidity.noise(sampleX, sampleY)),
      spreadNoise(this.temperature.noise(sampleX, sampleY)),
      spreadNoise(this.elevation.noise(sampleX, sampleY)),
    );

    return new Chunk(x, y, `${this.seed}(${x}, ${y})`, biome);
  }
}
