import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Mangrove spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerMangroveSpawns(): void {
  registerSpawnPool(Biome.Mangrove, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Totodile, weight: 2 },
        { species: Species.Wooper, weight: 25 },
      ],
      uncommon: [{ species: Species.Croconaw, weight: 1 }],
      rare: [
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Farfetchd, weight: 5 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Feraligatr, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Totodile, weight: 2 },
        { species: Species.Wooper, weight: 25 },
      ],
      uncommon: [{ species: Species.Croconaw, weight: 1 }],
      rare: [
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Farfetchd, weight: 5 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Feraligatr, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
      ],
      uncommon: [],
      rare: [{ species: Species.Kingler, weight: 10 }],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
      ],
      uncommon: [],
      rare: [{ species: Species.Kingler, weight: 10 }],
      special: [],
    },
  });
}
