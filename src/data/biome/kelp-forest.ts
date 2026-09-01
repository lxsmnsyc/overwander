import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * KelpForest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerKelpForestSpawns(): void {
  registerSpawnPool(Biome.KelpForest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Tangela, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Tangela, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Starmie, weight: 10 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Seadra, weight: 10 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Starmie, weight: 10 },
      ],
      special: [],
    },
  });
}
