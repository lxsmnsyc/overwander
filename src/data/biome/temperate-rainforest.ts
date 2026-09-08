import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * TemperateRainforest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTemperateRainforestSpawns(): void {
  registerSpawnPool(Biome.TemperateRainforest, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Bellsprout, weight: 20 }],
      uncommon: [
        { species: Species.Marill, weight: 20 },
        { species: Species.Tangela, weight: 10 },
      ],
      rare: [{ species: Species.Weepinbell, weight: 5 }],
      scarce: [{ species: Species.Azumarill, weight: 5 }],
      elusive: [{ species: Species.Victreebel, weight: 5 }],
      prized: [...UNOWN_SPAWNS, { species: Species.Azurill, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Bellsprout, weight: 20 }],
      uncommon: [
        { species: Species.Marill, weight: 20 },
        { species: Species.Tangela, weight: 10 },
      ],
      rare: [{ species: Species.Weepinbell, weight: 5 }],
      scarce: [{ species: Species.Azumarill, weight: 5 }],
      elusive: [{ species: Species.Victreebel, weight: 5 }],
      prized: [...UNOWN_SPAWNS, { species: Species.Azurill, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Venonat, weight: 20 },
        { species: Species.Marill, weight: 20 },
        { species: Species.Shroomish, weight: 25 },
      ],
      rare: [],
      scarce: [
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Breloom, weight: 10 },
      ],
      elusive: [],
      prized: [...UNOWN_SPAWNS, { species: Species.Azurill, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Venonat, weight: 20 },
        { species: Species.Marill, weight: 20 },
        { species: Species.Shroomish, weight: 25 },
      ],
      rare: [],
      scarce: [
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Breloom, weight: 10 },
      ],
      elusive: [],
      prized: [...UNOWN_SPAWNS, { species: Species.Azurill, weight: PRIZED_WEIGHT }],
      special: [],
    },
  });
}
