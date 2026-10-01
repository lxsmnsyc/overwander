import { describe, expect, it } from 'vitest';
import registerBiomeSpawns, {
  BIOME_NAMES,
  MYTHICAL_SPAWN_ODDS,
  SPAWN_BAND_KEYS,
  SPECIAL_SPAWN_ODDS,
  SpawnClass,
  SpawnRarity,
  TIMES_OF_DAY,
  fitsSurface,
  getBiomeRoster,
  getSpawnClass,
  getSpawnPool,
  isLegendarySpecies,
  isMythicalSpecies,
  listSpeciesHabitats,
  spawnBand,
} from '../../src/data/biome';
import { getBiomeLairs, getCaveLairs, getLairResidents } from '../../src/data/overworld/lair';
import registerAbilities from '../../src/data/abilities';
import { Types } from '../../src/data/constants/types';
import Biome, { SpawnSurface, TimeOfDay } from '../../src/data/ids/biome';
import {
  DEERLING_FORMS,
  ROTOM_FORMS,
  SAWSBUCK_FORMS,
  Species,
  VIVILLON_FORMS,
} from '../../src/data/ids/species';
import registerItems from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import {
  getRegisteredSpecies,
  getShoreForm,
  getSpeciesByBiome,
  getSpeciesData,
  registerSpecies,
} from '../../src/data/species';
import { SURFACES, everyPool } from './helpers';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('which pool a species may stand in', () => {
  it('keeps what only swims off land and ice, and what walks out of the water', () => {
    expect(fitsSurface(Species.Magikarp, SpawnSurface.Water)).toBe(true);
    expect(fitsSurface(Species.Magikarp, SpawnSurface.Land)).toBe(false);
    expect(fitsSurface(Species.Magikarp, SpawnSurface.Ice)).toBe(false);
    expect(fitsSurface(Species.Rhyhorn, SpawnSurface.Water)).toBe(false);
    expect(fitsSurface(Species.Rhyhorn, SpawnSurface.Ice)).toBe(true);
    // A flier or floater is over ground and water alike
    expect(fitsSurface(Species.Pidgey, SpawnSurface.Water)).toBe(true);
    expect(fitsSurface(Species.Pidgey, SpawnSurface.Land)).toBe(true);
    expect(fitsSurface(Species.Gastly, SpawnSurface.Water)).toBe(true);
    // ...save the flying types that live under the water
    expect(fitsSurface(Species.Gyarados, SpawnSurface.Land)).toBe(false);
    expect(fitsSurface(Species.Gyarados, SpawnSurface.Water)).toBe(true);
    // An amphibious water species stands in either
    expect(fitsSurface(Species.Psyduck, SpawnSurface.Land)).toBe(true);
    expect(fitsSurface(Species.Psyduck, SpawnSurface.Water)).toBe(true);
    // A water egg group does not put a desert scorpion in the water
    expect(fitsSurface(Species.Skorupi, SpawnSurface.Water)).toBe(false);
    expect(fitsSurface(Species.Skorupi, SpawnSurface.Land)).toBe(true);
    // A water species with no mark of its own keeps to the water
    expect(fitsSurface(Species.Dratini, SpawnSurface.Land)).toBe(false);
  });

  it('splits every species into the ground, the water or the air', () => {
    expect(getSpawnClass(Species.Pidgey)).toBe(SpawnClass.Flying);
    expect(getSpawnClass(Species.Bronzor)).toBe(SpawnClass.Flying);
    expect(getSpawnClass(Species.Pelipper)).toBe(SpawnClass.Flying);
    expect(getSpawnClass(Species.Gyarados)).toBe(SpawnClass.Water);
    expect(getSpawnClass(Species.Magikarp)).toBe(SpawnClass.Water);
    expect(getSpawnClass(Species.Bidoof)).toBe(SpawnClass.Water);
    expect(getSpawnClass(Species.Drapion)).toBe(SpawnClass.Ground);
    expect(getSpawnClass(Species.Rhyhorn)).toBe(SpawnClass.Ground);
  });

  it('gives every Water type a place in the water', () => {
    const dry = new Set<Species>();

    for (const species of getRegisteredSpecies()) {
      const data = getSpeciesData(species);

      if (
        data.types.includes(Types.Water) &&
        data.worn !== true &&
        !fitsSurface(species, SpawnSurface.Water)
      ) {
        dry.add(species);
      }
    }
    expect(dry).toEqual(new Set());
  });

  it('writes every pool for the surface it stands on', () => {
    for (const [biome, time, surface] of everyPool()) {
      const groups = getSpawnPool(biome, time, false, surface);

      for (const band of SPAWN_BAND_KEYS) {
        for (const entry of spawnBand(groups, band)) {
          const { name } = getSpeciesData(entry.species);

          expect(
            fitsSurface(entry.species, surface),
            `${name} in ${BIOME_NAMES[biome]} (surface ${surface})`,
          ).toBe(true);
        }
      }
    }
  });
});

describe('where a species lives', () => {
  it('reads the pools backwards, one entry per biome, hour and band', () => {
    const habitats = listSpeciesHabitats(Species.Rattata);

    expect(habitats.length).toBeGreaterThan(0);

    // Every entry says a place the pool actually lists it in, in the
    // band the pool put it in
    for (const habitat of habitats) {
      const groups = getSpawnPool(habitat.biome, habitat.time);
      const bands: [SpawnRarity, { species: Species }[]][] = [
        [SpawnRarity.Base, groups.base],
        [SpawnRarity.Uncommon, groups.uncommon],
        [SpawnRarity.Rare, groups.rare],
        [SpawnRarity.Prized, groups.prized ?? []],
        [SpawnRarity.Special, groups.special],
      ];

      for (const [rarity, entries] of bands) {
        const listed = entries.some((entry) => entry.species === Species.Rattata);

        expect(listed).toBe(rarity === habitat.rarity);
      }
    }
  });

  it('finds the grassland it is met in all day', () => {
    const grassland = listSpeciesHabitats(Species.Rattata).filter(
      (habitat) => habitat.biome === Biome.Grassland,
    );

    expect(grassland.map((habitat) => habitat.time).sort()).toEqual(
      [TimeOfDay.Morning, TimeOfDay.Day, TimeOfDay.Evening, TimeOfDay.Night].sort(),
    );
    // Two stages, so it stands one band up from the bottom
    for (const habitat of grassland) {
      expect(habitat.rarity).toBe(SpawnRarity.Uncommon);
    }
  });

  it('gives the two one-per-world classes a band each', () => {
    // A legendary stands in the special band of the biomes it lives
    // in: the world stages one, rarely
    const legendary = listSpeciesHabitats(Species.Articuno);

    expect(legendary.length).toBeGreaterThan(0);
    for (const habitat of legendary) {
      expect(habitat.rarity).toBe(SpawnRarity.Special);
    }

    // A mythical stands in a band of its own, one place apiece and as
    // thin as the legendary band. The relic is the other way to one,
    // not the only way
    for (const species of [
      Species.Mew,
      Species.Celebi,
      Species.Jirachi,
      Species.Deoxys,
      Species.Darkrai,
      Species.Manaphy,
      Species.Shaymin,
      Species.Arceus,
    ]) {
      expect(isMythicalSpecies(species)).toBe(true);

      const mythical = listSpeciesHabitats(species);

      expect(mythical.length).toBeGreaterThan(0);
      for (const habitat of mythical) {
        expect(habitat.rarity).toBe(SpawnRarity.Mythical);
      }
    }
    expect(MYTHICAL_SPAWN_ODDS).toBe(SPECIAL_SPAWN_ODDS);
  });

  it('stages a legendary wild wherever its lair stands', () => {
    // A lair equates to a wild spawn: a biome that hosts one lists each
    // resident in its special band whenever that resident is about.
    // Mythical lairs are never hosted, so they never reach this list
    const homes = (Object.keys(BIOME_NAMES).map(Number) as Biome[]).flatMap((biome) =>
      getBiomeLairs(biome).flatMap((lair) =>
        getLairResidents(lair).map((species) => ({ biome, species })),
      ),
    );

    expect(homes.length).toBeGreaterThan(0);
    for (const { biome, species } of homes) {
      const { activeTimes, name } = getSpeciesData(species);

      for (const time of TIMES_OF_DAY.filter((period) => (activeTimes & period) !== 0)) {
        // Any of the biome's surfaces will do, since Kyogre lives in the water
        const band = new Set(
          SURFACES.flatMap((surface) =>
            spawnBand(getSpawnPool(biome, time, false, surface), 'special').map(
              (entry) => entry.species,
            ),
          ),
        );

        expect(band.has(species), `${name} in ${BIOME_NAMES[biome]}`).toBe(true);
      }
    }
  });

  it('stages a cave legendary wild under its own lair, and only there', () => {
    // A cave keeps the legendaries of the underground lairs its biome
    // hosts, each on the surface it can stand on
    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      for (const surface of SURFACES) {
        const residents = new Set<Species>();

        for (const lair of getCaveLairs(biome)) {
          for (const species of getLairResidents(lair)) {
            if (fitsSurface(species, surface)) {
              residents.add(species);
            }
          }
        }
        for (const time of TIMES_OF_DAY) {
          const band = new Set<Species>();

          for (const entry of spawnBand(getSpawnPool(biome, time, true, surface), 'special')) {
            band.add(entry.species);
          }
          expect(band, `${BIOME_NAMES[biome]} caves`).toEqual(residents);
        }
      }
    }
    // Kyogre swims in a cave's water and never stands on its floor
    for (const entry of spawnBand(getSpawnPool(Biome.Beach, TimeOfDay.Day, true), 'special')) {
      expect(entry.species).not.toBe(Species.Kyogre);
    }
  });

  it('stages a legendary nowhere its lairs do not stand', () => {
    // The other half of the rule: a legendary lives where its lair is
    // and nowhere else, so a roaming one needs a lair in that biome
    const hosts = new Map<Species, Set<Biome>>();

    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      for (const lair of getBiomeLairs(biome)) {
        for (const species of getLairResidents(lair)) {
          hosts.set(species, (hosts.get(species) ?? new Set()).add(biome));
        }
      }
    }

    expect(hosts.size).toBeGreaterThan(0);
    for (const [species, biomes] of hosts) {
      const { name } = getSpeciesData(species);

      for (const biome of getSpeciesData(species).biomes) {
        expect(biomes.has(biome), `${name} in ${BIOME_NAMES[biome]}`).toBe(true);
      }
    }
  });

  it('says the same thing the pools do about every species', () => {
    // Nothing is invented and nothing is dropped: the number of
    // habitat entries is exactly the number of times the registry
    // lists that species anywhere
    const counted = new Map<Species, number>();

    for (const [biome, time, surface] of everyPool()) {
      // One roster per biome and hour, whatever its surfaces
      if (surface !== SpawnSurface.Land) {
        continue;
      }
      const groups = getBiomeRoster(biome, time);

      for (const band of SPAWN_BAND_KEYS) {
        for (const entry of spawnBand(groups, band)) {
          counted.set(entry.species, (counted.get(entry.species) ?? 0) + 1);
        }
      }
    }

    for (const species of getRegisteredSpecies()) {
      expect(listSpeciesHabitats(species).length).toBe(counted.get(species) ?? 0);
    }
  });

  it('stages nothing where or when its species does not live', () => {
    for (const [biome, time, surface] of everyPool()) {
      const groups = getSpawnPool(biome, time, false, surface);

      // The prized band is the alphabet and the babies, which stand
      // in every biome by design
      for (const band of SPAWN_BAND_KEYS.filter((key) => key !== 'prized')) {
        for (const entry of spawnBand(groups, band)) {
          const data = getSpeciesData(entry.species);

          expect(data.biomes, `${data.name} in ${BIOME_NAMES[biome]}`).toContain(biome);
          expect(data.activeTimes & time, `${data.name} at ${time}`).not.toBe(0);
        }
      }
    }
  });

  it('hands over the shell the side of the world asks for', () => {
    // West of the meridian is the pink one, east of it the blue, and
    // the rule is the chunk's own x rather than anything about the
    // shore it is standing on
    expect(getShoreForm(Species.Shellos, -1)).toBe(Species.Shellos);
    expect(getShoreForm(Species.Shellos, 0)).toBe(Species.ShellosEast);
    expect(getShoreForm(Species.Shellos, 12)).toBe(Species.ShellosEast);
    expect(getShoreForm(Species.Gastrodon, -400)).toBe(Species.Gastrodon);
    expect(getShoreForm(Species.Gastrodon, 400)).toBe(Species.GastrodonEast);

    // Everything else is handed back as it came
    expect(getShoreForm(Species.Bulbasaur, 400)).toBe(Species.Bulbasaur);
    expect(getShoreForm(Species.ShellosEast, -400)).toBe(Species.ShellosEast);
  });

  it('stages every species that says it lives somewhere', () => {
    // A Rotom in a machine lives where a Rotom does, but a Catalog
    // is the only way into one of those shapes, so no pool names one.
    //
    // Phione is laid rather than met: a Manaphy's egg is the only
    // one there is, so no pool stages it though it names the water it
    // drifts in.
    //
    // Porygon is met on town streets, which no biome pool holds, and
    // what it evolves into is made rather than met. The far shore's
    // shell is staged by the pool its west counterpart sits in, and
    // swapped for as the world hands it over, so no pool names it either.
    //
    // The Pikipek and Yungoos lines name where they live, but the
    // collection has drawn no Trumbeak, finished Toucannon or Gumshoos,
    // so neither is staged until it does. The pools they are waiting
    // for are written as comments in the biome files
    const unstaged = new Set<Species>([
      Species.Phione,
      ...ROTOM_FORMS.slice(1),
      Species.Porygon,
      Species.Porygon2,
      Species.PorygonZ,
      Species.ShellosEast,
      Species.GastrodonEast,
      // The wings a country hands a Vivillon, which the meeting puts
      // on rather than the pool holding one of each
      ...VIVILLON_FORMS.slice(1),
      // The three coats past spring are staged by the pool the spring
      // one sits in, and swapped for as the month hands them over, so
      // no pool names them either
      ...DEERLING_FORMS.slice(1),
      ...SAWSBUCK_FORMS.slice(1),
      Species.Pikipek,
      Species.Trumbeak,
      Species.Toucannon,
      Species.Yungoos,
      Species.Gumshoos,
      // Shiinotic and Oranguru are undrawn, and Passimian waits on its
      // counterpart
      Species.Morelull,
      Species.Shiinotic,
      Species.Oranguru,
      Species.Passimian,
    ]);
    const staged = new Set<Species>();

    for (const [biome, time, surface] of everyPool()) {
      const groups = getSpawnPool(biome, time, false, surface);

      for (const band of SPAWN_BAND_KEYS) {
        for (const entry of spawnBand(groups, band)) {
          staged.add(entry.species);
        }
      }
    }

    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      for (const species of getSpeciesByBiome(biome)) {
        if (unstaged.has(species) || isLegendarySpecies(species) || isMythicalSpecies(species)) {
          continue;
        }
        expect(staged.has(species), getSpeciesData(species).name).toBe(true);
      }
    }
  });
});
