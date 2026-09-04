import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Desert spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerDesertSpawns(): void {
  registerSpawnPool(Biome.Desert, {
    [TimeOfDay.Morning]: {
      base: [],
      uncommon: [
        { species: Species.Magmar, weight: 5 },
        { species: Species.Diglett, weight: 20 },
      ],
      rare: [{ species: Species.Dugtrio, weight: 10 }],
      prized: [...UNOWN_SPAWNS, { species: Species.Magby, weight: PRIZED_WEIGHT }],
      special: [{ species: Species.Moltres, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Rhyhorn, weight: 20 }],
      uncommon: [
        { species: Species.Rhydon, weight: 10 },
        { species: Species.Magmar, weight: 5 },
        { species: Species.Sandshrew, weight: 20 },
        { species: Species.Diglett, weight: 20 },
      ],
      rare: [
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Dugtrio, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Magby, weight: PRIZED_WEIGHT }],
      special: [{ species: Species.Moltres, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Magmar, weight: 5 },
        { species: Species.Sandshrew, weight: 20 },
        { species: Species.Diglett, weight: 20 },
      ],
      rare: [
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Dugtrio, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Magby, weight: PRIZED_WEIGHT }],
      special: [{ species: Species.Moltres, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Magmar, weight: 5 },
        { species: Species.Diglett, weight: 20 },
        { species: Species.Cubone, weight: 20 },
      ],
      rare: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Marowak, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Magby, weight: PRIZED_WEIGHT }],
      special: [{ species: Species.Moltres, weight: 10 }],
    },
  });
}
