import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Beach spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerBeachSpawns(): void {
  registerSpawnPool(Biome.Beach, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Squirtle, weight: 2 },
        { species: Species.Psyduck, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Goldeen, weight: 20 },
      ],
      uncommon: [{ species: Species.Wartortle, weight: 1 }],
      rare: [
        { species: Species.Blastoise, weight: 2 },
        { species: Species.Golduck, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Seaking, weight: 10 },
        { species: Species.Vaporeon, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Squirtle, weight: 2 },
        { species: Species.Psyduck, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Goldeen, weight: 20 },
      ],
      uncommon: [{ species: Species.Wartortle, weight: 1 }],
      rare: [
        { species: Species.Blastoise, weight: 2 },
        { species: Species.Golduck, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Kingler, weight: 10 },
        { species: Species.Seaking, weight: 10 },
        { species: Species.Vaporeon, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Shellder, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Staryu, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Seaking, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Vaporeon, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Shellder, weight: 20 },
        { species: Species.Krabby, weight: 20 },
        { species: Species.Goldeen, weight: 20 },
        { species: Species.Staryu, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Seaking, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Vaporeon, weight: 5 },
      ],
      special: [],
    },
  });
}
