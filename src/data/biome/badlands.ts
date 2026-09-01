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
        { species: Species.Slugma, weight: 20 },
        { species: Species.Phanpy, weight: 20 },
        { species: Species.Larvitar, weight: 2 },
      ],
      uncommon: [
        { species: Species.Graveler, weight: 5 },
        { species: Species.Pupitar, weight: 1 },
      ],
      rare: [
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Arbok, weight: 10 },
        { species: Species.Primeape, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Rhyhorn, weight: 10 },
        { species: Species.Kangaskhan, weight: 5 },
        { species: Species.Tyranitar, weight: 2 },
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Skarmory, weight: 5 },
      ],
      special: [{ species: Species.Entei, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Sandshrew, weight: 20 },
        { species: Species.Ekans, weight: 20 },
        { species: Species.Mankey, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cubone, weight: 20 },
        { species: Species.Slugma, weight: 20 },
        { species: Species.Phanpy, weight: 20 },
        { species: Species.Larvitar, weight: 2 },
      ],
      uncommon: [
        { species: Species.Graveler, weight: 5 },
        { species: Species.Pupitar, weight: 1 },
      ],
      rare: [
        { species: Species.Sandslash, weight: 10 },
        { species: Species.Arbok, weight: 10 },
        { species: Species.Primeape, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Rhyhorn, weight: 10 },
        { species: Species.Kangaskhan, weight: 5 },
        { species: Species.Tyranitar, weight: 2 },
        { species: Species.Shuckle, weight: 5 },
        { species: Species.Skarmory, weight: 5 },
      ],
      special: [{ species: Species.Entei, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Zubat, weight: 30 },
        { species: Species.Ekans, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cubone, weight: 20 },
        { species: Species.Slugma, weight: 20 },
        { species: Species.Houndour, weight: 20 },
        { species: Species.Larvitar, weight: 2 },
      ],
      uncommon: [
        { species: Species.Graveler, weight: 5 },
        { species: Species.Pupitar, weight: 1 },
      ],
      rare: [
        { species: Species.Golbat, weight: 10 },
        { species: Species.Arbok, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Rhyhorn, weight: 10 },
        { species: Species.Tyranitar, weight: 2 },
        { species: Species.Shuckle, weight: 5 },
      ],
      special: [{ species: Species.Entei, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Zubat, weight: 30 },
        { species: Species.Ekans, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cubone, weight: 20 },
        { species: Species.Slugma, weight: 20 },
        { species: Species.Houndour, weight: 20 },
        { species: Species.Larvitar, weight: 2 },
      ],
      uncommon: [
        { species: Species.Graveler, weight: 5 },
        { species: Species.Pupitar, weight: 1 },
      ],
      rare: [
        { species: Species.Golbat, weight: 10 },
        { species: Species.Marowak, weight: 10 },
        { species: Species.Rhydon, weight: 5 },
        { species: Species.Kangaskhan, weight: 5 },
        { species: Species.Tyranitar, weight: 2 },
        { species: Species.Shuckle, weight: 5 },
      ],
      special: [{ species: Species.Entei, weight: 10 }],
    },
  });
}
