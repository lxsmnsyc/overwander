import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * MontaneForest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerMontaneForestSpawns(): void {
  registerSpawnPool(Biome.MontaneForest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Mankey, weight: 20 },
        { species: Species.Teddiursa, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Primeape, weight: 10 },
        { species: Species.Heracross, weight: 5 },
        { species: Species.Stantler, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Mankey, weight: 20 },
        { species: Species.Teddiursa, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Primeape, weight: 10 },
        { species: Species.Pinsir, weight: 5 },
        { species: Species.Heracross, weight: 5 },
        { species: Species.Stantler, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Zubat, weight: 30 },
        { species: Species.Hoothoot, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Golbat, weight: 10 },
        { species: Species.Noctowl, weight: 10 },
        { species: Species.Heracross, weight: 5 },
        { species: Species.Stantler, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Zubat, weight: 30 },
        { species: Species.Paras, weight: 20 },
        { species: Species.Hoothoot, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Golbat, weight: 10 },
        { species: Species.Parasect, weight: 10 },
        { species: Species.Noctowl, weight: 10 },
        { species: Species.Heracross, weight: 5 },
        { species: Species.Stantler, weight: 5 },
      ],
      special: [],
    },
  });
}
