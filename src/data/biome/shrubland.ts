import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * Shrubland spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerShrublandSpawns(): void {
  registerSpawnPool(Biome.Shrubland, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Spearow, weight: 20 },
        { species: Species.Natu, weight: 20 },
        { species: Species.Mareep, weight: 25 },
        { species: Species.Hoppip, weight: 25 },
        { species: Species.Sunkern, weight: 25 },
        { species: Species.Snubbull, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Fearow, weight: 10 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Spearow, weight: 20 },
        { species: Species.Natu, weight: 20 },
        { species: Species.Mareep, weight: 25 },
        { species: Species.Hoppip, weight: 25 },
        { species: Species.Sunkern, weight: 25 },
        { species: Species.Snubbull, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Fearow, weight: 10 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Houndour, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Houndour, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
      ],
      special: [],
    },
  });
}
