import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * TropicalSeasonalForest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTropicalSeasonalForestSpawns(): void {
  registerSpawnPool(Biome.TropicalSeasonalForest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Treecko, weight: 2 },
      ],
      uncommon: [{ species: Species.Exeggcute, weight: 20 }],
      rare: [
        { species: Species.Weepinbell, weight: 5 },
        { species: Species.Grovyle, weight: 1 },
      ],
      scarce: [{ species: Species.Exeggutor, weight: 10 }],
      elusive: [
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
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Treecko, weight: 2 },
      ],
      uncommon: [{ species: Species.Exeggcute, weight: 20 }],
      rare: [
        { species: Species.Weepinbell, weight: 5 },
        { species: Species.Grovyle, weight: 1 },
      ],
      scarce: [{ species: Species.Exeggutor, weight: 10 }],
      elusive: [
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Pinsir, weight: 5 },
        { species: Species.Sceptile, weight: 2 },
        { species: Species.Kecleon, weight: 10 },
        { species: Species.Tropius, weight: 8 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [{ species: Species.Exeggcute, weight: 20 }],
      rare: [],
      scarce: [{ species: Species.Exeggutor, weight: 10 }],
      elusive: [],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [{ species: Species.Exeggcute, weight: 20 }],
      rare: [],
      scarce: [{ species: Species.Exeggutor, weight: 10 }],
      elusive: [],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
