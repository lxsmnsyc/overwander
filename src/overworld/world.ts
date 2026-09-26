import AleaRNG from '../core/alea';
import LRUMap from '../core/lru-map';
import { Depth } from './depth';
import { type Draws, KeyedDraws, StreamDraws } from '../core/draws';
import { hashString } from '../core/hash';
import PerlinNoise from '../core/perlin';
import SimplexNoise, { type Noise2D, SimplexStack } from '../core/simplex';
import Biome, { getBiome } from '../data/ids/biome';
import type Weather from '../data/overworld/weather';
import { classifyWeather } from '../data/overworld/weather';
import Chunk, { CHUNK_CELLS } from './chunk';
import { SECOND_TERRACE_COUNT, TERRACE_STEPS, evenTerraceSteps } from './terrace';

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
 * How many chunks one wave of the front field spans: how much is
 * falling. Wide enough that a weather system covers a stretch of
 * country, so walking out of the rain is a walk rather than a step
 */
const FRONT_FREQUENCY = 1 / 24;

/**
 * The character field, calm or windy, and much broader than the front,
 * so a whole region leans one way while fronts cross it
 */
const CHARACTER_FREQUENCY = 1 / 64;

/**
 * The drag on the front, in chunks, and how fine it is. It gives a
 * front ragged edges and tongues rather than round blobs
 */
const FRONT_WARP_REACH = 10;
const FRONT_WARP_FREQUENCY = 1 / 40;

/** Where the drag is read in the weather fields, far from anything else read there */
const FRONT_WARP_OFFSET = 517.3;

/** Sampled at the chunk centre, for the reason the climate is */
const WEATHER_OFFSET = 0.5;

/**
 * How far the weather moves in one window, in chunks.
 *
 * The fields never change; what moves is where they are read. That is
 * what makes a front travel in a direction instead of fading in and
 * out where it stands. The two axes differ so the wind blows across
 * the world rather than along its diagonal
 */
const WEATHER_DRIFT_X = 2.8;
const WEATHER_DRIFT_Y = 1.1;

/** How far round a chunk its sky looks for the country it stands over, in chunks */
const SKY_GROUND_REACH = 1;

/**
 * Which way a world's ground is worked out from its seed.
 *
 * The live world stands on the first, and every map a player has seen
 * is its output, so it is never changed. The second draws from hashed
 * simplex fields and keyed rolls instead: its fields never repeat and
 * a roll added to it moves nothing already rolled. A world is only
 * ever read with the generation it was made on
 */
export const enum Generation {
  First = 1,
  Second = 2,
}

/** What keeps each field of a second-generation world apart */
const enum FieldSalt {
  Humidity = 1,
  Elevation = 2,
  Temperature = 3,
  Wetness = 4,
  Energy = 5,
  WarpX = 6,
  WarpY = 7,
  Lakes = 8,
  Stone = 9,
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

/**
 * How many chunks of cell climate one generation of the cache holds. A
 * cell's climate is asked for several times as its neighbours are
 * worked out, and a map view covers about this many chunks
 */
const CLIMATE_CHUNKS = 1536;
const CELLS_PER_CHUNK = CHUNK_CELLS * CHUNK_CELLS;
/** Picks a cell's place inside its chunk; kept local since this runs for every cell */
const CELL_MASK = CHUNK_CELLS - 1;

/** One chunk's remembered climate: three values a cell, and its biome plus one (0 is unread) */
interface ClimateBlock {
  key: number;
  values: Float64Array;
  biomes: Uint8Array;
}

/** How many built chunks a world keeps, comfortably more than a board and its windows touch */
const CHUNKS_KEPT = 64;

export default class World {
  readonly humidity: Noise2D;
  readonly elevation: Noise2D;
  readonly temperature: Noise2D;
  /**
   * The two channels the sky is read from: how much is falling, and
   * how hard. Drawn **after** the climate ones, since the draw order
   * is part of the world format and inserting a channel among them
   * would reshape every world that exists
   */
  readonly wetness: Noise2D;
  readonly energy: Noise2D;
  /**
   * The two the climate sample is dragged by, and then the two the
   * ground is cut from: where water gathers, and where the rock comes
   * through. Drawn after every channel that came before them, since
   * the draw order is the world format and inserting one among the
   * others would reshape every world
   */
  readonly warpX: Noise2D;
  readonly warpY: Noise2D;
  readonly lakes: Noise2D;
  readonly stone: Noise2D;
  /**
   * Chunk coordinates to the biome their climate classified as. A
   * biome is a pure function of the seed and the coordinates, so a
   * remembered one can never go stale
   */
  private readonly biomes = new Map<number, Biome>();
  /**
   * Built chunks, so a step does not work the same landmarks and scenery out
   * again. Safe because everything a chunk holds is derived and never written
   */
  private readonly chunks = new LRUMap<number, Chunk>(CHUNKS_KEPT);
  /**
   * The second generation's warp pair and climate trio, each read in
   * one lattice pass since every cell samples them at a shared point
   */
  private readonly warp: SimplexStack | null = null;
  private readonly climate: SimplexStack | null = null;
  private readonly sampled = new Float64Array(3);
  /**
   * Remembered climate by chunk, in two generations so the chunks in
   * view survive a turnover, and the last block read, since neighbouring
   * cells mostly share one
   */
  private climates = new Map<number, ClimateBlock>();
  private agedClimates = new Map<number, ClimateBlock>();
  private lastClimate: ClimateBlock | null = null;

  constructor(
    public seed: string,
    public readonly depth: Depth = Depth.Surface,
    public readonly generation: Generation = Generation.First,
    /** Where the terrace levels start, lowest first: the generation's own unless a caller passes some */
    public readonly terraceSteps: readonly number[] = generation === Generation.First
      ? TERRACE_STEPS
      : evenTerraceSteps(SECOND_TERRACE_COUNT),
  ) {
    if (generation === Generation.First) {
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
      return;
    }

    // One seed and a salt a field, so no field's order among the
    // others is part of the world any more
    const key = hashString(seed);

    const humidity = new SimplexNoise(key, FieldSalt.Humidity);
    const elevation = new SimplexNoise(key, FieldSalt.Elevation);
    const temperature = new SimplexNoise(key, FieldSalt.Temperature);
    const warpX = new SimplexNoise(key, FieldSalt.WarpX);
    const warpY = new SimplexNoise(key, FieldSalt.WarpY);

    this.humidity = humidity;
    this.elevation = elevation;
    this.temperature = temperature;
    this.wetness = new SimplexNoise(key, FieldSalt.Wetness);
    this.energy = new SimplexNoise(key, FieldSalt.Energy);
    this.warpX = warpX;
    this.warpY = warpY;
    // The two whose edges a player walks along, so they carry a finer
    // octave: a shore and a crag read as ragged up close, where a
    // climate border only ever reads from far away
    this.lakes = new SimplexNoise(key, FieldSalt.Lakes, 2);
    this.stone = new SimplexNoise(key, FieldSalt.Stone, 2);
    this.warp = new SimplexStack([warpX, warpY]);
    this.climate = new SimplexStack([humidity, temperature, elevation]);
  }

  /**
   * Whether a town stands on one level, its middle's, with its edges
   * squared off so no lone cell sticks out. The first generation's
   * towns kept the slope and the round edge they were built with
   */
  get flattensTowns(): boolean {
    return this.generation !== Generation.First;
  }

  /**
   * The rolls one decision of the world takes, keyed by `key`. The
   * first generation reads them as the stream it always did; the
   * second keys each on the name the roll is asked by
   */
  draws(key: string): Draws {
    return this.generation === Generation.First
      ? new StreamDraws(new AleaRNG(key))
      : new KeyedDraws(key);
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
    const block = this.climateBlock(x, y);
    const cell = (x & CELL_MASK) | ((y & CELL_MASK) << 4);

    if (block.biomes[cell] === 0) {
      this.readClimate(x, y, block, cell);
    }
    return block.biomes[cell] - 1;
  }

  /**
   * The three fields a cell is classified from, read at the warped
   * sample the biome uses. Asked apart from the biome by anything that
   * needs the height itself rather than the country it makes
   */
  getCellClimate(
    cellX: number,
    cellY: number,
  ): { humidity: number; temperature: number; elevation: number } {
    const x = clampToWorldCell(cellX);
    const y = clampToWorldCell(cellY);
    const block = this.climateBlock(x, y);
    const cell = (x & CELL_MASK) | ((y & CELL_MASK) << 4);

    if (block.biomes[cell] === 0) {
      this.readClimate(x, y, block, cell);
    }

    const at = cell * 3;

    return {
      humidity: block.values[at],
      temperature: block.values[at + 1],
      elevation: block.values[at + 2],
    };
  }

  /** The elevation field alone, for the terraces, which ask for it a great deal */
  getCellElevation(cellX: number, cellY: number): number {
    const x = clampToWorldCell(cellX);
    const y = clampToWorldCell(cellY);
    const block = this.climateBlock(x, y);
    const cell = (x & CELL_MASK) | ((y & CELL_MASK) << 4);

    if (block.biomes[cell] === 0) {
      this.readClimate(x, y, block, cell);
    }
    return block.values[cell * 3 + 2];
  }

  /** The block a cell's climate is remembered in */
  private climateBlock(x: number, y: number): ClimateBlock {
    // Cells are clamped inside the world, so the shifts floor correctly
    const key = ((x >> 4) - WORLD_MIN) * WORLD_SIZE + ((y >> 4) - WORLD_MIN);
    const last = this.lastClimate;

    if (last?.key === key) {
      return last;
    }

    let block = this.climates.get(key);

    if (block == null) {
      block = this.agedClimates.get(key) ?? {
        key,
        values: new Float64Array(CELLS_PER_CHUNK * 3),
        biomes: new Uint8Array(CELLS_PER_CHUNK),
      };
      if (this.climates.size >= CLIMATE_CHUNKS) {
        this.agedClimates = this.climates;
        this.climates = new Map();
      }
      this.climates.set(key, block);
    }
    this.lastClimate = block;
    return block;
  }

  /** Samples a cell's climate fields into its block */
  private readClimate(x: number, y: number, block: ClimateBlock, cell: number): void {
    const at = cell * 3;
    const drift = (x + CLIMATE_OFFSET) * WARP_FREQUENCY;
    const wander = (y + CLIMATE_OFFSET) * WARP_FREQUENCY;

    if (this.warp != null && this.climate != null) {
      const { sampled } = this;

      this.warp.noiseInto(drift, wander, sampled);
      const sampleX = (x + CLIMATE_OFFSET + sampled[0] * WARP_REACH) * CELL_CLIMATE_FREQUENCY;
      const sampleY = (y + CLIMATE_OFFSET + sampled[1] * WARP_REACH) * CELL_CLIMATE_FREQUENCY;

      this.climate.noiseInto(sampleX, sampleY, sampled);
      block.values[at] = spreadNoise(sampled[0]);
      block.values[at + 1] = spreadNoise(sampled[1]);
      block.values[at + 2] = spreadNoise(sampled[2]);
    } else {
      const sampleX =
        (x + CLIMATE_OFFSET + this.warpX.noise(drift, wander) * WARP_REACH) *
        CELL_CLIMATE_FREQUENCY;
      const sampleY =
        (y + CLIMATE_OFFSET + this.warpY.noise(drift, wander) * WARP_REACH) *
        CELL_CLIMATE_FREQUENCY;

      block.values[at] = spreadNoise(this.humidity.noise(sampleX, sampleY));
      block.values[at + 1] = spreadNoise(this.temperature.noise(sampleX, sampleY));
      block.values[at + 2] = spreadNoise(this.elevation.noise(sampleX, sampleY));
    }
    block.biomes[cell] = getBiome(block.values[at], block.values[at + 1], block.values[at + 2]) + 1;
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
    const { front, character } = this.getWeatherReading(chunkX, chunkY, window);

    return classifyWeather(this.getSkyGround(chunkX, chunkY), front, character);
  }

  /**
   * The two readings a chunk's sky is classified from, each -1 to 1:
   * how much is falling, and how calm or wild the air is
   */
  getWeatherReading(
    chunkX: number,
    chunkY: number,
    window: number,
  ): { front: number; character: number } {
    const x = clampToWorld(chunkX) + WEATHER_OFFSET - window * WEATHER_DRIFT_X;
    const y = clampToWorld(chunkY) + WEATHER_OFFSET - window * WEATHER_DRIFT_Y;
    const dragX = this.wetness.noise(
      x * FRONT_WARP_FREQUENCY + FRONT_WARP_OFFSET,
      y * FRONT_WARP_FREQUENCY + FRONT_WARP_OFFSET,
    );
    const dragY = this.energy.noise(
      x * FRONT_WARP_FREQUENCY + FRONT_WARP_OFFSET,
      y * FRONT_WARP_FREQUENCY + FRONT_WARP_OFFSET,
    );

    return {
      front: spreadNoise(
        this.wetness.noise(
          (x + dragX * FRONT_WARP_REACH) * FRONT_FREQUENCY,
          (y + dragY * FRONT_WARP_REACH) * FRONT_FREQUENCY,
        ),
      ),
      character: spreadNoise(this.energy.noise(x * CHARACTER_FREQUENCY, y * CHARACTER_FREQUENCY)),
    };
  }

  /**
   * The country a chunk's sky reads as: the commonest one round it,
   * so a lone chunk of other ground does not break a front in two.
   * A tie keeps the chunk's own, and Beyond is always itself
   */
  getSkyGround(chunkX: number, chunkY: number): Biome {
    const own = this.getChunkBiome(chunkX, chunkY);

    if (own === Biome.Beyond) {
      return own;
    }
    const counts = new Map<Biome, number>();
    let best: Biome = own;
    let most = 0;

    for (let dy = -SKY_GROUND_REACH; dy <= SKY_GROUND_REACH; dy++) {
      for (let dx = -SKY_GROUND_REACH; dx <= SKY_GROUND_REACH; dx++) {
        const biome = this.getChunkBiome(chunkX + dx, chunkY + dy);
        const count = (counts.get(biome) ?? 0) + 1;

        counts.set(biome, count);
        if (count > most || (count === most && biome === own)) {
          best = biome;
          most = count;
        }
      }
    }
    return best;
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
    const key = (x - WORLD_MIN) * WORLD_SIZE + (y - WORLD_MIN);

    return this.chunks.getOrInsertComputed(key, () => {
      // The layer is in the seed, so a cave chunk rolls its own
      // landmarks and its own spawns, and the window rows it publishes
      // can never be mistaken for the surface's
      const seed =
        this.depth === Depth.Cave ? `${this.seed}cave(${x}, ${y})` : `${this.seed}(${x}, ${y})`;

      return new Chunk(x, y, seed, this.getChunkBiome(x, y), this);
    });
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
      this.other = new World(this.seed, depth, this.generation, this.terraceSteps);
      // Pointed back, so the pair is two objects however many times
      // either of them is asked for the other
      this.other.other = this;
    }
    return this.other;
  }
}

export { DEPTHS, Depth } from './depth';
