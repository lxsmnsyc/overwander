import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * KelpForest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerKelpForestSpawns(): void {
  registerSpawnPool(Biome.KelpForest, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Tangela, weight: 5 },
      ],
      rare: [
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Tangela, weight: 5 },
      ],
      rare: [
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      rare: [
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      rare: [
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
