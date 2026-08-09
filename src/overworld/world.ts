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
   * seed with the coordinates
   */
  getChunk(x: number, y: number): Chunk {
    const sampleX = (x + CLIMATE_OFFSET) * CLIMATE_FREQUENCY;
    const sampleY = (y + CLIMATE_OFFSET) * CLIMATE_FREQUENCY;

    const biome = getBiome(
      spreadNoise(this.humidity.noise(sampleX, sampleY)),
      spreadNoise(this.temperature.noise(sampleX, sampleY)),
      spreadNoise(this.elevation.noise(sampleX, sampleY)),
    );

    return new Chunk(`${this.seed}(${x}, ${y})`, biome);
  }
}
