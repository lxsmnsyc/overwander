import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * PolarOcean spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerPolarOceanSpawns(): void {
  registerSpawnPool(Biome.PolarOcean, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Spheal, weight: 25 }],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [{ species: Species.Sealeo, weight: 8 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
      ],
      elusive: [
        { species: Species.Walrein, weight: 5 },
        { species: Species.Lapras, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Regice, weight: 10 },
        { species: Species.Articuno, weight: 10 },
      ],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Spheal, weight: 25 }],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [{ species: Species.Sealeo, weight: 8 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
      ],
      elusive: [
        { species: Species.Walrein, weight: 5 },
        { species: Species.Lapras, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Regice, weight: 10 },
        { species: Species.Articuno, weight: 10 },
      ],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Spheal, weight: 25 }],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [{ species: Species.Sealeo, weight: 8 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
      ],
      elusive: [
        { species: Species.Walrein, weight: 5 },
        { species: Species.Lapras, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Regice, weight: 10 },
        { species: Species.Articuno, weight: 10 },
      ],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Spheal, weight: 25 }],
      uncommon: [{ species: Species.Seel, weight: 20 }],
      rare: [{ species: Species.Sealeo, weight: 8 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
      ],
      elusive: [
        { species: Species.Walrein, weight: 5 },
        { species: Species.Lapras, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Regice, weight: 10 },
        { species: Species.Articuno, weight: 10 },
      ],
    },
  });
}
