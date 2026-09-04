import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Taiga spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTaigaSpawns(): void {
  registerSpawnPool(Biome.Taiga, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Teddiursa, weight: 20 }],
      uncommon: [
        { species: Species.Ursaring, weight: 5 },
        { species: Species.Stantler, weight: 5 },
      ],
      rare: [{ species: Species.Snorlax, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Teddiursa, weight: 20 }],
      uncommon: [
        { species: Species.Ursaring, weight: 5 },
        { species: Species.Stantler, weight: 5 },
      ],
      rare: [{ species: Species.Snorlax, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Stantler, weight: 5 },
      ],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Snorlax, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Paras, weight: 20 },
        { species: Species.Stantler, weight: 5 },
      ],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Parasect, weight: 10 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Snorlax, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
  });
}
