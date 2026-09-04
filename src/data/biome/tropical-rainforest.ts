import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * TropicalRainforest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTropicalRainforestSpawns(): void {
  registerSpawnPool(Biome.TropicalRainforest, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Exeggcute, weight: 20 }],
      uncommon: [],
      rare: [{ species: Species.Exeggutor, weight: 10 }],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Exeggcute, weight: 20 }],
      uncommon: [],
      rare: [{ species: Species.Exeggutor, weight: 10 }],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Exeggcute, weight: 20 }],
      uncommon: [],
      rare: [{ species: Species.Exeggutor, weight: 10 }],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Exeggcute, weight: 20 }],
      uncommon: [],
      rare: [{ species: Species.Exeggutor, weight: 10 }],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
  });
}
