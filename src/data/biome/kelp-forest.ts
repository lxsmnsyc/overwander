import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool, registerWaterPool } from './__create';

/**
 * KelpForest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerKelpForestSpawns(): void {
  registerSpawnPool(Biome.KelpForest, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Oshawott, weight: 3 }],
      uncommon: [{ species: Species.Tangela, weight: 5 }],
      rare: [{ species: Species.Dewott, weight: 2 }],
      scarce: [],
      elusive: [{ species: Species.Samurott, weight: 2 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Oshawott, weight: 3 }],
      uncommon: [{ species: Species.Tangela, weight: 5 }],
      rare: [{ species: Species.Dewott, weight: 2 }],
      scarce: [],
      elusive: [{ species: Species.Samurott, weight: 2 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [],
      rare: [],
      scarce: [],
      elusive: [],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [],
      rare: [],
      scarce: [],
      elusive: [],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
  registerWaterPool(Biome.KelpForest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Oshawott, weight: 3 },
        { species: Species.Horsea, weight: 20 },
      ],
      uncommon: [
        { species: Species.Skrelp, weight: 24 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Finneon, weight: 20 },
      ],
      rare: [
        { species: Species.Dewott, weight: 2 },
        { species: Species.Seadra, weight: 10 },
      ],
      scarce: [
        { species: Species.Dragalge, weight: 6 },
        { species: Species.Milotic, weight: 3 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
        { species: Species.Lumineon, weight: 6 },
      ],
      elusive: [
        { species: Species.Samurott, weight: 2 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [{ species: Species.Mantyke, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Oshawott, weight: 3 },
        { species: Species.Horsea, weight: 20 },
      ],
      uncommon: [
        { species: Species.Skrelp, weight: 24 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Finneon, weight: 20 },
      ],
      rare: [
        { species: Species.Dewott, weight: 2 },
        { species: Species.Seadra, weight: 10 },
      ],
      scarce: [
        { species: Species.Dragalge, weight: 6 },
        { species: Species.Milotic, weight: 3 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
        { species: Species.Lumineon, weight: 6 },
      ],
      elusive: [
        { species: Species.Samurott, weight: 2 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [{ species: Species.Mantyke, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Finneon, weight: 20 },
      ],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [
        { species: Species.Milotic, weight: 3 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
        { species: Species.Lumineon, weight: 6 },
      ],
      elusive: [
        { species: Species.Mantine, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [{ species: Species.Mantyke, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Finneon, weight: 20 },
      ],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [
        { species: Species.Milotic, weight: 3 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
        { species: Species.Lumineon, weight: 6 },
      ],
      elusive: [
        { species: Species.Mantine, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [{ species: Species.Mantyke, weight: PRIZED_WEIGHT }],
      special: [],
    },
  });
}
