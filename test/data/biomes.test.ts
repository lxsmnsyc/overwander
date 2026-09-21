import { describe, expect, it } from 'vitest';
import registerBiomeSpawns, {
  BIOME_NAMES,
  SPAWN_BAND_KEYS,
  SpawnRarity,
  TIMES_OF_DAY,
  getBiomeRoster,
  getSpawnPool,
  getSpawnRarity,
  getTownPool,
  isPrizedSpecies,
  listTownHabitats,
  pickSpawn,
  spawnBand,
} from '../../src/data/biome';
import {
  HONEY_TREE_POOL,
  HONEY_TREE_SPECIES,
  rollHoneyTree,
} from '../../src/data/overworld/honey-tree';
import registerAbilities from '../../src/data/abilities';
import Biome, {
  AnyTimeOfDay,
  TimeOfDay,
  WILD_BIOMES,
  getBiome,
  isOpenSea,
  isSettledBiome,
  isWaterBiome,
} from '../../src/data/ids/biome';
import type { SettledBiome } from '../../src/data/ids/biome';
import { CAVE_DARK_CELLS, CAVE_LAMP_CELLS } from '../../src/data/overworld/cave';
import { ILLUMINATE_LAMP_CELLS } from '../../src/overworld/abilities/gen-1';
import nameTown, {
  COUNTY_REGIONS,
  HEADS_PER_BIOME,
  NAMES_PER_BIOME,
  TOWN_HEADS,
} from '../../src/data/overworld/town-names';
import { WORLD_MAX, WORLD_MIN } from '../../src/overworld/world';
import { CHUNK_CELLS } from '../../src/overworld/grid';
import { TOWN_REGION } from '../../src/overworld/town';
import { Items, getMachineItem } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import registerItems, { getItemData } from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import AleaRNG from '../../src/core/alea';
import type { ItemPoolEntry } from '../../src/data/overworld/item-pool';
import { getItemBiomes, getItemPool } from '../../src/data/overworld/biome-items';
import {
  ITEM_POOL,
  MAX_KINDS,
  MAX_STACK,
  getItemBand,
  isPreciousItem,
  pickItem,
  pickItems,
} from '../../src/data/overworld/item-pool';
import { getRegisteredSpecies, getSpeciesData, registerSpecies } from '../../src/data/species';
import { everyPool } from './helpers';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('biome data', () => {
  it('classifies climate samples into the nearest biome', () => {
    // Exact target points
    expect(getBiome(-0.9, 0.9, 0.2)).toBe(Biome.Desert);
    expect(getBiome(1, -0.2, -0.8)).toBe(Biome.DeepOcean);
    expect(getBiome(0.9, 0.9, 0.2)).toBe(Biome.TropicalRainforest);
    expect(getBiome(0.2, -0.9, 0.9)).toBe(Biome.Glacier);

    // Off-target samples resolve to the nearest neighbor
    expect(getBiome(-1, 1, 0.1)).toBe(Biome.Desert);
    expect(getBiome(0, -0.7, 0.35)).toBe(Biome.Tundra);
  });

  it('lets elevation decide before anything else does', () => {
    // Below sea level is water whatever the other two axes say: a dry,
    // freezing trench is still a trench
    for (let humidity = -1; humidity <= 1; humidity += 0.25) {
      for (let temperature = -1; temperature <= 1; temperature += 0.25) {
        expect(
          isWaterBiome(getBiome(humidity, temperature, -0.6)),
          `h=${humidity} t=${temperature} is not water`,
        ).toBe(true);
      }
    }
  });

  it('puts the hot and the high together on a volcano', () => {
    expect(getBiome(-0.4, 0.9, 0.8)).toBe(Biome.Volcano);
    // Cold peaks are somebody else's
    expect(getBiome(-0.4, -0.6, 0.85)).toBe(Biome.AlpineTundra);
    // And so is hot ground
    expect(getBiome(-0.9, 0.9, 0.2)).toBe(Biome.Desert);
  });

  it('assigns habitat biomes to species', () => {
    expect(getSpeciesData(Species.Sandshrew).biomes).toEqual([Biome.Desert, Biome.Badlands]);
    expect(getSpeciesData(Species.Lapras).biomes).toEqual([
      Biome.Ocean,
      Biome.DeepOcean,
      Biome.PolarOcean,
    ]);
    expect(getSpeciesData(Species.Articuno).biomes).toContain(Biome.Glacier);

    // Evolution can move a species to new waters
    expect(getSpeciesData(Species.Magikarp).biomes).toContain(Biome.Swamp);
    expect(getSpeciesData(Species.Gyarados).biomes).not.toContain(Biome.Swamp);

    // The gap-filler biomes all have residents
    expect(getSpeciesData(Species.Eevee).biomes).toContain(Biome.Woodland);
    expect(getSpeciesData(Species.Tauros).biomes).toContain(Biome.Steppe);
    expect(getSpeciesData(Species.Paras).biomes).toContain(Biome.MontaneForest);
    expect(getSpeciesData(Species.Seel).biomes).toContain(Biome.PolarOcean);
  });

  it('assigns day-cycle preferences to species', () => {
    // Cave dwellers wake at dusk and avoid daylight entirely
    expect(getSpeciesData(Species.Zubat).activeTimes).toBe(TimeOfDay.Evening | TimeOfDay.Night);
    expect(getSpeciesData(Species.Zubat).activeTimes & TimeOfDay.Day).toBe(0);

    // Crepuscular species span evening into night
    expect(getSpeciesData(Species.Oddish).activeTimes).toBe(TimeOfDay.Evening | TimeOfDay.Night);

    // Diurnal fliers wake with the sun
    expect(getSpeciesData(Species.Pidgey).activeTimes).toBe(TimeOfDay.Morning | TimeOfDay.Day);

    // Time-agnostic species cover the full cycle
    expect(getSpeciesData(Species.Magikarp).activeTimes).toBe(AnyTimeOfDay);
  });

  it('classifies spawn rarity tiers', () => {
    // The bottom of a three-stage line, and the bottom of a two-stage
    // one, which is a shorter walk to a finished pokemon
    expect(getSpawnRarity(Species.Pidgey)).toBe(SpawnRarity.Base);
    expect(getSpawnRarity(Species.Bulbasaur)).toBe(SpawnRarity.Base);
    expect(getSpawnRarity(Species.Omanyte)).toBe(SpawnRarity.Uncommon);
    expect(getSpawnRarity(Species.Ekans)).toBe(SpawnRarity.Uncommon);

    // The middle of a three-stage line
    expect(getSpawnRarity(Species.Ivysaur)).toBe(SpawnRarity.Rare);
    expect(getSpawnRarity(Species.Haunter)).toBe(SpawnRarity.Rare);

    // The end of a two-stage line
    expect(getSpawnRarity(Species.Omastar)).toBe(SpawnRarity.Scarce);
    expect(getSpawnRarity(Species.Arbok)).toBe(SpawnRarity.Scarce);

    // The end of a three-stage line, and a species that never evolves
    expect(getSpawnRarity(Species.Pidgeot)).toBe(SpawnRarity.Elusive);
    expect(getSpawnRarity(Species.Venusaur)).toBe(SpawnRarity.Elusive);
    expect(getSpawnRarity(Species.Ditto)).toBe(SpawnRarity.Elusive);

    // A baby leaves the rest of its line standing one stage shorter:
    // Pikachu is the bottom of a two-stage line rather than the
    // middle of a three-stage one, and a Jynx is grown on its own
    expect(getSpawnRarity(Species.Pikachu)).toBe(SpawnRarity.Uncommon);
    expect(getSpawnRarity(Species.Raichu)).toBe(SpawnRarity.Scarce);
    expect(getSpawnRarity(Species.Jynx)).toBe(SpawnRarity.Elusive);

    // The two one-per-world classes, which are told apart: a
    // legendary is staged by the world at a lair, a mythical only
    // ever by the relic that calls it
    expect(getSpawnRarity(Species.Articuno)).toBe(SpawnRarity.Special);
    expect(getSpawnRarity(Species.Mew)).toBe(SpawnRarity.Mythical);

    // The prized band is between the two, and the babies are what is
    // in it. Nothing about the shape of a line reads as one, which is
    // why they are listed rather than derived: a baby evolves like
    // any other first stage and would otherwise read as Base
    expect(SpawnRarity.Prized).toBeGreaterThan(SpawnRarity.Rare);
    expect(SpawnRarity.Prized).toBeLessThan(SpawnRarity.Special);

    for (const baby of [Species.Pichu, Species.Togepi, Species.Tyrogue, Species.Magby]) {
      expect(isPrizedSpecies(baby)).toBe(true);
      expect(getSpawnRarity(baby)).toBe(SpawnRarity.Prized);
    }

    // The stage above a baby is a middle evolution like any other
    expect(isPrizedSpecies(Species.Pikachu)).toBe(false);
    expect(getSpawnRarity(Species.Pikachu)).toBe(SpawnRarity.Uncommon);

    // Gen 1 puts nothing in the band: every baby is a later gen's
    for (const species of getRegisteredSpecies()) {
      if (getSpeciesData(species).dexNumber <= 151) {
        expect(isPrizedSpecies(species)).toBe(false);
      }
    }
  });

  it('rolls a spawn through the rarity bands, prized band included', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;
    const groups = {
      base: [{ species: Species.Pidgey, weight: 10 }],
      uncommon: [{ species: Species.Ivysaur, weight: 10 }],
      rare: [{ species: Species.Ditto, weight: 10 }],
      prized: [{ species: Species.Eevee, weight: 10 }],
      special: [{ species: Species.Mew, weight: 10 }],
    };

    // Richest first, each slice as wide as its own odds: special owns
    // the opening 1/4096, prized the 1/512 after it, then the bands a
    // line's stages are dealt into, and whatever is left falls to base
    expect(pickSpawn(groups, rolls([0]))).toBe(Species.Mew);
    expect(pickSpawn(groups, rolls([1 / 1024, 0]))).toBe(Species.Eevee);
    expect(pickSpawn(groups, rolls([1 / 128, 0]))).toBe(Species.Ditto);
    expect(pickSpawn(groups, rolls([0.3, 0]))).toBe(Species.Ivysaur);
    expect(pickSpawn(groups, rolls([0.9, 0]))).toBe(Species.Pidgey);

    // A pool that leaves the band out is every pool in the game
    // today, and its rares are rolled exactly as they were: the
    // prized slice falls to the band below rather than to base
    const { prized, ...without } = groups;

    expect(prized).toHaveLength(1);
    expect(pickSpawn(without, rolls([1 / 1024, 0]))).toBe(Species.Ditto);
    expect(pickSpawn(without, rolls([1 / 128, 0]))).toBe(Species.Ditto);
    expect(pickSpawn(without, rolls([0.9, 0]))).toBe(Species.Pidgey);
  });

  it('groups biome spawn pools by time of day and rarity', () => {
    const morning = getSpawnPool(Biome.Grassland, TimeOfDay.Morning);
    expect(morning.base).toContainEqual({ species: Species.Pidgey, weight: 30 });

    // Sections agree with the rarity classification
    expect(morning.rare.every((entry) => getSpawnRarity(entry.species) === SpawnRarity.Rare)).toBe(
      true,
    );

    // Diurnal fliers sleep through the night; prowlers come out
    const night = getSpawnPool(Biome.Grassland, TimeOfDay.Night);
    expect(night.base.some((entry) => entry.species === Species.Pidgey)).toBe(false);
    expect(night.uncommon.some((entry) => entry.species === Species.Meowth)).toBe(true);

    // Legendaries sit in their own section
    const peak = getSpawnPool(Biome.Mountain, TimeOfDay.Night);
    expect(peak.special.some((entry) => entry.species === Species.Zapdos)).toBe(true);
  });

  it('files every spawn in the band its line puts it in', () => {
    // A species that gains an evolution moves down a band, and the
    // pools have to move with it or the dex describes a Steelix's
    // Onix as the end of its line
    for (const [biome, time, surface] of everyPool()) {
      const groups = getSpawnPool(biome, time, false, surface);

      for (const [band, rarity] of [
        ['base', SpawnRarity.Base],
        ['uncommon', SpawnRarity.Uncommon],
        ['rare', SpawnRarity.Rare],
        ['prized', SpawnRarity.Prized],
        ['special', SpawnRarity.Special],
      ] as const) {
        for (const entry of groups[band] ?? []) {
          expect(getSpawnRarity(entry.species), getSpeciesData(entry.species).name).toBe(rarity);
        }
      }
    }
  });

  it('files the town pool by the same rules as the country', () => {
    // One pool every town's streets draw from: each entry sits in the
    // band its line puts it in, at an hour it is about
    const bands = [
      ['base', SpawnRarity.Base],
      ['uncommon', SpawnRarity.Uncommon],
      ['rare', SpawnRarity.Rare],
      ['scarce', SpawnRarity.Scarce],
      ['elusive', SpawnRarity.Elusive],
      ['prized', SpawnRarity.Prized],
      ['special', SpawnRarity.Special],
    ] as const;
    let held = 0;

    for (const time of TIMES_OF_DAY) {
      for (const [band, rarity] of bands) {
        for (const entry of getTownPool(time)[band] ?? []) {
          const { activeTimes, name } = getSpeciesData(entry.species);

          held += 1;
          expect(getSpawnRarity(entry.species), name).toBe(rarity);
          expect(activeTimes & time, name).not.toBe(0);
        }
      }
    }
    expect(held).toBeGreaterThan(0);

    // Porygon is met on the streets at every hour, and what it evolves
    // into is made rather than met
    expect(listTownHabitats(Species.Porygon)).toHaveLength(TIMES_OF_DAY.length);
    expect(listTownHabitats(Species.Porygon2)).toEqual([]);
  });

  it('knows which finds are worth stopping a player over', () => {
    // The band an item is hidden in is what decides whether spending
    // it is asked about twice
    expect(getItemBand(Items.MasterBall)).toBe('special');
    expect(getItemBand(Items.BottleCap)).toBe('prized');
    expect(getItemBand(Items.FireStone)).toBe('rare');
    expect(getItemBand(Items.HeartScale)).toBe('uncommon');
    expect(getItemBand(Items.Potion)).toBe('base');
    // Nothing hides a machine or a berry off a bush
    expect(getItemBand(getMachineItem(Moves.Tackle))).toBeNull();
    expect(getItemBand(Items.OranBerry)).toBeNull();

    // What changes a pokemon for good, or cannot be come by again
    for (const item of [
      Items.GoldenBottleCap,
      Items.MasterBall,
      Items.BottleCap,
      Items.PurifyingGem,
      Items.MaxRevive,
    ]) {
      expect(isPreciousItem(item)).toBe(true);
    }
    // Scarcity alone is not the test: a Full Restore is a rare dig and
    // still only a fight's worth of healing, so it is not asked about
    for (const item of [
      Items.FullRestore,
      Items.MaxPotion,
      Items.Revive,
      Items.Potion,
      Items.Antidote,
      Items.HealthWing,
      Items.PomegBerry,
    ]) {
      expect(isPreciousItem(item)).toBe(false);
    }

    // Every band listing agrees with the pool it was built from
    for (const band of ['base', 'uncommon', 'rare', 'prized', 'special'] as const) {
      for (const entry of ITEM_POOL[band]) {
        expect(getItemBand(entry.item)).toBe(band);
      }
    }
  });

  it('buries what belongs to a landscape only in that landscape', () => {
    const holds = (biome: Biome, item: Items): boolean =>
      (['base', 'uncommon', 'rare', 'prized', 'special'] as const).some((band) =>
        getItemPool(biome)[band].some((entry) => entry.item === item),
      );

    // A stone is a reason to cross the map: it is dug up where its
    // element is and nowhere else. A Sunkern asks for the sun one, so
    // the savanna is where a Sunflora comes from
    expect(holds(Biome.Savanna, Items.SunStone)).toBe(true);
    expect(holds(Biome.Glacier, Items.SunStone)).toBe(false);
    expect(holds(Biome.Volcano, Items.FireStone)).toBe(true);
    expect(holds(Biome.Ocean, Items.FireStone)).toBe(false);
    expect(holds(Biome.Ocean, Items.WaterStone)).toBe(true);
    expect(holds(Biome.Desert, Items.WaterStone)).toBe(false);
    expect(holds(Biome.Woodland, Items.LeafStone)).toBe(true);
    expect(holds(Biome.Glacier, Items.MoonStone)).toBe(true);

    // An item that names no ground is buried on all of it
    expect(getItemBiomes(Items.PokeBall)).toHaveLength(0);
    expect(getItemBiomes(Items.WaterStone).length).toBeGreaterThan(0);

    // What the whole world buries is in every pool there is
    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      expect(holds(biome, Items.PokeBall), BIOME_NAMES[biome]).toBe(true);
      expect(holds(biome, Items.MasterBall), BIOME_NAMES[biome]).toBe(true);
    }

    // Nothing is buried nowhere, and no biome is left with an empty
    // band: a stash has something to hand over wherever it is dug
    for (const entry of [
      ...ITEM_POOL.base,
      ...ITEM_POOL.uncommon,
      ...ITEM_POOL.rare,
      ...ITEM_POOL.prized,
      ...ITEM_POOL.special,
    ]) {
      expect(
        (Object.keys(BIOME_NAMES).map(Number) as Biome[]).some((biome) => holds(biome, entry.item)),
        getItemData(entry.item).name,
      ).toBe(true);
    }
    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      for (const band of ['base', 'uncommon', 'rare', 'prized', 'special'] as const) {
        expect(getItemPool(biome)[band].length, `${BIOME_NAMES[biome]} ${band}`).toBeGreaterThan(0);
      }
    }
  });

  it('rolls the item pool through the rarity bands', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;

    // Band thresholds mirror the spawn pool's; the special tier now
    // holds the Shiny Charm and the strongest machines alongside the
    // Master Ball, so the within-band draw is taken by weight
    const specialTotal = ITEM_POOL.special.reduce((total, entry) => total + entry.weight, 0);

    expect(pickItem(ITEM_POOL, rolls([0, 0]))).toBe(Items.MasterBall);
    expect(pickItem(ITEM_POOL, rolls([0, 10.5 / specialTotal]))).toBe(Items.ShinyCharm);
    expect(pickItem(ITEM_POOL, rolls([0.01, 0]))).toBe(Items.FireStone);
    expect(pickItem(ITEM_POOL, rolls([0.05, 0]))).toBe(Items.UltraBall);
    expect(pickItem(ITEM_POOL, rolls([0.5, 0]))).toBe(Items.PokeBall);

    // Custom bands replace the defaults: bands summing to 1 shut the
    // base tier out, so even a terrible band roll stays uncommon
    expect(
      pickItem(ITEM_POOL, rolls([0.99, 0]), {
        special: 1 / 64,
        prized: 0,
        rare: 1 / 8,
        uncommon: 1,
      }),
    ).toBe(Items.UltraBall);
  });

  it('digs a stash of several kinds rather than one item', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;
    const inBand = (band: ItemPoolEntry[], item: Items): boolean =>
      band.some((entry) => entry.item === item);

    // The draws land in order: the ceiling, how many kinds, then per
    // kind its band (all but the first, which is the ceiling's), the
    // kind itself, and how many pieces of it
    expect(pickItems(ITEM_POOL, rolls([0.5, 0, 0, 0]))).toEqual([
      { item: Items.PokeBall, amount: 1 },
    ]);

    // Up to MAX_STACK pieces of each, off a draw of their own
    expect(pickItems(ITEM_POOL, rolls([0.5, 0, 0, 0.999]))).toEqual([
      { item: Items.PokeBall, amount: MAX_STACK },
    ]);

    // The opening draw is a ceiling rather than a slot: reaching the
    // rare band guarantees one rare kind and leaves a later kind free
    // to be a rare of its own — two of one rarity, which one-of-each
    // could never produce
    const rich = pickItems(ITEM_POOL, rolls([0.01, 0.5, 0, 0, 0.005, 0.5, 0]));

    expect(rich).toHaveLength(2);
    expect(rich[0].item).toBe(Items.FireStone);
    for (const { item } of rich) {
      expect(inBand(ITEM_POOL.rare, item)).toBe(true);
    }

    // A common ceiling stays common however many kinds it holds:
    // nothing in a stash beats what the opening draw reached
    const plain = pickItems(ITEM_POOL, rolls([0.5, 0.99, 0, 0, 0.001, 0.9, 0, 0.001, 0.4, 0]));

    expect(plain.length).toBeGreaterThan(1);
    for (const { item, amount } of plain) {
      expect(inBand(ITEM_POOL.base, item)).toBe(true);
      expect(amount).toBeLessThanOrEqual(MAX_STACK);
    }

    // Two kinds landing on the same item are one stack, and a stack
    // never exceeds MAX_STACK however they merge
    expect(pickItems(ITEM_POOL, rolls([0.5, 0.5, 0, 0.999, 0.5, 0, 0.999]))).toEqual([
      { item: Items.PokeBall, amount: MAX_STACK },
    ]);

    // A special is a ceiling like any other band: one piece of it,
    // and whatever the kind draw asks for buried alongside
    expect(pickItems(ITEM_POOL, rolls([0, 0, 0, 0, 0]))).toEqual([
      { item: Items.MasterBall, amount: 1 },
    ]);

    // Bands summing to 1 shut the base tier out of a stash the same
    // way they shut it out of a single roll
    const grotto = { special: 1 / 64, prized: 0, rare: 1 / 8, uncommon: 1 };
    const dug = pickItems(ITEM_POOL, rolls([0.99, 0.99, 0, 0, 0.001, 0.5, 0, 0.9, 0.5, 0]), grotto);

    expect(dug.length).toBeGreaterThan(0);
    for (const { item } of dug) {
      expect(inBand(ITEM_POOL.uncommon, item)).toBe(true);
    }
  });

  it('buries the combinations a stash is meant to be able to hold', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;
    const inBand = (band: ItemPoolEntry[], item: Items): boolean =>
      band.some((entry) => entry.item === item);

    // Two rares and a common: the ceiling's own kind, a second that
    // rolled the rare band again, and a third that did not
    const pair = pickItems(ITEM_POOL, rolls([0.01, 0.9, 0, 0, 0.005, 0.2, 0, 0.9, 0, 0]));

    expect(pair).toHaveLength(3);
    expect(inBand(ITEM_POOL.rare, pair[0].item)).toBe(true);
    expect(inBand(ITEM_POOL.rare, pair[1].item)).toBe(true);
    expect(inBand(ITEM_POOL.base, pair[2].item)).toBe(true);

    // A special, a prized and a rare: the special is the ceiling, and
    // what follows it is drawn the way anything under a ceiling is —
    // clamped to the band directly below the special, which is the
    // prized one
    const prize = pickItems(ITEM_POOL, rolls([0.0001, 0, 0.9, 0, 0, 0, 0.005, 0.2, 0]));

    expect(prize).toHaveLength(3);
    expect(inBand(ITEM_POOL.special, prize[0].item)).toBe(true);
    expect(prize[0].amount).toBe(1);
    expect(inBand(ITEM_POOL.prized, prize[1].item)).toBe(true);
    expect(inBand(ITEM_POOL.rare, prize[2].item)).toBe(true);

    // A rare and a common
    const modest = pickItems(ITEM_POOL, rolls([0.01, 0.5, 0, 0, 0.9, 0, 0]));

    expect(modest).toHaveLength(2);
    expect(inBand(ITEM_POOL.rare, modest[0].item)).toBe(true);
    expect(inBand(ITEM_POOL.base, modest[1].item)).toBe(true);

    // Never two specials, however the stream falls: only the opening
    // draw reaches that band, and everything after it is clamped to
    // prized at best
    const specials = new Set(ITEM_POOL.special.map((entry) => entry.item));
    // Odds that make the special band an everyday find, so the sweep
    // is actually testing the rule rather than never reaching it
    const generous = { special: 0.5, prized: 0.1, rare: 0.2, uncommon: 0.15 };
    let carried = 0;

    for (let seed = 0; seed < 2000; seed++) {
      for (const odds of [undefined, generous]) {
        const rng = new AleaRNG(`stash-${seed}-${odds == null ? 'usual' : 'generous'}`);
        const stash = pickItems(ITEM_POOL, () => rng.random(), odds);
        const found = stash.filter((stack) => specials.has(stack.item));

        carried += found.length;
        expect(found.length).toBeLessThanOrEqual(1);
        // And a special that is found is one piece of it
        for (const stack of found) {
          expect(stack.amount).toBe(1);
        }
        expect(stash.length).toBeLessThanOrEqual(MAX_KINDS);
        for (const stack of stash) {
          expect(stack.amount).toBeLessThanOrEqual(MAX_STACK);
        }
      }
    }

    // Half the generous rolls open on one, so the sweep saw plenty
    expect(carried).toBeGreaterThan(500);
  });

  it('rolls spawns through the rarity bands', () => {
    const pool = getSpawnPool(Biome.Mountain, TimeOfDay.Night);
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;

    // The rarest roll of all lands on the mythical the biome keeps,
    // and the one under it in the special section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0, 0]))!)).toBe(SpawnRarity.Mythical);
    expect(getSpawnRarity(pickSpawn(pool, rolls([1.5 / 4096, 0]))!)).toBe(SpawnRarity.Special);

    // Then the ladder down: prized, the two grown bands, the middle
    // of a line, and the first stages
    expect(getSpawnRarity(pickSpawn(pool, rolls([1 / 1024, 0]))!)).toBe(SpawnRarity.Prized);
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.01, 0]))!)).toBe(SpawnRarity.Elusive);
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.05, 0]))!)).toBe(SpawnRarity.Scarce);
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.15, 0]))!)).toBe(SpawnRarity.Rare);
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.3, 0]))!)).toBe(SpawnRarity.Uncommon);

    // Everything else lands in the base section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.5, 0]))!)).toBe(SpawnRarity.Base);

    // An empty pool cannot roll
    expect(
      pickSpawn({ base: [], uncommon: [], rare: [], special: [] }, rolls([0.5, 0])),
    ).toBeNull();
  });
});

describe('honey trees', () => {
  it('keeps what a honey tree draws out out of every wild pool', () => {
    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      for (const time of TIMES_OF_DAY) {
        const groups = getBiomeRoster(biome, time);

        for (const band of SPAWN_BAND_KEYS) {
          for (const entry of spawnBand(groups, band)) {
            expect(
              HONEY_TREE_SPECIES.has(entry.species),
              `${getSpeciesData(entry.species).name} in ${BIOME_NAMES[biome]}`,
            ).toBe(false);
          }
        }
      }
    }
    for (const species of HONEY_TREE_SPECIES) {
      expect(getSpeciesData(species).biomes).toEqual([]);
    }
  });

  it('bands each pokemon where its line puts it', () => {
    const rarities: Record<string, SpawnRarity> = {
      base: SpawnRarity.Base,
      uncommon: SpawnRarity.Uncommon,
      rare: SpawnRarity.Rare,
      scarce: SpawnRarity.Scarce,
      elusive: SpawnRarity.Elusive,
      prized: SpawnRarity.Prized,
    };

    for (const band of SPAWN_BAND_KEYS) {
      for (const entry of spawnBand(HONEY_TREE_POOL, band)) {
        expect(getSpawnRarity(entry.species), getSpeciesData(entry.species).name).toBe(
          rarities[band],
        );
      }
    }
  });

  it('only ever draws out one of its own', () => {
    for (const roll of [0, 0.1, 0.3, 0.6, 0.9, 0.999]) {
      const drawn = rollHoneyTree(() => roll);

      expect(drawn).not.toBeNull();
      expect(HONEY_TREE_SPECIES.has(drawn ?? Species.Missingno)).toBe(true);
    }
  });
});

describe('town names', () => {
  it('dresses every country a town can stand on, and nothing else', () => {
    const dressed = (Object.keys(TOWN_HEADS).map(Number) as SettledBiome[]).sort(
      (left, right) => left - right,
    );

    // Exactly the biomes a town can be settled on. Words for a biome
    // no town can stand on would be words nothing ever reaches
    expect(dressed).toEqual(WILD_BIOMES.filter(isSettledBiome));
    for (const biome of dressed) {
      expect(isOpenSea(biome), BIOME_NAMES[biome]).toBe(false);
    }

    const seen = new Map<string, Biome>();

    for (const biome of dressed) {
      const heads = TOWN_HEADS[biome];

      expect(heads.length, BIOME_NAMES[biome]).toBe(HEADS_PER_BIOME);
      for (const head of heads) {
        // Two biomes sharing a word is two towns that could be called
        // the same thing, which is a name the store has to re-roll
        expect(seen.get(head) ?? biome, head).toBe(biome);
        seen.set(head, biome);
        expect(head).toMatch(/^[A-Z][a-z]+$/);
      }
    }
  });

  it('gives a county’s regions a name each, and never two the same', () => {
    const names = new Set<string>();

    // A whole county, which is the set a name has to be unique inside.
    // Exhaustive on purpose: this is the claim the whole scheme rests
    // on, and it is only 4,096 names
    for (let y = 0; y < COUNTY_REGIONS; y++) {
      for (let x = 0; x < COUNTY_REGIONS; x++) {
        names.add(nameTown(x, y, Biome.Glacier));
      }
    }
    expect(names.size).toBe(COUNTY_REGIONS * COUNTY_REGIONS);
    // And the county has room left over, which is what lets the marks
    // stay rare
    expect(NAMES_PER_BIOME).toBe(49_920);
    expect(NAMES_PER_BIOME).toBeGreaterThan(COUNTY_REGIONS * COUNTY_REGIONS);
  });

  it('keeps a mark a flourish rather than a fixture', () => {
    let marked = 0;

    for (let y = 0; y < COUNTY_REGIONS; y++) {
      for (let x = 0; x < COUNTY_REGIONS; x++) {
        // A mark is a word in front, so a marked name is the one with
        // three words before the county rather than two
        if (nameTown(x, y, Biome.Glacier).split(',')[0].split(' ').length === 3) {
          marked++;
        }
      }
    }
    // The 3,840 unmarked names are spent first, so only what is left
    // of the county's 4,096 regions reaches for one
    expect(marked).toBe(COUNTY_REGIONS * COUNTY_REGIONS - 8 * 40 * 12);
    expect(marked / (COUNTY_REGIONS * COUNTY_REGIONS)).toBeLessThan(0.07);
  });

  it('names a town for the county it stands in', () => {
    const name = nameTown(3, -2, Biome.Glacier);
    const [local, county] = name.split(', ');

    expect(county).not.toBeUndefined();
    // The head is the glacier's own, which is what makes the name
    // worth reading before the map is looked at
    const words = local.split(' ');

    expect(
      TOWN_HEADS[Biome.Glacier].some((head) => words[words.length - 2].startsWith(head)),
      name,
    ).toBe(true);

    // Everywhere in one county shares its second half, and a region a
    // county over does not
    expect(nameTown(4, -2, Biome.Glacier).split(', ')[1]).toBe(county);
    expect(nameTown(3 + COUNTY_REGIONS, -2, Biome.Glacier).split(', ')[1]).not.toBe(county);
  });

  it('never depends on how big the world is', () => {
    // A county is floor(region / 64) and nothing else, so growing the
    // world leaves every town that already existed under the name it
    // already had. Every region the world has today must land inside
    // the county names, which is what would fail if it grew
    const lowest = Math.floor((WORLD_MIN * CHUNK_CELLS) / (TOWN_REGION * CHUNK_CELLS));
    const highest = Math.floor(((WORLD_MAX + 1) * CHUNK_CELLS - 1) / (TOWN_REGION * CHUNK_CELLS));

    for (const y of [lowest, -1, 0, highest]) {
      for (const x of [lowest, -1, 0, highest]) {
        expect(() => nameTown(x, y, Biome.Glacier)).not.toThrow();
      }
    }
    // ...and a region past the world's edge is the thing that says so,
    // rather than quietly sharing a name with somewhere real
    expect(() => nameTown(lowest - 1, 0, Biome.Glacier)).toThrow();
    expect(() => nameTown(0, highest + 1, Biome.Glacier)).toThrow();
  });
});

describe('what lives underground', () => {
  it('draws from its own pool, not the country overhead', () => {
    const surface = getSpawnPool(Biome.Grassland, TimeOfDay.Day);
    const cave = getSpawnPool(Biome.Grassland, TimeOfDay.Day, true);

    expect(cave.base.length).toBeGreaterThan(0);
    expect(cave).not.toEqual(surface);
    // Zubat is what a cave is, and it stands in no biome pool
    expect(cave.base.some((entry) => entry.species === Species.Zubat)).toBe(true);
  });

  it('is the same pool under every country and at every hour', () => {
    const day = getSpawnPool(Biome.Grassland, TimeOfDay.Day, true);

    // There is no sky down there for an hour to come out of, and a
    // cave under a desert is the same cave as one under a taiga
    for (const time of TIMES_OF_DAY) {
      expect(getSpawnPool(Biome.Glacier, time, true)).toEqual(day);
      expect(getSpawnPool(Biome.Desert, time, true)).toEqual(day);
    }
  });

  it('stages no legendary in a passage', () => {
    // A legendary underground is at home in a lair rather than
    // standing about in a tunnel
    expect(getSpawnPool(Biome.Mountain, TimeOfDay.Day, true).special).toEqual([]);
  });

  it('lights the dark the same way from either source', () => {
    // Two ways to buy one effect, so they must arrive at the same
    // place and must not stack into a third
    expect(CAVE_LAMP_CELLS).toBe(ILLUMINATE_LAMP_CELLS);
    expect(CAVE_DARK_CELLS).toBeLessThan(CAVE_LAMP_CELLS);
  });
});
