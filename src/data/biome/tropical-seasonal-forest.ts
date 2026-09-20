import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool, registerWaterPool } from './__create';

/**
 * TropicalSeasonalForest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTropicalSeasonalForestSpawns(): void {
  registerSpawnPool(Biome.TropicalSeasonalForest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.FlabebeOrange, weight: 24 },
        { species: Species.Scatterbug, weight: 24 },
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Treecko, weight: 2 },
      ],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Cherubi, weight: 22 },
      ],
      rare: [
        { species: Species.FloetteOrange, weight: 8 },
        { species: Species.Spewpa, weight: 8 },
        { species: Species.Weepinbell, weight: 5 },
        { species: Species.Grovyle, weight: 1 },
      ],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Cherrim, weight: 6 },
        { species: Species.Lickilicky, weight: 6 },
      ],
      elusive: [
        { species: Species.FlorgesOrange, weight: 5 },
        { species: Species.Vivillon, weight: 5 },
        { species: Species.Chatot, weight: 6 },
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Sceptile, weight: 2 },
        { species: Species.Kecleon, weight: 10 },
        { species: Species.Tropius, weight: 8 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.FlabebeOrange, weight: 24 },
        { species: Species.Scatterbug, weight: 24 },
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Treecko, weight: 2 },
      ],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Cherubi, weight: 22 },
      ],
      rare: [
        { species: Species.FloetteOrange, weight: 8 },
        { species: Species.Spewpa, weight: 8 },
        { species: Species.Weepinbell, weight: 5 },
        { species: Species.Grovyle, weight: 1 },
      ],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Cherrim, weight: 6 },
        { species: Species.Lickilicky, weight: 6 },
      ],
      elusive: [
        { species: Species.FlorgesOrange, weight: 5 },
        { species: Species.Vivillon, weight: 5 },
        { species: Species.Chatot, weight: 6 },
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Sceptile, weight: 2 },
        { species: Species.Kecleon, weight: 10 },
        { species: Species.Tropius, weight: 8 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Cherubi, weight: 22 },
      ],
      rare: [],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Cherrim, weight: 6 },
        { species: Species.Lickilicky, weight: 6 },
      ],
      elusive: [],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Cherubi, weight: 22 },
      ],
      rare: [],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Cherrim, weight: 6 },
        { species: Species.Lickilicky, weight: 6 },
      ],
      elusive: [],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
  registerWaterPool(Biome.TropicalSeasonalForest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Lotad, weight: 20 },
      ],
      uncommon: [
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Corphish, weight: 25 },
        { species: Species.Psyduck, weight: 20 },
      ],
      rare: [
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Lombre, weight: 10 },
      ],
      scarce: [
        { species: Species.Seaking, weight: 10 },
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Golduck, weight: 10 },
        { species: Species.Gyarados, weight: 4 },
      ],
      elusive: [
        { species: Species.Politoed, weight: 5 },
        { species: Species.Ludicolo, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Lotad, weight: 20 },
      ],
      uncommon: [
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Corphish, weight: 25 },
        { species: Species.Psyduck, weight: 20 },
      ],
      rare: [
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Lombre, weight: 10 },
      ],
      scarce: [
        { species: Species.Seaking, weight: 10 },
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Golduck, weight: 10 },
        { species: Species.Gyarados, weight: 4 },
      ],
      elusive: [
        { species: Species.Politoed, weight: 5 },
        { species: Species.Ludicolo, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Poliwag, weight: 20 }],
      uncommon: [
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Corphish, weight: 25 },
      ],
      rare: [{ species: Species.Poliwhirl, weight: 5 }],
      scarce: [
        { species: Species.Seaking, weight: 10 },
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Gyarados, weight: 4 },
      ],
      elusive: [{ species: Species.Politoed, weight: 5 }],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Poliwag, weight: 20 }],
      uncommon: [
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Corphish, weight: 25 },
      ],
      rare: [{ species: Species.Poliwhirl, weight: 5 }],
      scarce: [
        { species: Species.Seaking, weight: 10 },
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Gyarados, weight: 4 },
      ],
      elusive: [{ species: Species.Politoed, weight: 5 }],
      special: [],
    },
  });
}
