import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool, registerWaterPool } from './__create';

/**
 * TropicalRainforest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTropicalRainforestSpawns(): void {
  // The Pikipek line is written but waits on sprites, since the
  // collection has drawn no Trumbeak and no finished Toucannon. Once it
  // does, mornings and days take Pikipek in base at 24, Trumbeak in
  // rare at 8 and Toucannon in elusive at 5
  registerSpawnPool(Biome.TropicalRainforest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Grubbin, weight: 22 },
        { species: Species.Scatterbug, weight: 24 },
        { species: Species.Treecko, weight: 2 },
        { species: Species.Slakoth, weight: 20 },
      ],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [
        { species: Species.Charjabug, weight: 8 },
        { species: Species.Spewpa, weight: 8 },
        { species: Species.Grovyle, weight: 1 },
        { species: Species.Vigoroth, weight: 10 },
      ],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Forretress, weight: 5 },
        { species: Species.Ambipom, weight: 6 },
        { species: Species.Yanmega, weight: 6 },
        { species: Species.Tangrowth, weight: 6 },
      ],
      elusive: [
        { species: Species.OricorioSensu, weight: 5 },
        { species: Species.Vikavolt, weight: 4 },
        { species: Species.Hawlucha, weight: 6 },
        { species: Species.Vivillon, weight: 5 },
        { species: Species.Carnivine, weight: 6 },
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
        { species: Species.Grubbin, weight: 22 },
        { species: Species.Scatterbug, weight: 24 },
        { species: Species.Treecko, weight: 2 },
        { species: Species.Slakoth, weight: 20 },
      ],
      uncommon: [
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [
        { species: Species.Charjabug, weight: 8 },
        { species: Species.Spewpa, weight: 8 },
        { species: Species.Grovyle, weight: 1 },
        { species: Species.Vigoroth, weight: 10 },
      ],
      scarce: [
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Forretress, weight: 5 },
        { species: Species.Ambipom, weight: 6 },
        { species: Species.Yanmega, weight: 6 },
        { species: Species.Tangrowth, weight: 6 },
      ],
      elusive: [
        { species: Species.OricorioSensu, weight: 5 },
        { species: Species.Vikavolt, weight: 4 },
        { species: Species.Hawlucha, weight: 6 },
        { species: Species.Vivillon, weight: 5 },
        { species: Species.Carnivine, weight: 6 },
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
      base: [{ species: Species.Rowlet, weight: 2 }],
      uncommon: [
        { species: Species.Noibat, weight: 24 },
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Spinarak, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Shroomish, weight: 25 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [{ species: Species.Dartrix, weight: 2 }],
      scarce: [
        { species: Species.Noivern, weight: 6 },
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Ariados, weight: 8 },
        { species: Species.Breloom, weight: 10 },
        { species: Species.Forretress, weight: 8 },
        { species: Species.Ambipom, weight: 6 },
        { species: Species.Yanmega, weight: 6 },
        { species: Species.Tangrowth, weight: 6 },
      ],
      elusive: [
        { species: Species.Decidueye, weight: 2 },
        { species: Species.Hawlucha, weight: 6 },
        { species: Species.Carnivine, weight: 6 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Rowlet, weight: 2 }],
      uncommon: [
        { species: Species.Noibat, weight: 24 },
        { species: Species.Exeggcute, weight: 20 },
        { species: Species.Spinarak, weight: 20 },
        { species: Species.Pineco, weight: 20 },
        { species: Species.Shroomish, weight: 25 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [{ species: Species.Dartrix, weight: 2 }],
      scarce: [
        { species: Species.Noivern, weight: 6 },
        { species: Species.Exeggutor, weight: 10 },
        { species: Species.Ariados, weight: 8 },
        { species: Species.Breloom, weight: 10 },
        { species: Species.Forretress, weight: 8 },
        { species: Species.Ambipom, weight: 6 },
        { species: Species.Yanmega, weight: 6 },
        { species: Species.Tangrowth, weight: 6 },
      ],
      elusive: [
        { species: Species.Decidueye, weight: 2 },
        { species: Species.Carnivine, weight: 6 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
      mythical: [{ species: Species.Mew, weight: 10 }],
    },
  });
  registerWaterPool(Biome.TropicalRainforest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Lotad, weight: 20 },
        { species: Species.Mudkip, weight: 2 },
      ],
      uncommon: [
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Barboach, weight: 25 },
        { species: Species.Surskit, weight: 25 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [
        { species: Species.Lombre, weight: 10 },
        { species: Species.Marshtomp, weight: 1 },
      ],
      scarce: [
        { species: Species.Whiscash, weight: 8 },
        { species: Species.Yanmega, weight: 6 },
        { species: Species.Masquerain, weight: 10 },
        { species: Species.Gyarados, weight: 4 },
      ],
      elusive: [
        { species: Species.Ludicolo, weight: 5 },
        { species: Species.Swampert, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Lotad, weight: 20 },
        { species: Species.Mudkip, weight: 2 },
      ],
      uncommon: [
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Barboach, weight: 25 },
        { species: Species.Surskit, weight: 25 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [
        { species: Species.Lombre, weight: 10 },
        { species: Species.Marshtomp, weight: 1 },
      ],
      scarce: [
        { species: Species.Whiscash, weight: 8 },
        { species: Species.Yanmega, weight: 6 },
        { species: Species.Masquerain, weight: 10 },
        { species: Species.Gyarados, weight: 4 },
      ],
      elusive: [
        { species: Species.Ludicolo, weight: 5 },
        { species: Species.Swampert, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Poliwag, weight: 20 }],
      uncommon: [
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Barboach, weight: 25 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Whiscash, weight: 8 },
        { species: Species.Yanmega, weight: 6 },
        { species: Species.Gyarados, weight: 4 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Poliwag, weight: 20 }],
      uncommon: [
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Barboach, weight: 25 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [],
      scarce: [
        { species: Species.Whiscash, weight: 8 },
        { species: Species.Yanmega, weight: 6 },
        { species: Species.Gyarados, weight: 4 },
      ],
      special: [],
    },
  });
}
