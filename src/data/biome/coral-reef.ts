import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool, registerWaterPool } from './__create';

/**
 * CoralReef spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerCoralReefSpawns(): void {
  registerSpawnPool(Biome.CoralReef, {
    [TimeOfDay.Morning]: {
      base: [],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Corphish, weight: 25 },
        { species: Species.Wingull, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.Slowpoke, weight: 20 },
      ],
      rare: [],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Pelipper, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
      ],
      elusive: [
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Slowking, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Corphish, weight: 25 },
        { species: Species.Wingull, weight: 25 },
        { species: Species.Shellos, weight: 25 },
        { species: Species.Slowpoke, weight: 20 },
      ],
      rare: [],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Pelipper, weight: 10 },
        { species: Species.Gastrodon, weight: 10 },
        { species: Species.Slowbro, weight: 10 },
      ],
      elusive: [
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Slowking, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Corphish, weight: 25 },
        { species: Species.Shellos, weight: 25 },
      ],
      rare: [],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Gastrodon, weight: 10 },
      ],
      elusive: [{ species: Species.Shuckle, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Krabby, weight: 20 },
        { species: Species.Corphish, weight: 25 },
        { species: Species.Shellos, weight: 25 },
      ],
      rare: [],
      scarce: [
        { species: Species.Kingler, weight: 10 },
        { species: Species.Crawdaunt, weight: 8 },
        { species: Species.Gastrodon, weight: 10 },
      ],
      elusive: [{ species: Species.Shuckle, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
  registerWaterPool(Biome.CoralReef, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Carvanha, weight: 20 },
        { species: Species.Clamperl, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Finneon, weight: 20 },
      ],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [
        { species: Species.Sharpedo, weight: 6 },
        { species: Species.Octillery, weight: 5 },
        { species: Species.Lumineon, weight: 6 },
      ],
      elusive: [
        { species: Species.Alomomola, weight: 7 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
        { species: Species.Luvdisc, weight: 15 },
      ],
      prized: [{ species: Species.Mantyke, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Carvanha, weight: 20 },
        { species: Species.Clamperl, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Finneon, weight: 20 },
      ],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [
        { species: Species.Sharpedo, weight: 6 },
        { species: Species.Octillery, weight: 5 },
        { species: Species.Lumineon, weight: 6 },
      ],
      elusive: [
        { species: Species.Alomomola, weight: 7 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
        { species: Species.Luvdisc, weight: 15 },
      ],
      prized: [{ species: Species.Mantyke, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Carvanha, weight: 20 },
        { species: Species.Clamperl, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Finneon, weight: 20 },
      ],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [
        { species: Species.Sharpedo, weight: 6 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Octillery, weight: 10 },
        { species: Species.Lumineon, weight: 6 },
      ],
      elusive: [
        { species: Species.Alomomola, weight: 7 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
      ],
      prized: [{ species: Species.Mantyke, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Horsea, weight: 20 }],
      uncommon: [
        { species: Species.Carvanha, weight: 20 },
        { species: Species.Clamperl, weight: 20 },
        { species: Species.Staryu, weight: 20 },
        { species: Species.Remoraid, weight: 20 },
        { species: Species.Finneon, weight: 20 },
      ],
      rare: [{ species: Species.Seadra, weight: 10 }],
      scarce: [
        { species: Species.Sharpedo, weight: 6 },
        { species: Species.Starmie, weight: 10 },
        { species: Species.Octillery, weight: 10 },
        { species: Species.Lumineon, weight: 6 },
      ],
      elusive: [
        { species: Species.Alomomola, weight: 7 },
        { species: Species.Mantine, weight: 5 },
        { species: Species.Kingdra, weight: 5 },
        { species: Species.Corsola, weight: 20 },
      ],
      prized: [{ species: Species.Mantyke, weight: PRIZED_WEIGHT }],
      special: [],
    },
  });
}
