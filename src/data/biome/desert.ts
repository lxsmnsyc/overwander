import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Desert spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerDesertSpawns(): void {
  registerSpawnPool(Biome.Desert, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Trapinch, weight: 20 }],
      uncommon: [
        { species: Species.Cacnea, weight: 20 },
        { species: Species.Baltoy, weight: 22 },
        { species: Species.Diglett, weight: 20 },
        { species: Species.Magmar, weight: 5 },
      ],
      rare: [{ species: Species.Vibrava, weight: 10 }],
      scarce: [
        { species: Species.Claydol, weight: 6 },
        { species: Species.Dugtrio, weight: 10 },
      ],
      elusive: [
        { species: Species.Flygon, weight: 5 },
        { species: Species.Solrock, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Magby, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Regirock, weight: 10 },
        { species: Species.Moltres, weight: 10 },
      ],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Rhyhorn, weight: 20 },
        { species: Species.Trapinch, weight: 20 },
      ],
      uncommon: [
        { species: Species.Cacnea, weight: 20 },
        { species: Species.Baltoy, weight: 22 },
        { species: Species.Sandshrew, weight: 20 },
        { species: Species.Diglett, weight: 20 },
        { species: Species.Magmar, weight: 5 },
      ],
      rare: [
        { species: Species.Vibrava, weight: 10 },
        { species: Species.Rhydon, weight: 10 },
      ],
      scarce: [
        { species: Species.Claydol, weight: 6 },
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Dugtrio, weight: 10 },
      ],
      elusive: [
        { species: Species.Flygon, weight: 5 },
        { species: Species.Solrock, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Magby, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Regirock, weight: 10 },
        { species: Species.Moltres, weight: 10 },
      ],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Baltoy, weight: 22 },
        { species: Species.Sandshrew, weight: 20 },
        { species: Species.Diglett, weight: 20 },
        { species: Species.Magmar, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Cacturne, weight: 6 },
        { species: Species.Claydol, weight: 6 },
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Dugtrio, weight: 10 },
      ],
      elusive: [],
      prized: [...UNOWN_SPAWNS, { species: Species.Magby, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Regirock, weight: 10 },
        { species: Species.Moltres, weight: 10 },
      ],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Baltoy, weight: 22 },
        { species: Species.Diglett, weight: 20 },
        { species: Species.Cubone, weight: 20 },
        { species: Species.Magmar, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Cacturne, weight: 6 },
        { species: Species.Claydol, weight: 6 },
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Marowak, weight: 10 },
      ],
      elusive: [],
      prized: [...UNOWN_SPAWNS, { species: Species.Magby, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Regirock, weight: 10 },
        { species: Species.Moltres, weight: 10 },
      ],
    },
  });
}
