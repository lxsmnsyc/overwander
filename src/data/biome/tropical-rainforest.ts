import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * TropicalRainforest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTropicalRainforestSpawns(): void {
  registerSpawnPool(Biome.TropicalRainforest, {
    [TimeOfDay.Morning]: {
      base: [],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Forretress, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Forretress, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Spinarak, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Ariados, weight: 8 },
        { species: Species.Forretress, weight: 8 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Spinarak, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Ariados, weight: 8 },
        { species: Species.Forretress, weight: 8 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
  });
}
