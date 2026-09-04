import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * ColdDesert spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerColdDesertSpawns(): void {
  registerSpawnPool(Biome.ColdDesert, {
    [TimeOfDay.Morning]: {
      base: [{ species: Species.Geodude, weight: 20 }],
      uncommon: [
        { species: Species.Diglett, weight: 20 },
        { species: Species.Onix, weight: 10 },
      ],
      rare: [{ species: Species.Graveler, weight: 5 }],
      scarce: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Steelix, weight: 5 },
      ],
      elusive: [{ species: Species.Golem, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [{ species: Species.Geodude, weight: 20 }],
      uncommon: [
        { species: Species.Diglett, weight: 20 },
        { species: Species.Onix, weight: 10 },
      ],
      rare: [{ species: Species.Graveler, weight: 5 }],
      scarce: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Steelix, weight: 5 },
      ],
      elusive: [{ species: Species.Golem, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Geodude, weight: 20 }],
      uncommon: [
        { species: Species.Diglett, weight: 20 },
        { species: Species.Onix, weight: 10 },
        { species: Species.Gligar, weight: 5 },
      ],
      rare: [{ species: Species.Graveler, weight: 5 }],
      scarce: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Steelix, weight: 5 },
      ],
      elusive: [{ species: Species.Golem, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Geodude, weight: 20 }],
      uncommon: [
        { species: Species.Diglett, weight: 20 },
        { species: Species.Cubone, weight: 20 },
        { species: Species.Onix, weight: 10 },
        { species: Species.Gligar, weight: 5 },
      ],
      rare: [{ species: Species.Graveler, weight: 5 }],
      scarce: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Steelix, weight: 5 },
      ],
      elusive: [{ species: Species.Golem, weight: 5 }],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
