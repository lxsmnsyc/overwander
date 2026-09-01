import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

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
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Venonat, weight: 20 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Venonat, weight: 20 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
      ],
      special: [],
    },
  });
}
