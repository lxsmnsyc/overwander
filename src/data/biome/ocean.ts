import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Ocean spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerOceanSpawns(): void {
  registerSpawnPool(Biome.Ocean, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Tentacool, weight: 30 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Horsea, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Dratini, weight: 2 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Corsola, weight: 20 },
      ],
      uncommon: [{ species: Species.Dragonair, weight: 1 }],
      rare: [
        { species: Species.Blastoise, weight: 2 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Seadra, weight: 10 },
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Vaporeon, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Tentacool, weight: 30 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Horsea, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Dratini, weight: 2 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Corsola, weight: 20 },
      ],
      uncommon: [{ species: Species.Dragonair, weight: 1 }],
      rare: [
        { species: Species.Blastoise, weight: 2 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Seadra, weight: 10 },
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Vaporeon, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Tentacool, weight: 30 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Horsea, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Dratini, weight: 2 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Corsola, weight: 20 },
      ],
      uncommon: [{ species: Species.Dragonair, weight: 1 }],
      rare: [
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Seadra, weight: 10 },
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Vaporeon, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Tentacool, weight: 30 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Horsea, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Dratini, weight: 2 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Corsola, weight: 20 },
      ],
      uncommon: [{ species: Species.Dragonair, weight: 1 }],
      rare: [
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Seadra, weight: 10 },
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Vaporeon, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      special: [],
    },
  });
}
