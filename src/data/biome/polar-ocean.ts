import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * PolarOcean spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerPolarOceanSpawns(): void {
  registerSpawnPool(Biome.PolarOcean, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Seel, weight: 20 }],
      uncommon: [],
      rare: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Lapras, weight: 5 },
      ],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Seel, weight: 20 }],
      uncommon: [],
      rare: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Lapras, weight: 5 },
      ],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Seel, weight: 20 }],
      uncommon: [],
      rare: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Lapras, weight: 5 },
      ],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Seel, weight: 20 }],
      uncommon: [],
      rare: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Lapras, weight: 5 },
      ],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
  });
}
