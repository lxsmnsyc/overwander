import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * ColdDesert spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerColdDesertSpawns(): void {
  registerSpawnPool(Biome.ColdDesert, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Diglett, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Onix, weight: 10 },
      ],
      uncommon: [{ species: Species.Graveler, weight: 5 }],
      rare: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Golem, weight: 5 },
        { species: Species.Steelix, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Diglett, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Onix, weight: 10 },
      ],
      uncommon: [{ species: Species.Graveler, weight: 5 }],
      rare: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Golem, weight: 5 },
        { species: Species.Steelix, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Diglett, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Onix, weight: 10 },
      ],
      uncommon: [{ species: Species.Graveler, weight: 5 }],
      rare: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Golem, weight: 5 },
        { species: Species.Gligar, weight: 5 },
        { species: Species.Steelix, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Diglett, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cubone, weight: 20 },
        { species: Species.Onix, weight: 10 },
      ],
      uncommon: [{ species: Species.Graveler, weight: 5 }],
      rare: [
        { species: Species.Dugtrio, weight: 10 },
        { species: Species.Golem, weight: 5 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Gligar, weight: 5 },
        { species: Species.Steelix, weight: 5 },
      ],
      special: [],
    },
  });
}
