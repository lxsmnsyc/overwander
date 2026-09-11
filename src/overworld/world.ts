import AleaRNG from '../core/alea';
import { Depth } from './depth';
import PerlinNoise from '../core/perlin';
import type Biome from '../data/ids/biome';
import { getBiome } from '../data/ids/biome';
import type Weather from '../data/overworld/weather';
import { classifyWeather } from '../data/overworld/weather';
import Chunk, { CHUNK_CELLS } from './chunk';

/**
 * How many chunks one climate noise cell spans: lower values make
 * broader, smoother biome regions
 */
const CLIMATE_FREQUENCY = 1 / 24;

/**
 * The same field read a cell at a time. Climate belongs to the ground
 * rather than to the chunk, so a country's edge falls where the field
 * crosses rather than on a chunk boundary, and one chunk can hold two
 * of them
 */
const CELL_CLIMATE_FREQUENCY = CLIMATE_FREQUENCY / CHUNK_CELLS;

/**
 * Climate is sampled at the cell center: integer coordinates would
 * land exactly on the noise lattice, where Perlin noise is always
 * zero
 */
const CLIMATE_OFFSET = 0.5;

/**
 * How far the climate sample is dragged sideways before it is read,
 * in cells, and how quickly that drag turns.
 *
 * Read straight, a climate field draws countries as smooth ovals and
 * their borders as arcs. The drag is two more fields pulling the
 * sample point about, which is what puts bays, tongues and inlets in
 * a border without touching the climate itself. It is a good deal
 * finer than the climate is, or it would only move the countries
 * rather than fray them
 */
const WARP_REACH = 20;
const WARP_FREQUENCY = 1 / 96;

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
 * How many chunks one weather cell spans.
 *
 * Tighter than a climate cell on purpose: a country keeps its ground
 * for good and its sky for an hour, so a front should cross a country
 * rather than cover it. At eight chunks a cell, walking out of the
 * rain is a walk rather than a step
 */
const WEATHER_FREQUENCY = 1 / 8;

/** Sampled at the chunk centre, for the reason the climate is */
const WEATHER_OFFSET = 0.5;

/**
 * How far the field slides in one window, in weather cells.
 *
 * The field itself never changes; what moves is where it is read. That
 * is what makes a front travel in a direction instead of fading in and
 * out where it stands. The two axes differ so the wind blows across
 * the world rather than along its diagonal
 */
const WEATHER_DRIFT_X = 0.35;
const WEATHER_DRIFT_Y = 0.14;

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

/** The lowest and highest cell the world has, on either axis */
export const WORLD_CELL_MIN = WORLD_MIN * CHUNK_CELLS;
export const WORLD_CELL_MAX = (WORLD_MAX + 1) * CHUNK_CELLS - 1;

/** The nearest cell inside the world, for the reason `clampToWorld` is */
export function clampToWorldCell(value: number): number {
  return Math.min(WORLD_CELL_MAX, Math.max(WORLD_CELL_MIN, Math.trunc(value)));
}

/**
 * The overworld: one seed deterministically fans out into three
 * climate noise channels. The derivation draw order (humidity,
 * elevation, temperature) is part of the world format — reordering
 * it reshapes every world
 */
/**
 * How many sampled chunks are remembered before the lot is dropped. A
 * map view is sixteen thousand of them, so this is a good many views'
 * worth
 */
const BIOME_CACHE_LIMIT = 1 << 20;

export default class World {
  readonly humidity: PerlinNoise;
  readonly elevation: PerlinNoise;
  readonly temperature: PerlinNoise;
  /**
   * The two channels the sky is read from: how much is falling, and
   * how hard. Drawn **after** the climate ones, since the draw order
   * is part of the world format and inserting a channel among them
   * would reshape every world that exists
   */
  readonly wetness: PerlinNoise;
  readonly energy: PerlinNoise;
  /**
   * The two the climate sample is dragged by, and then the two the
   * ground is cut from: where water gathers, and where the rock comes
   * through. Drawn after every channel that came before them, since
   * the draw order is the world format and inserting one among the
   * others would reshape every world
   */
  readonly warpX: PerlinNoise;
  readonly warpY: PerlinNoise;
  readonly lakes: PerlinNoise;
  readonly stone: PerlinNoise;
  /**
   * Chunk coordinates to the biome their climate classified as. A
   * biome is a pure function of the seed and the coordinates, so a
   * remembered one can never go stale
   */
  private readonly biomes = new Map<number, Biome>();

  constructor(
    public seed: string,
    public readonly depth: Depth = Depth.Surface,
  ) {
    const rng = new AleaRNG(seed);

    this.humidity = new PerlinNoise(String(rng.int32()));
    this.elevation = new PerlinNoise(String(rng.int32()));
    this.temperature = new PerlinNoise(String(rng.int32()));
    this.wetness = new PerlinNoise(String(rng.int32()));
    this.energy = new PerlinNoise(String(rng.int32()));
    this.warpX = new PerlinNoise(String(rng.int32()));
    this.warpY = new PerlinNoise(String(rng.int32()));
    this.lakes = new PerlinNoise(String(rng.int32()));
    this.stone = new PerlinNoise(String(rng.int32()));
  }

  /**
   * The biome one cell of ground belongs to.
   *
   * This is where a biome is decided now: a chunk has no climate of
   * its own, only the ground inside it, so a border runs through a
   * chunk wherever the field says it does
   */
  getCellBiome(cellX: number, cellY: number): Biome {
    const x = clampToWorldCell(cellX);
    const y = clampToWorldCell(cellY);
    const drift = (x + CLIMATE_OFFSET) * WARP_FREQUENCY;
    const wander = (y + CLIMATE_OFFSET) * WARP_FREQUENCY;
    const sampleX =
      (x + CLIMATE_OFFSET + this.warpX.noise(drift, wander) * WARP_REACH) * CELL_CLIMATE_FREQUENCY;
    const sampleY =
      (y + CLIMATE_OFFSET + this.warpY.noise(drift, wander) * WARP_REACH) * CELL_CLIMATE_FREQUENCY;

    return getBiome(
      spreadNoise(this.humidity.noise(sampleX, sampleY)),
      spreadNoise(this.temperature.noise(sampleX, sampleY)),
      spreadNoise(this.elevation.noise(sampleX, sampleY)),
    );
  }

  /**
   * What the sky over a chunk is doing in a window.
   *
   * Two noise samples read against the ground underneath, so
   * neighbouring chunks share a front and the same front is a
   * thunderstorm over forest and a sandstorm over the desert it
   * crosses next. Pure, like everything else about a chunk: nobody has
   * to be told what the weather is
   */
  getWeather(chunkX: number, chunkY: number, window: number): Weather {
    const x = clampToWorld(chunkX);
    const y = clampToWorld(chunkY);
    const sampleX = (x + WEATHER_OFFSET) * WEATHER_FREQUENCY + window * WEATHER_DRIFT_X;
    const sampleY = (y + WEATHER_OFFSET) * WEATHER_FREQUENCY + window * WEATHER_DRIFT_Y;

    return classifyWeather(
      this.getChunkBiome(x, y),
      spreadNoise(this.wetness.noise(sampleX, sampleY)),
      spreadNoise(this.energy.noise(sampleX, sampleY)),
    );
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
  /**
   * The biome a chunk counts as as a whole: the one its middle cell
   * belongs to.
   *
   * The ground inside it may be two or three countries, and what is
   * drawn reads them a cell at a time. This is for everything that
   * needs one answer for the chunk: what the map paints, what the
   * place is called, what the sky is classified against and which
   * pool the window's spawns are drawn from.
   *
   * The map draws tens of thousands of these at once and wants nothing
   * else about any of them; going through `getChunk` would allocate a
   * chunk and a seed string per pixel of it.
   *
   * The answers are kept. Three noise samples is not much on its own,
   * but a map view is sixteen thousand chunks and panning it by one
   * asks for all of them again — of which all but a row are the ones
   * it just had. The cache is dropped whole when it grows past
   * `BIOME_CACHE_LIMIT` rather than evicting cleverly: a player who
   * has looked at a million chunks has moved on from the first of them
   */
  getChunkBiome(chunkX: number, chunkY: number): Biome {
    const x = clampToWorld(chunkX);
    const y = clampToWorld(chunkY);
    const key = (x - WORLD_MIN) * WORLD_SIZE + (y - WORLD_MIN);
    const known = this.biomes.get(key);

    if (known != null) {
      return known;
    }

    const biome = this.getCellBiome(
      x * CHUNK_CELLS + CHUNK_CELLS / 2,
      y * CHUNK_CELLS + CHUNK_CELLS / 2,
    );

    if (this.biomes.size >= BIOME_CACHE_LIMIT) {
      this.biomes.clear();
    }
    this.biomes.set(key, biome);
    return biome;
  }

  getChunk(chunkX: number, chunkY: number): Chunk {
    const x = clampToWorld(chunkX);
    const y = clampToWorld(chunkY);
    // The layer is in the seed, so a cave chunk rolls its own
    // landmarks and its own spawns, and the window rows it publishes
    // can never be mistaken for the surface's
    const seed =
      this.depth === Depth.Cave ? `${this.seed}cave(${x}, ${y})` : `${this.seed}(${x}, ${y})`;

    return new Chunk(x, y, seed, this.getChunkBiome(x, y), this);
  }

  private other: World | null = null;

  /**
   * The same world at another depth. Built from the same seed, so
   * every field comes out identical and the two layers are readings
   * of one place rather than two worlds that happen to touch
   */
  at(depth: Depth): World {
    if (depth === this.depth) {
      return this;
    }
    if (this.other == null) {
      this.other = new World(this.seed, depth);
      // Pointed back, so the pair is two objects however many times
      // either of them is asked for the other
      this.other.other = this;
    }
    return this.other;
  }
}

export { DEPTHS, Depth } from './depth';
