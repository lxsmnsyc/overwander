import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * RockyCoast spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerRockyCoastSpawns(): void {
  registerSpawnPool(Biome.RockyCoast, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Piplup, weight: 3 }],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wingull, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.BurmySandy, weight: 20 },
      ],
      rare: [{ species: Species.Prinplup, weight: 2 }],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Pelipper, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.WormadamSandy, weight: 4 },
      ],
      elusive: [
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Empoleon, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Piplup, weight: 3 }],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wingull, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.BurmySandy, weight: 20 },
      ],
      rare: [{ species: Species.Prinplup, weight: 2 }],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Pelipper, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.WormadamSandy, weight: 4 },
      ],
      elusive: [
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Empoleon, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.BurmySandy, weight: 20 },
      ],
      rare: [],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.WormadamSandy, weight: 4 },
      ],
      elusive: [
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.BurmySandy, weight: 20 },
      ],
      rare: [],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.WormadamSandy, weight: 4 },
      ],
      elusive: [
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
