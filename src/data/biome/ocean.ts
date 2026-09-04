import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Ocean spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerOceanSpawns(): void {
  registerSpawnPool(Biome.Ocean, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Dratini, weight: 2 },
      ],
      uncommon: [
        { species: Species.Carvanha, weight: 20 },
        { species: Species.Wailmer, weight: 15 },
        { species: Species.Clamperl, weight: 20 },
        { species: Species.Tentacool, weight: 30 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      rare: [
        { species: Species.Dragonair, weight: 1 },
        { species: Species.Seadra, weight: 10 },
      ],
      scarce: [
        { species: Species.Sharpedo, weight: 6 },
        { species: Species.Wailord, weight: 4 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Vaporeon, weight: 5 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      elusive: [
        { species: Species.Blastoise, weight: 2 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Relicanth, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Latias, weight: 10 },
        { species: Species.Latios, weight: 10 },
        { species: Species.Lugia, weight: 10 },
      ],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Dratini, weight: 2 },
      ],
      uncommon: [
        { species: Species.Carvanha, weight: 20 },
        { species: Species.Wailmer, weight: 15 },
        { species: Species.Clamperl, weight: 20 },
        { species: Species.Tentacool, weight: 30 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      rare: [
        { species: Species.Dragonair, weight: 1 },
        { species: Species.Seadra, weight: 10 },
      ],
      scarce: [
        { species: Species.Sharpedo, weight: 6 },
        { species: Species.Wailord, weight: 4 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Vaporeon, weight: 5 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      elusive: [
        { species: Species.Blastoise, weight: 2 },
        { species: Species.Lapras, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Relicanth, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Latias, weight: 10 },
        { species: Species.Latios, weight: 10 },
        { species: Species.Lugia, weight: 10 },
      ],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Dratini, weight: 2 },
      ],
      uncommon: [
        { species: Species.Carvanha, weight: 20 },
        { species: Species.Wailmer, weight: 15 },
        { species: Species.Clamperl, weight: 20 },
        { species: Species.Tentacool, weight: 30 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      rare: [
        { species: Species.Dragonair, weight: 1 },
        { species: Species.Seadra, weight: 10 },
      ],
      scarce: [
        { species: Species.Sharpedo, weight: 6 },
        { species: Species.Wailord, weight: 4 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Vaporeon, weight: 5 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      elusive: [
        { species: Species.Lapras, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Latias, weight: 10 },
        { species: Species.Latios, weight: 10 },
        { species: Species.Lugia, weight: 10 },
      ],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Dratini, weight: 2 },
      ],
      uncommon: [
        { species: Species.Carvanha, weight: 20 },
        { species: Species.Wailmer, weight: 15 },
        { species: Species.Clamperl, weight: 20 },
        { species: Species.Tentacool, weight: 30 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Chinchou, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
      ],
      rare: [
        { species: Species.Dragonair, weight: 1 },
        { species: Species.Seadra, weight: 10 },
      ],
      scarce: [
        { species: Species.Sharpedo, weight: 6 },
        { species: Species.Wailord, weight: 4 },
        { species: Species.Tentacruel, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Vaporeon, weight: 5 },
        { species: Species.Lanturn, weight: 10 },
        { species: Species.Octillery, weight: 10 },
      ],
      elusive: [
        { species: Species.Lapras, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Latias, weight: 10 },
        { species: Species.Latios, weight: 10 },
        { species: Species.Lugia, weight: 10 },
      ],
    },
  });
}
