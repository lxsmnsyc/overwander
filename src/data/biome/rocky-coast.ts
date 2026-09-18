import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool, registerWaterPool } from './__create';

/**
 * RockyCoast spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerRockyCoastSpawns(): void {
  registerSpawnPool(Biome.RockyCoast, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Oshawott, weight: 3 },
        { species: Species.Piplup, weight: 3 },
      ],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Wingull, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.BurmySandy, weight: 20 },
        { species: Species.Buizel, weight: 25 },
      ],
      rare: [
        { species: Species.Dewott, weight: 2 },
        { species: Species.Prinplup, weight: 2 },
      ],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Pelipper, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.WormadamSandy, weight: 4 },
        { species: Species.Floatzel, weight: 8 },
      ],
      elusive: [
        { species: Species.Samurott, weight: 2 },
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Empoleon, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Oshawott, weight: 3 },
        { species: Species.Piplup, weight: 3 },
      ],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Wingull, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.BurmySandy, weight: 20 },
        { species: Species.Buizel, weight: 25 },
      ],
      rare: [
        { species: Species.Dewott, weight: 2 },
        { species: Species.Prinplup, weight: 2 },
      ],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Pelipper, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.WormadamSandy, weight: 4 },
        { species: Species.Floatzel, weight: 8 },
      ],
      elusive: [
        { species: Species.Samurott, weight: 2 },
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Empoleon, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.BurmySandy, weight: 20 },
        { species: Species.Buizel, weight: 25 },
      ],
      rare: [],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.WormadamSandy, weight: 4 },
        { species: Species.Floatzel, weight: 8 },
      ],
      elusive: [{ species: Species.Shuckle, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.BurmySandy, weight: 20 },
        { species: Species.Buizel, weight: 25 },
      ],
      rare: [],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.WormadamSandy, weight: 4 },
        { species: Species.Floatzel, weight: 8 },
      ],
      elusive: [{ species: Species.Shuckle, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
  registerWaterPool(Biome.RockyCoast, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Oshawott, weight: 3 },
        { species: Species.Horsea, weight: 10 },
      ],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
      ],
      rare: [
        { species: Species.Dewott, weight: 2 },
        { species: Species.Seadra, weight: 5 },
      ],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Tentacruel, weight: 8 },
        { species: Species.Octillery, weight: 8 },
      ],
      elusive: [
        { species: Species.Samurott, weight: 2 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Corsola, weight: 10 },
        { species: Species.Kingdra, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Oshawott, weight: 3 },
        { species: Species.Horsea, weight: 10 },
      ],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
      ],
      rare: [
        { species: Species.Dewott, weight: 2 },
        { species: Species.Seadra, weight: 5 },
      ],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Tentacruel, weight: 8 },
        { species: Species.Octillery, weight: 8 },
      ],
      elusive: [
        { species: Species.Samurott, weight: 2 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Corsola, weight: 10 },
        { species: Species.Kingdra, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Horsea, weight: 10 }],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
      ],
      rare: [{ species: Species.Seadra, weight: 5 }],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Tentacruel, weight: 8 },
        { species: Species.Octillery, weight: 8 },
        { species: Species.Starmie, weight: 10 },
      ],
      elusive: [
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Corsola, weight: 10 },
        { species: Species.Kingdra, weight: 2 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Horsea, weight: 10 }],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
      ],
      rare: [{ species: Species.Seadra, weight: 5 }],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Tentacruel, weight: 8 },
        { species: Species.Octillery, weight: 8 },
        { species: Species.Starmie, weight: 10 },
      ],
      elusive: [
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Corsola, weight: 10 },
        { species: Species.Kingdra, weight: 2 },
      ],
      special: [],
    },
  });
}
