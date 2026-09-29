import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool, registerWaterPool } from './__create';

/**
 * Mangrove spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerMangroveSpawns(): void {
  registerSpawnPool(Biome.Mangrove, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.FlabebeBlue, weight: 24 },
        { species: Species.Totodile, weight: 2 },
        { species: Species.Lotad, weight: 20 },
      ],
      uncommon: [
        { species: Species.Corphish, weight: 25 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.Croagunk, weight: 20 },
      ],
      rare: [
        { species: Species.FloetteBlue, weight: 8 },
        { species: Species.Croconaw, weight: 1 },
        { species: Species.Lombre, weight: 10 },
      ],
      scarce: [
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Slowking, weight: 5 },
        { species: Species.Quagsire, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.Toxicroak, weight: 6 },
      ],
      elusive: [
        { species: Species.FlorgesBlue, weight: 5 },
        { species: Species.Carnivine, weight: 6 },
        { species: Species.Farfetchd, weight: 5 },
        { species: Species.Feraligatr, weight: 2 },
        { species: Species.Ludicolo, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.FlabebeBlue, weight: 24 },
        { species: Species.Totodile, weight: 2 },
        { species: Species.Lotad, weight: 20 },
      ],
      uncommon: [
        { species: Species.Corphish, weight: 25 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.Croagunk, weight: 20 },
      ],
      rare: [
        { species: Species.FloetteBlue, weight: 8 },
        { species: Species.Croconaw, weight: 1 },
        { species: Species.Lombre, weight: 10 },
      ],
      scarce: [
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Slowking, weight: 5 },
        { species: Species.Quagsire, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.Toxicroak, weight: 6 },
      ],
      elusive: [
        { species: Species.FlorgesBlue, weight: 5 },
        { species: Species.Carnivine, weight: 6 },
        { species: Species.Farfetchd, weight: 5 },
        { species: Species.Feraligatr, weight: 2 },
        { species: Species.Ludicolo, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Corphish, weight: 25 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.Croagunk, weight: 20 },
      ],
      rare: [],
      scarce: [
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Quagsire, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.Toxicroak, weight: 6 },
      ],
      elusive: [{ species: Species.Carnivine, weight: 6 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Corphish, weight: 25 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.Croagunk, weight: 20 },
      ],
      rare: [],
      scarce: [
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Quagsire, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.Toxicroak, weight: 6 },
      ],
      elusive: [{ species: Species.Carnivine, weight: 6 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
  registerWaterPool(Biome.Mangrove, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Totodile, weight: 2 },
        { species: Species.Lotad, weight: 20 },
      ],
      uncommon: [
        { species: Species.Corphish, weight: 25 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Shellos, weight: 25 },
      ],
      rare: [
        { species: Species.Croconaw, weight: 1 },
        { species: Species.Lombre, weight: 10 },
      ],
      scarce: [
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Slowking, weight: 5 },
        { species: Species.Quagsire, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
      ],
      elusive: [
        { species: Species.Feraligatr, weight: 2 },
        { species: Species.Ludicolo, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Totodile, weight: 2 },
        { species: Species.Lotad, weight: 20 },
      ],
      uncommon: [
        { species: Species.Corphish, weight: 25 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Shellos, weight: 25 },
      ],
      rare: [
        { species: Species.Croconaw, weight: 1 },
        { species: Species.Lombre, weight: 10 },
      ],
      scarce: [
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Slowking, weight: 5 },
        { species: Species.Quagsire, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
      ],
      elusive: [
        { species: Species.Feraligatr, weight: 2 },
        { species: Species.Ludicolo, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Corphish, weight: 25 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Shellos, weight: 25 },
      ],
      rare: [],
      scarce: [
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Quagsire, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
      ],
      elusive: [],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Corphish, weight: 25 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Shellos, weight: 25 },
      ],
      rare: [],
      scarce: [
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Quagsire, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
      ],
      elusive: [],
      special: [],
    },
  });
}
