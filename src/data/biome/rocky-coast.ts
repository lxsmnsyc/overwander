import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * RockyCoast spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerRockyCoastSpawns(): void {
  registerSpawnPool(Biome.RockyCoast, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wingull, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Pelipper, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Slowpoke, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wingull, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
        { species: Species.Pelipper, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Shellder, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Cloyster, weight: 10 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Qwilfish, weight: 15 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
