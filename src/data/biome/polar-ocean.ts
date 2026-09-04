import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * PolarOcean spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerPolarOceanSpawns(): void {
  registerSpawnPool(Biome.PolarOcean, {
    [TimeOfDay.Morning]: {
      base: [],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
      ],
      elusive: [{ species: Species.Lapras, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
      ],
      elusive: [{ species: Species.Lapras, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
      ],
      elusive: [{ species: Species.Lapras, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
      ],
      elusive: [{ species: Species.Lapras, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
  });
}
