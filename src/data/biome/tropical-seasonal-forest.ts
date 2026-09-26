import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool, registerWaterPool } from './__create';

/**
 * TropicalSeasonalForest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTropicalSeasonalForestSpawns(): void {
  // The Pikipek line is written but waits on sprites, since the
  // collection has drawn no Trumbeak and no finished Toucannon. Once it
  // does, mornings and days take Pikipek in base at 24, Trumbeak in
  // rare at 8 and Toucannon in elusive at 5
  registerSpawnPool(Biome.TropicalSeasonalForest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Grubbin, weight: 22 },
        { species: Species.FlabebeOrange, weight: 24 },
        { species: Species.Scatterbug, weight: 24 },
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Treecko, weight: 2 },
      ],
      uncommon: [
        { species: Species.Cutiefly, weight: 24 },
        { species: Species.Pancham, weight: 24 },
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Cherubi, weight: 22 },
      ],
      rare: [
        { species: Species.Charjabug, weight: 8 },
        { species: Species.FloetteOrange, weight: 8 },
        { species: Species.Spewpa, weight: 8 },
        { species: Species.Weepinbell, weight: 5 },
        { species: Species.Grovyle, weight: 1 },
      ],
      scarce: [
        { species: Species.Ribombee, weight: 6 },
        { species: Species.Pangoro, weight: 6 },
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Cherrim, weight: 6 },
        { species: Species.Lickilicky, weight: 6 },
      ],
      elusive: [
        { species: Species.Vikavolt, weight: 4 },
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
        { species: Species.Grubbin, weight: 22 },
        { species: Species.FlabebeOrange, weight: 24 },
        { species: Species.Scatterbug, weight: 24 },
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Treecko, weight: 2 },
      ],
      uncommon: [
        { species: Species.Cutiefly, weight: 24 },
        { species: Species.Pancham, weight: 24 },
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Cherubi, weight: 22 },
      ],
      rare: [
        { species: Species.Charjabug, weight: 8 },
        { species: Species.FloetteOrange, weight: 8 },
        { species: Species.Spewpa, weight: 8 },
        { species: Species.Weepinbell, weight: 5 },
        { species: Species.Grovyle, weight: 1 },
      ],
      scarce: [
        { species: Species.Ribombee, weight: 6 },
        { species: Species.Pangoro, weight: 6 },
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Cherrim, weight: 6 },
        { species: Species.Lickilicky, weight: 6 },
      ],
      elusive: [
        { species: Species.Vikavolt, weight: 4 },
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
      base: [{ species: Species.Rowlet, weight: 2 }],
      uncommon: [
        { species: Species.Pancham, weight: 24 },
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Cherubi, weight: 22 },
      ],
      rare: [{ species: Species.Dartrix, weight: 2 }],
      scarce: [
        { species: Species.Pangoro, weight: 6 },
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Cherrim, weight: 6 },
        { species: Species.Lickilicky, weight: 6 },
      ],
      elusive: [{ species: Species.Decidueye, weight: 2 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Rowlet, weight: 2 }],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Cherubi, weight: 22 },
      ],
      rare: [{ species: Species.Dartrix, weight: 2 }],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Cherrim, weight: 6 },
        { species: Species.Lickilicky, weight: 6 },
      ],
      elusive: [{ species: Species.Decidueye, weight: 2 }],
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
