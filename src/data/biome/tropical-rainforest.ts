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
        { species: Species.Treecko, weight: 2 },
        { species: Species.Slakoth, weight: 20 },
      ],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [
        { species: Species.Grovyle, weight: 1 },
        { species: Species.Vigoroth, weight: 10 },
      ],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Forretress, weight: 5 },
      ],
      elusive: [
        { species: Species.Sceptile, weight: 2 },
        { species: Species.Slaking, weight: 5 },
        { species: Species.Kecleon, weight: 10 },
        { species: Species.Tropius, weight: 8 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Treecko, weight: 2 },
        { species: Species.Slakoth, weight: 20 },
      ],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [
        { species: Species.Grovyle, weight: 1 },
        { species: Species.Vigoroth, weight: 10 },
      ],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Forretress, weight: 5 },
      ],
      elusive: [
        { species: Species.Sceptile, weight: 2 },
        { species: Species.Slaking, weight: 5 },
        { species: Species.Kecleon, weight: 10 },
        { species: Species.Tropius, weight: 8 },
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
        { species: Species.Shroomish, weight: 25 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Ariados, weight: 8 },
        { species: Species.Breloom, weight: 10 },
        { species: Species.Forretress, weight: 8 },
      ],
      elusive: [],
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
        { species: Species.Shroomish, weight: 25 },
        { species: Species.Aipom, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Ariados, weight: 8 },
        { species: Species.Breloom, weight: 10 },
        { species: Species.Forretress, weight: 8 },
      ],
      elusive: [],
      prized: [...UNOWN_SPAWNS],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
  });
}
