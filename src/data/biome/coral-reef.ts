import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * CoralReef spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerCoralReefSpawns(): void {
  registerSpawnPool(Biome.CoralReef, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [{ species: Species.Remoraid, weight: 20 }],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [{ species: Species.Octillery, weight: 5 }],
      elusive: [
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [{ species: Species.Remoraid, weight: 20 }],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [{ species: Species.Octillery, weight: 5 }],
      elusive: [
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Staryu, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [
        { species: Species.Starmie, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      elusive: [
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Staryu, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [
        { species: Species.Starmie, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      elusive: [
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
