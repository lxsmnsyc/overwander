import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerIcePool, registerSpawnPool } from './__create';

/**
 * Taiga spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTaigaSpawns(): void {
  registerSpawnPool(Biome.Taiga, {
    [TimeOfDay.Morning]: {
      base: [],
      uncommon: [
        { species: Species.Stantler, weight: 5 },
        { species: Species.Snover, weight: 20 },
      ],
      rare: [{ species: Species.Ursaring, weight: 5 }],
      scarce: [{ species: Species.Abomasnow, weight: 6 }],
      elusive: [
        { species: Species.Pachirisu, weight: 8 },
        { species: Species.Snorlax, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Suicune, weight: 10 },
        { species: Species.Uxie, weight: 10 },
        { species: Species.Regice, weight: 10 },
      ],
    },
    [TimeOfDay.Day]: {
      base: [],
      uncommon: [
        { species: Species.Stantler, weight: 5 },
        { species: Species.Snover, weight: 20 },
      ],
      rare: [{ species: Species.Ursaring, weight: 5 }],
      scarce: [{ species: Species.Abomasnow, weight: 6 }],
      elusive: [
        { species: Species.Pachirisu, weight: 8 },
        { species: Species.Snorlax, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Suicune, weight: 10 },
        { species: Species.Uxie, weight: 10 },
        { species: Species.Regice, weight: 10 },
      ],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Stantler, weight: 5 },
        { species: Species.Snover, weight: 20 },
      ],
      rare: [],
      scarce: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Abomasnow, weight: 6 },
      ],
      elusive: [
        { species: Species.Pachirisu, weight: 8 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Snorlax, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Suicune, weight: 10 },
        { species: Species.Uxie, weight: 10 },
        { species: Species.Regice, weight: 10 },
      ],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Paras, weight: 20 },
        { species: Species.Stantler, weight: 5 },
        { species: Species.Snover, weight: 20 },
      ],
      rare: [],
      scarce: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Parasect, weight: 10 },
        { species: Species.Abomasnow, weight: 6 },
      ],
      elusive: [
        { species: Species.Pachirisu, weight: 8 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Snorlax, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Suicune, weight: 10 },
        { species: Species.Uxie, weight: 10 },
        { species: Species.Regice, weight: 10 },
      ],
    },
  });
  registerIcePool(Biome.Taiga, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [{ species: Species.Piloswine, weight: 5 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.Mamoswine, weight: 5 },
        { species: Species.Delibird, weight: 5 },
      ],
      special: [{ species: Species.Uxie, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [{ species: Species.Piloswine, weight: 5 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.Mamoswine, weight: 5 },
        { species: Species.Delibird, weight: 5 },
      ],
      special: [{ species: Species.Uxie, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [
        { species: Species.Seel, weight: 20 },
        { species: Species.Sneasel, weight: 5 },
      ],
      rare: [{ species: Species.Piloswine, weight: 5 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Glaceon, weight: 6 },
        { species: Species.Weavile, weight: 6 },
      ],
      elusive: [
        { species: Species.Mamoswine, weight: 5 },
        { species: Species.Delibird, weight: 5 },
      ],
      special: [{ species: Species.Uxie, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [
        { species: Species.Seel, weight: 20 },
        { species: Species.Sneasel, weight: 5 },
      ],
      rare: [{ species: Species.Piloswine, weight: 5 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Glaceon, weight: 6 },
        { species: Species.Weavile, weight: 6 },
      ],
      elusive: [
        { species: Species.Mamoswine, weight: 5 },
        { species: Species.Delibird, weight: 5 },
      ],
      special: [{ species: Species.Uxie, weight: 10 }],
    },
  });
}
