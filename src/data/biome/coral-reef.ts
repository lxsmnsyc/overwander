import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * CoralReef spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerCoralReefSpawns(): void {
  registerSpawnPool(Biome.CoralReef, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      uncommon: [],
      rare: [{ species: Species.Seadra, weight: 10 }],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      uncommon: [],
      rare: [{ species: Species.Seadra, weight: 10 }],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Starmie, weight: 10 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Starmie, weight: 10 },
      ],
      special: [],
    },
  });
}
