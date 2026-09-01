import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Taiga spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTaigaSpawns(): void {
  registerSpawnPool(Biome.Taiga, {
    [TimeOfDay.Morning]: {
      base: [],
      uncommon: [],
      rare: [{ species: Species.Snorlax, weight: 5 }],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [],
      uncommon: [],
      rare: [{ species: Species.Snorlax, weight: 5 }],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Vulpix, weight: 10 }],
      uncommon: [],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Snorlax, weight: 5 },
      ],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Paras, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Parasect, weight: 10 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Snorlax, weight: 5 },
      ],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
  });
}
