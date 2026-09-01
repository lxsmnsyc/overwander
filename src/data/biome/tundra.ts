import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Tundra spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTundraSpawns(): void {
  registerSpawnPool(Biome.Tundra, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [],
      rare: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Delibird, weight: 5 },
      ],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [],
      rare: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Delibird, weight: 5 },
      ],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [],
      rare: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Sneasel, weight: 5 },
      ],
      prized: [{ species: Species.Smoochum, weight: 10 }],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [],
      rare: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Sneasel, weight: 5 },
      ],
      prized: [{ species: Species.Smoochum, weight: 10 }],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
  });
}
