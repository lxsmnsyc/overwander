import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Tundra spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTundraSpawns(): void {
  registerSpawnPool(Biome.Tundra, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [],
      rare: [{ species: Species.Piloswine, weight: 10 }],
      scarce: [{ species: Species.Dewgong, weight: 10 }],
      elusive: [{ species: Species.Delibird, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [],
      rare: [{ species: Species.Piloswine, weight: 10 }],
      scarce: [{ species: Species.Dewgong, weight: 10 }],
      elusive: [{ species: Species.Delibird, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [{ species: Species.Sneasel, weight: 5 }],
      rare: [{ species: Species.Piloswine, weight: 5 }],
      scarce: [{ species: Species.Dewgong, weight: 10 }],
      elusive: [
        { species: Species.Jynx, weight: 5 },
        { species: Species.Delibird, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [{ species: Species.Sneasel, weight: 5 }],
      rare: [{ species: Species.Piloswine, weight: 5 }],
      scarce: [{ species: Species.Dewgong, weight: 10 }],
      elusive: [
        { species: Species.Jynx, weight: 5 },
        { species: Species.Delibird, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [{ species: Species.Suicune, weight: 10 }],
    },
  });
}
