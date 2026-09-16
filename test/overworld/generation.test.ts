import { describe, expect, it } from 'vitest';
import AleaRNG from '../../src/core/alea';
import { type Draws, KeyedDraws, StreamDraws, sourceOf } from '../../src/core/draws';
import { hash2, hash3, hashString, toUnit } from '../../src/core/hash';
import PerlinNoise from '../../src/core/perlin';
import SimplexNoise, { SimplexStack } from '../../src/core/simplex';
import registerGameData from '../../src/data/index';
import World, { Depth, Generation } from '../../src/overworld/world';

/** Samples spread across a wide stretch of a field */
function sample(noise: { noise: (x: number, y: number) => number }, count: number): Float64Array {
  const rng = new AleaRNG('generation-test');
  const values = new Float64Array(count);

  for (let at = 0; at < count; at++) {
    values[at] = noise.noise((rng.random() - 0.5) * 30000, (rng.random() - 0.5) * 30000);
  }
  return values;
}

/** The share of samples a threshold cuts off, as a percentage */
function share(values: Float64Array, cut: (value: number) => boolean): number {
  let hit = 0;

  for (const value of values) {
    if (cut(value)) {
      hit += 1;
    }
  }
  return (hit / values.length) * 100;
}

/** How often a world's biomes turn up, over cells spread across it */
function biomeShares(world: World): Map<number, number> {
  const rng = new AleaRNG('biome-share');
  const shares = new Map<number, number>();
  const count = 30000;

  for (let at = 0; at < count; at++) {
    const biome = world.getCellBiome(
      Math.floor((rng.random() - 0.5) * 60000),
      Math.floor((rng.random() - 0.5) * 60000),
    );

    shares.set(biome, (shares.get(biome) ?? 0) + (1 / count) * 100);
  }
  return shares;
}

describe('world hashing', () => {
  it('answers the same for the same numbers, and differently for their order', () => {
    expect(hash3(1, 2, 3)).toBe(hash3(1, 2, 3));
    expect(hash3(1, 2, 3)).not.toBe(hash3(3, 2, 1));
    expect(hash2(1, 2)).not.toBe(hash3(1, 2, 0));
    expect(hashString('overworld')).toBe(hashString('overworld'));
    expect(hashString('overworld')).not.toBe(hashString('overworle'));
  });

  it('spreads its answers evenly across the unit range', () => {
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (let at = 0; at < 100000; at++) {
      const unit = toUnit(hash2(at, 7));

      expect(unit).toBeGreaterThanOrEqual(0);
      expect(unit).toBeLessThan(1);
      buckets[Math.floor(unit * 10)] += 1;
    }
    for (const bucket of buckets) {
      expect(Math.abs(bucket - 10000)).toBeLessThan(500);
    }
  });
});

describe('world draws', () => {
  it('reads the first generation as the stream it always was', () => {
    const draws: Draws = new StreamDraws(new AleaRNG('stream'));
    const stream = new AleaRNG('stream');

    // The name is ignored: the order the rolls are asked in is the world
    expect(draws.random('count')).toBe(stream.random());
    expect(draws.random('order')).toBe(stream.random());
    expect(draws.random('count')).toBe(stream.random());
  });

  it('keys the second generation on each roll by name, so adding one moves nothing', () => {
    const alone = new KeyedDraws('keyed');
    const beside = new KeyedDraws('keyed');
    const kinds: number[] = [];
    const kindsBeside: number[] = [];

    for (let at = 0; at < 5; at++) {
      kinds.push(alone.random('kind'));
      // A roll under another name taken in between
      beside.random('extra');
      kindsBeside.push(beside.random('kind'));
    }
    expect(kindsBeside).toEqual(kinds);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect(new KeyedDraws('other').random('kind')).not.toBe(kinds[0]);
  });

  it('rolls two keys apart even when one fold of them collides', () => {
    // Two real landmark keys whose first folds collide, found by
    // hashing a million of them: a world 4,096 chunks a side has tens
    // of thousands of pairs like this one
    const one = 'overworld(-1524, -2003)landmarks';
    const other = 'overworld(-896, -1997)landmarks';

    expect(hashString(one)).toBe(hashString(other));
    expect(new KeyedDraws(one).random('count')).not.toBe(new KeyedDraws(other).random('count'));
    expect(new KeyedDraws(one).random('order')).not.toBe(new KeyedDraws(other).random('order'));
  });

  it('hands one name out as a plain source for helpers that shuffle', () => {
    const draws = new KeyedDraws('source');
    const again = new KeyedDraws('source');
    const source = sourceOf(draws, 'order');

    expect(source.random()).toBe(again.random('order'));
    expect(source.random()).toBe(again.random('order'));
  });
});

describe('second generation noise', () => {
  it('is deterministic, bounded and smooth', () => {
    const noise = new SimplexNoise(1234, 5);
    const again = new SimplexNoise(1234, 5);
    const rng = new AleaRNG('smooth');

    for (let at = 0; at < 5000; at++) {
      const x = (rng.random() - 0.5) * 5000;
      const y = (rng.random() - 0.5) * 5000;
      const value = noise.noise(x, y);

      expect(value).toBe(again.noise(x, y));
      expect(Math.abs(value)).toBeLessThanOrEqual(1);
      // No seams: a step too small to see is a change too small to see
      expect(Math.abs(value - noise.noise(x + 1e-6, y + 1e-6))).toBeLessThan(1e-3);
    }
  });

  it('does not repeat where the first generation wraps', () => {
    const perlin = new PerlinNoise('wrap');
    const simplex = new SimplexNoise(hashString('wrap'), 1);
    let perlinRepeats = 0;
    let simplexRepeats = 0;

    for (let at = 0; at < 200; at++) {
      const x = at * 1.37 + 0.25;
      const y = at * 0.61 + 0.5;

      // Perlin's table wraps every 256 lattice units, so these match
      // to within the rounding of the fraction
      if (Math.abs(perlin.noise(x, y) - perlin.noise(x + 256, y + 256)) < 1e-9) {
        perlinRepeats += 1;
      }
      if (Math.abs(simplex.noise(x, y) - simplex.noise(x + 256, y + 256)) < 1e-9) {
        simplexRepeats += 1;
      }
    }
    expect(perlinRepeats).toBe(200);
    expect(simplexRepeats).toBe(0);
  });

  it('cuts every threshold the ground uses in the proportions the first generation did', () => {
    const perlin = sample(new PerlinNoise('proportions'), 120000);

    for (const simplex of [
      sample(new SimplexNoise(hashString('proportions'), 3), 120000),
      sample(new SimplexNoise(hashString('proportions'), 3, 2), 120000),
    ]) {
      for (const cut of [
        (value: number): boolean => Math.abs(value) < 0.008,
        (value: number): boolean => Math.abs(value) < 0.012,
        (value: number): boolean => value > 0.34,
        (value: number): boolean => value > 0.5,
        (value: number): boolean => value > 0.6667,
      ]) {
        expect(Math.abs(share(simplex, cut) - share(perlin, cut))).toBeLessThan(0.75);
      }
    }
  });
});

describe('second generation noise, read together', () => {
  it('answers each field exactly as the field alone would', () => {
    const fields = [new SimplexNoise(9, 1), new SimplexNoise(9, 2), new SimplexNoise(9, 3)];
    const stack = new SimplexStack(fields);
    const out = new Float64Array(3);

    for (let at = 0; at < 5000; at++) {
      const x = at * 0.137 - 300;
      const y = at * 0.071 + 40;

      stack.noiseInto(x, y, out);
      for (const [index, field] of fields.entries()) {
        expect(out[index]).toBe(field.noise(x, y));
      }
    }
  });
});

describe('second generation world', () => {
  it('keeps its generation on both layers', () => {
    const surface = new World('layers', Depth.Surface, Generation.Second);

    expect(surface.at(Depth.Cave).generation).toBe(Generation.Second);
    expect(new World('layers').generation).toBe(Generation.First);
  });

  it('grows every biome in about the share the first generation does', () => {
    registerGameData();

    const first = biomeShares(new World('shares'));
    const second = biomeShares(new World('shares', Depth.Surface, Generation.Second));

    expect(new Set(second.keys())).toEqual(new Set(first.keys()));
    for (const [biome, part] of first) {
      expect(Math.abs((second.get(biome) ?? 0) - part)).toBeLessThan(1.5);
    }
  });
});
