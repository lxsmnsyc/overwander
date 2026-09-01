import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Desert spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerDesertSpawns(): void {
  registerSpawnPool(Biome.Desert, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Diglett, weight: 20 }],
      uncommon: [],
      rare: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Magmar, weight: 5 },
      ],
      prized: [{ species: Species.Magby, weight: 10 }],
      special: [{ species: Species.Moltres, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Sandshrew, weight: 20 },
        { species: Species.Diglett, weight: 20 },
        { species: Species.Rhyhorn, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Rhydon, weight: 10 },
        { species: Species.Magmar, weight: 5 },
      ],
      prized: [{ species: Species.Magby, weight: 10 }],
      special: [{ species: Species.Moltres, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Sandshrew, weight: 20 },
        { species: Species.Diglett, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Magmar, weight: 5 },
      ],
      prized: [{ species: Species.Magby, weight: 10 }],
      special: [{ species: Species.Moltres, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Diglett, weight: 20 },
        { species: Species.Cubone, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Magmar, weight: 5 },
      ],
      prized: [{ species: Species.Magby, weight: 10 }],
      special: [{ species: Species.Moltres, weight: 10 }],
    },
  });
}
