import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Steppe spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerSteppeSpawns(): void {
  registerSpawnPool(Biome.Steppe, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Spearow, weight: 20 },
        { species: Species.Growlithe, weight: 10 },
        { species: Species.Ponyta, weight: 10 },
        { species: Species.Doduo, weight: 20 },
        { species: Species.Sentret, weight: 25 },
        { species: Species.Mareep, weight: 25 },
      ],
      uncommon: [
        { species: Species.Magnemite, weight: 20 },
        { species: Species.Voltorb, weight: 20 },
      ],
      rare: [
        { species: Species.Fearow, weight: 10 },
        { species: Species.Arcanine, weight: 5 },
        { species: Species.Rapidash, weight: 10 },
        { species: Species.Dodrio, weight: 10 },
        { species: Species.Kangaskhan, weight: 5 },
        { species: Species.Tauros, weight: 10 },
        { species: Species.Magneton, weight: 10 },
        { species: Species.Electrode, weight: 10 },
        { species: Species.Furret, weight: 10 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Spearow, weight: 20 },
        { species: Species.Ekans, weight: 20 },
        { species: Species.Growlithe, weight: 10 },
        { species: Species.Ponyta, weight: 10 },
        { species: Species.Doduo, weight: 20 },
        { species: Species.Sentret, weight: 25 },
        { species: Species.Mareep, weight: 25 },
      ],
      uncommon: [
        { species: Species.Magnemite, weight: 20 },
        { species: Species.Voltorb, weight: 20 },
      ],
      rare: [
        { species: Species.Fearow, weight: 10 },
        { species: Species.Arbok, weight: 10 },
        { species: Species.Arcanine, weight: 5 },
        { species: Species.Rapidash, weight: 10 },
        { species: Species.Dodrio, weight: 10 },
        { species: Species.Kangaskhan, weight: 5 },
        { species: Species.Tauros, weight: 10 },
        { species: Species.Magneton, weight: 10 },
        { species: Species.Electrode, weight: 10 },
        { species: Species.Furret, weight: 10 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Ekans, weight: 20 }],
      uncommon: [
        { species: Species.Magnemite, weight: 20 },
        { species: Species.Voltorb, weight: 20 },
      ],
      rare: [
        { species: Species.Arbok, weight: 10 },
        { species: Species.Magneton, weight: 10 },
        { species: Species.Electrode, weight: 10 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Ekans, weight: 20 }],
      uncommon: [
        { species: Species.Magnemite, weight: 20 },
        { species: Species.Voltorb, weight: 20 },
      ],
      rare: [
        { species: Species.Arbok, weight: 10 },
        { species: Species.Magneton, weight: 10 },
        { species: Species.Electrode, weight: 10 },
      ],
      special: [],
    },
  });
}
