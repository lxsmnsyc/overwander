import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Swamp spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerSwampSpawns(): void {
  registerSpawnPool(Biome.Swamp, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Squirtle, weight: 2 },
        { species: Species.Psyduck, weight: 20 },
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Totodile, weight: 2 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [
        { species: Species.Wartortle, weight: 1 },
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Croconaw, weight: 1 },
      ],
      rare: [
        { species: Species.Golduck, weight: 10 },
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Farfetchd, weight: 5 },
        { species: Species.Lickitung, weight: 5 },
        { species: Species.Seaking, weight: 10 },
        { species: Species.Feraligatr, weight: 2 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Squirtle, weight: 2 },
        { species: Species.Psyduck, weight: 20 },
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Totodile, weight: 2 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [
        { species: Species.Wartortle, weight: 1 },
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Croconaw, weight: 1 },
      ],
      rare: [
        { species: Species.Golduck, weight: 10 },
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Farfetchd, weight: 5 },
        { species: Species.Lickitung, weight: 5 },
        { species: Species.Seaking, weight: 10 },
        { species: Species.Feraligatr, weight: 2 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [{ species: Species.Poliwhirl, weight: 5 }],
      rare: [
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Seaking, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Grimer, weight: 20 },
        { species: Species.Koffing, weight: 20 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [{ species: Species.Poliwhirl, weight: 5 }],
      rare: [
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Muk, weight: 10 },
        { species: Species.Weezing, weight: 10 },
        { species: Species.Seaking, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      special: [],
    },
  });
}
