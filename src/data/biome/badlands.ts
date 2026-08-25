import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Badlands spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerBadlandsSpawns(): void {
  registerSpawnPool(Biome.Badlands, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Sandshrew, weight: 20 },
        { species: Species.Ekans, weight: 20 },
        { species: Species.Mankey, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cubone, weight: 20 },
      ],
      uncommon: [{ species: Species.Graveler, weight: 5 }],
      rare: [
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Arbok, weight: 10 },
        { species: Species.Primeape, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Rhyhorn, weight: 10 },
        { species: Species.Kangaskhan, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Sandshrew, weight: 20 },
        { species: Species.Ekans, weight: 20 },
        { species: Species.Mankey, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cubone, weight: 20 },
      ],
      uncommon: [{ species: Species.Graveler, weight: 5 }],
      rare: [
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Arbok, weight: 10 },
        { species: Species.Primeape, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Rhyhorn, weight: 10 },
        { species: Species.Kangaskhan, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Zubat, weight: 30 },
        { species: Species.Ekans, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cubone, weight: 20 },
      ],
      uncommon: [{ species: Species.Graveler, weight: 5 }],
      rare: [
        { species: Species.Golbat, weight: 10 },
        { species: Species.Arbok, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Rhyhorn, weight: 10 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Zubat, weight: 30 },
        { species: Species.Ekans, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cubone, weight: 20 },
      ],
      uncommon: [{ species: Species.Graveler, weight: 5 }],
      rare: [
        { species: Species.Golbat, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Rhydon, weight: 5 },
        { species: Species.Kangaskhan, weight: 5 },
      ],
      special: [],
    },
  });
}
