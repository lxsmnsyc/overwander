import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

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
        { species: Species.Phanpy, weight: 20 },
        { species: Species.Magnemite, weight: 20 },
        { species: Species.Voltorb, weight: 20 },
      ],
      uncommon: [],
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
        { species: Species.Miltank, weight: 5 },
        { species: Species.Dunsparce, weight: 10 },
        { species: Species.Girafarig, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Raikou, weight: 10 }],
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
        { species: Species.Phanpy, weight: 20 },
        { species: Species.Magnemite, weight: 20 },
        { species: Species.Voltorb, weight: 20 },
      ],
      uncommon: [],
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
        { species: Species.Miltank, weight: 5 },
        { species: Species.Dunsparce, weight: 10 },
        { species: Species.Girafarig, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Raikou, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Ekans, weight: 20 },
        { species: Species.Magnemite, weight: 20 },
        { species: Species.Voltorb, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Arbok, weight: 10 },
        { species: Species.Magneton, weight: 10 },
        { species: Species.Electrode, weight: 10 },
        { species: Species.Dunsparce, weight: 10 },
        { species: Species.Girafarig, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Raikou, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Ekans, weight: 20 },
        { species: Species.Magnemite, weight: 20 },
        { species: Species.Voltorb, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Arbok, weight: 10 },
        { species: Species.Magneton, weight: 10 },
        { species: Species.Electrode, weight: 10 },
        { species: Species.Dunsparce, weight: 10 },
        { species: Species.Girafarig, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Raikou, weight: 10 }],
    },
  });
}
