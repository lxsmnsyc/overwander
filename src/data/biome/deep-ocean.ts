import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * DeepOcean spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerDeepOceanSpawns(): void {
  registerSpawnPool(Biome.DeepOcean, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Omanyte, weight: 2 }],
      uncommon: [],
      rare: [
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Omastar, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Omanyte, weight: 2 }],
      uncommon: [],
      rare: [
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Omastar, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Omanyte, weight: 2 }],
      uncommon: [],
      rare: [
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Omastar, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Omanyte, weight: 2 }],
      uncommon: [],
      rare: [
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Omastar, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      special: [],
    },
  });
}
