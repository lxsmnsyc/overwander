import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * TropicalSeasonalForest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTropicalSeasonalForestSpawns(): void {
  registerSpawnPool(Biome.TropicalSeasonalForest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Exeggcute, weight: 20 },
      ],
      uncommon: [{ species: Species.Weepinbell, weight: 5 }],
      rare: [
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Exeggutor, weight: 10 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Exeggcute, weight: 20 },
      ],
      uncommon: [{ species: Species.Weepinbell, weight: 5 }],
      rare: [
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Pinsir, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Exeggcute, weight: 20 }],
      uncommon: [],
      rare: [{ species: Species.Exeggutor, weight: 10 }],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Exeggcute, weight: 20 }],
      uncommon: [],
      rare: [{ species: Species.Exeggutor, weight: 10 }],
      special: [],
    },
  });
}
