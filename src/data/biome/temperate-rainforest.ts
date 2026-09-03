import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * TemperateRainforest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTemperateRainforestSpawns(): void {
  registerSpawnPool(Biome.TemperateRainforest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [{ species: Species.Weepinbell, weight: 5 }],
      rare: [
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Tangela, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [{ species: Species.Weepinbell, weight: 5 }],
      rare: [
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Tangela, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Venonat, weight: 20 },
        { species: Species.Marill, weight: 20 },
        { species: Species.Shroomish, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Breloom, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Venonat, weight: 20 },
        { species: Species.Marill, weight: 20 },
        { species: Species.Shroomish, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Breloom, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
