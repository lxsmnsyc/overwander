import { beforeAll, describe, expect, it } from 'vitest';
import { asCaughtPokemon } from '../src/model/caught-record';
import { asCatchSnapshot, createCatchSnapshot, previewSnapshot } from '../src/model/catch-snapshot';
import registerGameData from '../src/data';
import { Stats, packIVs } from '../src/data/constants/stats';
import { Types } from '../src/data/constants/types';
import { Items } from '../src/data/ids/items';
import { Species } from '../src/data/ids/species';
import { getItemData } from '../src/data/items';
import {
  TERA_SHARDS,
  getTeraShard,
  listTypeShards,
  takesTeraShard,
} from '../src/data/items/tera-shards';
import { getItemBand } from '../src/data/overworld/item-pool';
import {
  TERA_TYPES,
  WILD_TERA_CHANCE,
  defaultTeraType,
  rollTeraType,
  teraTypeOf,
} from '../src/data/species/tera-type';

beforeAll(() => {
  registerGameData();
});

/** A random source that hands back these values in turn */
function draws(...values: number[]): () => number {
  let at = 0;

  return () => values[at++ % values.length];
}

const EVEN = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<Stats, number>;

/** A stored record with just enough to be read back */
function stored(fields: Record<string, unknown>): Record<string, unknown> {
  return {
    owner: 'trainer',
    species: Species.Bulbasaur,
    level: 20,
    ivs: packIVs({ ...EVEN, [Stats.HP]: 31 }),
    effortValues: EVEN,
    ...fields,
  };
}

describe('the Tera type roll', () => {
  it('is one of its own types, unless the rare roll comes up', () => {
    // Bulbasaur is Grass and Poison: the first draw misses the rare
    // chance, the second picks between the two
    expect(rollTeraType(Species.Bulbasaur, draws(0.5, 0))).toBe(Types.Grass);
    expect(rollTeraType(Species.Bulbasaur, draws(0.5, 0.99))).toBe(Types.Poison);
    // Under the chance it picks from all 18
    expect(rollTeraType(Species.Bulbasaur, draws(WILD_TERA_CHANCE / 2, 0))).toBe(TERA_TYPES[0]);
    expect(rollTeraType(Species.Bulbasaur, draws(0, 0.999))).toBe(Types.Fairy);
  });

  it('never rolls Stellar, and keeps to its own types about 19 times in 20', () => {
    let seed = 7;
    const random = (): number => {
      seed = (seed * 16_807) % 2_147_483_647;
      return seed / 2_147_483_647;
    };
    let own = 0;
    const rolls = 20_000;

    for (let at = 0; at < rolls; at += 1) {
      const type = rollTeraType(Species.Charmander, random);

      expect(type).not.toBe(Types.Stellar);
      expect(TERA_TYPES).toContain(type);
      if (type === Types.Fire) {
        own += 1;
      }
    }
    // 95% own, plus the wild roll landing on Fire 1 time in 18
    const expected = 1 - WILD_TERA_CHANCE + WILD_TERA_CHANCE / 18;

    expect(own / rolls).toBeGreaterThan(expected - 0.01);
    expect(own / rolls).toBeLessThan(expected + 0.01);
  });

  it('reads a catch with none stored as its species first type', () => {
    expect(defaultTeraType(Species.Bulbasaur)).toBe(Types.Grass);
    expect(teraTypeOf({ species: Species.Bulbasaur, teraType: null })).toBe(Types.Grass);
    expect(teraTypeOf({ species: Species.Bulbasaur, teraType: Types.Dragon })).toBe(Types.Dragon);
  });
});

describe('the Tera type on the record', () => {
  it('round trips through the record and the snapshot', () => {
    const caught = asCaughtPokemon(stored({ teraType: Types.Water }));

    expect(caught.teraType).toBe(Types.Water);

    const snapshot = asCatchSnapshot(
      JSON.parse(JSON.stringify(createCatchSnapshot('tera', caught))),
    );

    expect(snapshot.teraType).toBe(Types.Water);
    expect(previewSnapshot(snapshot).teraType).toBe(Types.Water);
  });

  it('leaves it out where none is stored or what is stored is not a type', () => {
    const old = asCaughtPokemon(stored({}));

    expect(old.teraType).toBeNull();
    expect(createCatchSnapshot('old', old).teraType).toBeUndefined();
    expect(asCaughtPokemon(stored({ teraType: Types.Stellar })).teraType).toBeNull();
    expect(asCaughtPokemon(stored({ teraType: 99 })).teraType).toBeNull();
    expect(
      asCatchSnapshot({ ...createCatchSnapshot('odd', old), teraType: 'Fire' }).teraType,
    ).toBeUndefined();
  });
});

describe('Tera Shards', () => {
  it('has a shard for every type and Stellar, each with a line', () => {
    expect(TERA_SHARDS.size).toBe(19);
    for (const type of TERA_TYPES) {
      const shard = getTeraShard(type);

      expect(shard).not.toBeNull();
      expect(getItemData(shard ?? Items.NormalTeraShard).description).toMatch(/\.$/);
    }
    expect(getItemData(Items.StellarTeraShard).description).toMatch(/\.$/);
    expect(listTypeShards()).not.toContain(Items.StellarTeraShard);
  });

  it('changes only to a type it does not already have, and never Stellar', () => {
    const bulbasaur = { species: Species.Bulbasaur, teraType: null };

    expect(takesTeraShard(bulbasaur, Items.GrassTeraShard)).toBe(false);
    expect(takesTeraShard(bulbasaur, Items.PoisonTeraShard)).toBe(true);
    expect(takesTeraShard({ ...bulbasaur, teraType: Types.Fire }, Items.FireTeraShard)).toBe(false);
    expect(takesTeraShard(bulbasaur, Items.StellarTeraShard)).toBe(false);
    expect(takesTeraShard(bulbasaur, Items.MaxMushrooms)).toBe(false);
  });

  it('is found in the ground, every type but Stellar', () => {
    for (const shard of listTypeShards()) {
      expect(getItemBand(shard)).not.toBeNull();
    }
    expect(getItemBand(Items.StellarTeraShard)).toBeNull();
  });
});
