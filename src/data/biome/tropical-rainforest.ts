import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * TropicalRainforest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTropicalRainforestSpawns(): void {
  registerSpawnPool(Biome.TropicalRainforest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Treecko, weight: 2 },
        { species: Species.Slakoth, weight: 20 },
      ],
      uncommon: [
        { species: Species.Grovyle, weight: 1 },
        { species: Species.Vigoroth, weight: 10 },
      ],
      rare: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
        { species: Species.Sceptile, weight: 2 },
        { species: Species.Slaking, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Treecko, weight: 2 },
        { species: Species.Slakoth, weight: 20 },
      ],
      uncommon: [
        { species: Species.Grovyle, weight: 1 },
        { species: Species.Vigoroth, weight: 10 },
      ],
      rare: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
        { species: Species.Sceptile, weight: 2 },
        { species: Species.Slaking, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Spinarak, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Shroomish, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Ariados, weight: 8 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
        { species: Species.Breloom, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Spinarak, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Shroomish, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Ariados, weight: 8 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
        { species: Species.Breloom, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Mew, weight: 10 }],
    },
  });
}
