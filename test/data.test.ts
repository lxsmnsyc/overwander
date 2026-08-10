import { describe, expect, it } from 'vitest';
import registerBiomeSpawns, {
  SpawnRarity,
  boostFamilyWeights,
  getSpawnPool,
  getSpawnRarity,
  pickSpawn,
} from '../src/data/biome';
import Families from '../src/data/ids/families';
import registerAbilities, { getAbilityData } from '../src/data/abilities';
import Abilities from '../src/data/ids/abilities';
import Biome, { AnyTimeOfDay, TimeOfDay, getBiome } from '../src/data/ids/biome';
import { BALL_ITEMS, ItemFlags, ItemTypes, Items } from '../src/data/ids/items';
import { EvolutionMethod, Species } from '../src/data/ids/species';
import {
  CANDY_PER_CATCH,
  CANDY_PER_LEVEL,
  SHADOW_CANDY_MULTIPLIER,
  SPECIES_DAY_CANDY_BOOST,
  getCandyCost,
} from '../src/auth/candy';
import registerItems, { getItemData } from '../src/data/items';
import registerGen1Moves from '../src/data/moves/gen-1';
import { ITEM_POOL, pickItem } from '../src/data/overworld/item-pool';
import {
  SPECIES_DAY_WEIGHT_BOOST,
  getAvailableEvolutions,
  getConsumedItem,
  getDayOfYear,
  getFeaturedFamily,
  getSpeciesAbilities,
  getSpeciesAbilityPools,
  getSpeciesByBiome,
  getSpeciesData,
  isFeaturedSpecies,
  registerSpecies,
} from '../src/data/species';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerGen1Moves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('species abilities', () => {
  it('evolved species learn their pre-evolutions abilities', () => {
    // Vileplume's own set plus Gloom's Stench and Oddish's Run Away
    const vileplume = getSpeciesAbilities(Species.Vileplume);

    expect(vileplume.has(Abilities.EffectSpore)).toBe(true);
    expect(vileplume.has(Abilities.Chlorophyll)).toBe(true);
    expect(vileplume.has(Abilities.Stench)).toBe(true);
    expect(vileplume.has(Abilities.RunAway)).toBe(true);

    // Base species only know their own set
    const oddish = getSpeciesAbilities(Species.Oddish);

    expect(oddish.has(Abilities.Stench)).toBe(false);
    expect(oddish.size).toBe(2);
  });

  it('splits hidden abilities from regular abilities', () => {
    const lapras = getSpeciesData(Species.Lapras);

    expect(lapras.abilities).toEqual([Abilities.WaterAbsorb, Abilities.ShellArmor]);
    expect(lapras.hiddenAbility).toBe(Abilities.Hydration);

    // Species without one leave the field unset
    expect(getSpeciesData(Species.Gastly).hiddenAbility).toBeUndefined();

    // The ancestry walk still covers hidden abilities
    expect(getSpeciesAbilities(Species.Lapras).has(Abilities.Hydration)).toBe(true);
  });

  it('pools regular and hidden abilities across the line', () => {
    // Vileplume's line shares Chlorophyll; each stage hides its own
    const pools = getSpeciesAbilityPools(Species.Vileplume);

    expect(pools.regular).toEqual([Abilities.Chlorophyll]);
    expect(pools.hidden).toEqual([Abilities.EffectSpore, Abilities.Stench, Abilities.RunAway]);
  });
});

describe('ability data', () => {
  it('names every ability a species can roll', () => {
    // The UI reads these names, so an unregistered ability would
    // show up as a bare id in the battle field and the catch dialog
    const seen = new Set<Abilities>();

    for (let biome = Biome.DeepOcean; biome <= Biome.PolarOcean; biome++) {
      for (const species of getSpeciesByBiome(biome)) {
        for (const ability of getSpeciesAbilities(species)) {
          seen.add(ability);
          expect(getAbilityData(ability).name.length).toBeGreaterThan(0);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(50);

    expect(getAbilityData(Abilities.Chlorophyll).name).toBe('Chlorophyll');
    expect(getAbilityData(Abilities.CompoundEyes).name).toBe('Compound Eyes');

    // The raid abilities are registered alongside the rolled ones
    expect(getAbilityData(Abilities.Boss).name).toBe('Boss');
    expect(getAbilityData(Abilities.Shadow).name).toBe('Shadow');
  });
});

describe('evolution data', () => {
  it('describes level, stone and trade evolutions', () => {
    expect(getSpeciesData(Species.Bulbasaur).evolvesInto).toEqual([
      { species: Species.Ivysaur, method: EvolutionMethod.Level, level: 16 },
    ]);

    expect(getSpeciesData(Species.Eevee).evolvesInto).toHaveLength(3);
    expect(getSpeciesData(Species.Eevee).evolvesInto?.[0]).toEqual({
      species: Species.Vaporeon,
      method: EvolutionMethod.UsedItem,
      item: Items.WaterStone,
    });

    expect(getSpeciesData(Species.Haunter).evolvesInto).toEqual([
      { species: Species.Gengar, method: EvolutionMethod.Trade },
    ]);

    // Final stages have none
    expect(getSpeciesData(Species.Venusaur).evolvesInto).toBeUndefined();
  });

  it('offers level evolutions once the threshold is reached', () => {
    const context = { carried: new Set<Items>(), held: new Set<Items>() };

    expect(getAvailableEvolutions(Species.Charmander, { ...context, level: 15 })).toEqual([]);
    expect(getAvailableEvolutions(Species.Charmander, { ...context, level: 16 })).toEqual([
      { species: Species.Charmeleon, method: EvolutionMethod.Level, level: 16 },
    ]);
  });

  it('offers stone evolutions only while the stone is carried', () => {
    const context = { level: 50, held: new Set<Items>() };

    expect(getAvailableEvolutions(Species.Vulpix, { ...context, carried: new Set() })).toEqual([]);
    expect(
      getAvailableEvolutions(Species.Vulpix, { ...context, carried: new Set([Items.LeafStone]) }),
    ).toEqual([]);
    expect(
      getAvailableEvolutions(Species.Vulpix, { ...context, carried: new Set([Items.FireStone]) }),
    ).toEqual([
      { species: Species.Ninetales, method: EvolutionMethod.UsedItem, item: Items.FireStone },
    ]);
  });

  it('never offers evolutions it cannot verify', () => {
    // Trade evolutions have no stored counterpart yet, so Machoke
    // stays a Machoke however high its level runs
    expect(
      getAvailableEvolutions(Species.Machoke, {
        level: 100,
        carried: new Set(),
        held: new Set(),
      }),
    ).toEqual([]);
  });

  it('spends the used item and leaves a held one alone', () => {
    const [stone] = getSpeciesData(Species.Vulpix).evolvesInto ?? [];
    const [level] = getSpeciesData(Species.Charmander).evolvesInto ?? [];

    expect(getConsumedItem(stone)).toBe(Items.FireStone);
    expect(getConsumedItem(level)).toBeNull();
    expect(
      getConsumedItem({
        species: Species.Ninetales,
        method: EvolutionMethod.HeldItem,
        item: Items.FireStone,
      }),
    ).toBeNull();
  });
});

describe('species day', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const YEAR_START = Date.UTC(2026, 0, 1);

  it('counts the day of the year from the first of January in UTC', () => {
    expect(getDayOfYear(YEAR_START)).toBe(0);
    expect(getDayOfYear(YEAR_START + 40 * DAY)).toBe(40);
    expect(getDayOfYear(YEAR_START + 364 * DAY)).toBe(364);
  });

  it('features the family whose number is the day of the year', () => {
    // Family 0 is Bulbasaur's, so it opens the year; family 1 is
    // Charmander's, and so on
    expect(getFeaturedFamily(YEAR_START)).toBe(Families.Bulbasaur);
    expect(getFeaturedFamily(YEAR_START + DAY)).toBe(Families.Charmander);
    expect(getFeaturedFamily(YEAR_START + Families.Mewtwo * DAY)).toBe(Families.Mewtwo);

    // Family numbers run far short of a year, so most days feature
    // nobody at all
    expect(getFeaturedFamily(YEAR_START + 200 * DAY)).toBeNull();

    // The whole family is featured, not just one stage
    expect(isFeaturedSpecies(Species.Venusaur, YEAR_START)).toBe(true);
    expect(isFeaturedSpecies(Species.Bulbasaur, YEAR_START)).toBe(true);
    expect(isFeaturedSpecies(Species.Charmander, YEAR_START)).toBe(false);
    expect(isFeaturedSpecies(Species.Bulbasaur, YEAR_START + 200 * DAY)).toBe(false);
  });

  it('charges a shadow twice the candy per level', () => {
    expect(getCandyCost({ shadow: false })).toBe(CANDY_PER_LEVEL);
    expect(getCandyCost({ shadow: true })).toBe(CANDY_PER_LEVEL * SHADOW_CANDY_MULTIPLIER);
    expect(getCandyCost({ shadow: true })).toBe(2);
  });

  it('pays four candies for a catch on the family day', () => {
    // The catch reward and the spawn weight share the same fourfold
    // bonus, so a family day is worth the same wherever it lands
    expect(SPECIES_DAY_CANDY_BOOST).toBe(SPECIES_DAY_WEIGHT_BOOST);
    expect(CANDY_PER_CATCH * SPECIES_DAY_CANDY_BOOST).toBe(4);

    // Bulbasaur's family opens the year, so its line pays the bonus
    // that day and nothing else does
    expect(isFeaturedSpecies(Species.Ivysaur, YEAR_START)).toBe(true);
    expect(isFeaturedSpecies(Species.Ivysaur, YEAR_START + 200 * DAY)).toBe(false);
  });

  it('weights the featured family four times as heavily', () => {
    const pool = getSpawnPool(Biome.Grassland, TimeOfDay.Morning);
    const boosted = boostFamilyWeights(pool, Families.Pidgey, SPECIES_DAY_WEIGHT_BOOST);

    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      pool[band].forEach((entry, index) => {
        const factor = getSpeciesData(entry.species).family === Families.Pidgey ? 4 : 1;

        expect(boosted[band][index].weight).toBe(entry.weight * factor);
      });
    }

    // The original pool is left alone
    expect(pool).toEqual(getSpawnPool(Biome.Grassland, TimeOfDay.Morning));
  });
});

describe('item data', () => {
  it('registers every ball a catch can be made with', () => {
    // The catch record stores a ball, and the UI names it through
    // the item registry, so every variant has to be registered
    for (const item of Object.values(BALL_ITEMS)) {
      expect(getItemData(item).type).toBe(ItemTypes.PokeBall);
    }

    expect(getItemData(Items.PokeBall).name).toBe('Poke Ball');
    expect(getItemData(Items.DuskBall).name).toBe('Dusk Ball');

    // A ball is spent by the throw, never held
    expect(getItemData(Items.UltraBall).flags & ItemFlags.Consumable).not.toBe(0);
    expect(getItemData(Items.UltraBall).flags & ItemFlags.Holdable).toBe(0);
  });

  it('registers the Shiny Charm as a holdable key item', () => {
    const charm = getItemData(Items.ShinyCharm);

    expect(charm.name).toBe('Shiny Charm');
    expect(charm.type).toBe(ItemTypes.KeyItem);

    // A buddy holds it; nothing ever consumes it
    expect(charm.flags & ItemFlags.Holdable).not.toBe(0);
    expect(charm.flags & ItemFlags.Consumable).toBe(0);
  });
});

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

  it('assigns habitat biomes to species', () => {
    expect(getSpeciesData(Species.Sandshrew).biomes).toEqual([Biome.Desert]);
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
    // Unevolved, can still evolve
    expect(getSpawnRarity(Species.Pidgey)).toBe(SpawnRarity.Base);
    expect(getSpawnRarity(Species.Omanyte)).toBe(SpawnRarity.Base);

    // Middle evolutions
    expect(getSpawnRarity(Species.Ivysaur)).toBe(SpawnRarity.Uncommon);
    expect(getSpawnRarity(Species.Haunter)).toBe(SpawnRarity.Uncommon);

    // Fully evolved and single-line
    expect(getSpawnRarity(Species.Pidgeot)).toBe(SpawnRarity.Rare);
    expect(getSpawnRarity(Species.Ditto)).toBe(SpawnRarity.Rare);

    // One-per-world class
    expect(getSpawnRarity(Species.Mew)).toBe(SpawnRarity.Special);
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
    expect(night.base.some((entry) => entry.species === Species.Meowth)).toBe(true);

    // Legendaries sit in their own section
    const peak = getSpawnPool(Biome.Mountain, TimeOfDay.Night);
    expect(peak.special.some((entry) => entry.species === Species.Zapdos)).toBe(true);
  });

  it('rolls the item pool through the rarity bands', () => {
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;

    // Band thresholds mirror the spawn pool's; the special tier now
    // holds the Shiny Charm alongside the Master Ball
    expect(pickItem(ITEM_POOL, rolls([0, 0]))).toBe(Items.MasterBall);
    expect(pickItem(ITEM_POOL, rolls([0, 0.99]))).toBe(Items.ShinyCharm);
    expect(pickItem(ITEM_POOL, rolls([0.01, 0]))).toBe(Items.FireStone);
    expect(pickItem(ITEM_POOL, rolls([0.05, 0]))).toBe(Items.UltraBall);
    expect(pickItem(ITEM_POOL, rolls([0.5, 0]))).toBe(Items.PokeBall);

    // Custom bands replace the defaults: bands summing to 1 shut the
    // base tier out, so even a terrible band roll stays uncommon
    expect(
      pickItem(ITEM_POOL, rolls([0.99, 0]), { special: 1 / 64, rare: 1 / 8, uncommon: 1 }),
    ).toBe(Items.UltraBall);
  });

  it('rolls spawns through the rarity bands', () => {
    const pool = getSpawnPool(Biome.Mountain, TimeOfDay.Night);
    const rolls = (values: number[]) => () => values.shift() ?? 0.999;

    // A sub-1/4096 band roll lands in the special section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0, 0]))!)).toBe(SpawnRarity.Special);

    // A sub-1/64 band roll lands in the rare section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.01, 0]))!)).toBe(SpawnRarity.Rare);

    // A sub-1/8 band roll lands in the uncommon section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.05, 0]))!)).toBe(SpawnRarity.Uncommon);

    // Everything else lands in the base section
    expect(getSpawnRarity(pickSpawn(pool, rolls([0.5, 0]))!)).toBe(SpawnRarity.Base);

    // An empty pool cannot roll
    expect(
      pickSpawn({ base: [], uncommon: [], rare: [], special: [] }, rolls([0.5, 0])),
    ).toBeNull();
  });
});
