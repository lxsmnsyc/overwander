import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

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
        { species: Species.Skitty, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Fearow, weight: 10 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Miltank, weight: 5 },
        { species: Species.Delcatty, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
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
        { species: Species.Skitty, weight: 25 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Fearow, weight: 10 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Miltank, weight: 5 },
        { species: Species.Delcatty, weight: 10 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Houndour, weight: 20 },
        { species: Species.Poochyena, weight: 20 },
        { species: Species.Seedot, weight: 20 },
      ],
      uncommon: [{ species: Species.Nuzleaf, weight: 10 }],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Mightyena, weight: 10 },
        { species: Species.Shiftry, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Houndour, weight: 20 },
        { species: Species.Poochyena, weight: 20 },
        { species: Species.Seedot, weight: 20 },
      ],
      uncommon: [{ species: Species.Nuzleaf, weight: 10 }],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Mightyena, weight: 10 },
        { species: Species.Shiftry, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
