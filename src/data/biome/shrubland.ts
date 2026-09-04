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
        { species: Species.Mareep, weight: 25 },
        { species: Species.Hoppip, weight: 25 },
      ],
      uncommon: [
        { species: Species.Flaaffy, weight: 5 },
        { species: Species.Skiploom, weight: 5 },
        { species: Species.Spearow, weight: 20 },
        { species: Species.Natu, weight: 20 },
        { species: Species.Sunkern, weight: 25 },
        { species: Species.Snubbull, weight: 20 },
      ],
      rare: [
        { species: Species.Fearow, weight: 10 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Miltank, weight: 5 },
        { species: Species.Xatu, weight: 5 },
        { species: Species.Sunflora, weight: 5 },
        { species: Species.Ampharos, weight: 5 },
        { species: Species.Jumpluff, weight: 5 },
        { species: Species.Granbull, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Mareep, weight: 25 },
        { species: Species.Hoppip, weight: 25 },
      ],
      uncommon: [
        { species: Species.Flaaffy, weight: 5 },
        { species: Species.Skiploom, weight: 5 },
        { species: Species.Spearow, weight: 20 },
        { species: Species.Natu, weight: 20 },
        { species: Species.Sunkern, weight: 25 },
        { species: Species.Snubbull, weight: 20 },
      ],
      rare: [
        { species: Species.Fearow, weight: 10 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Miltank, weight: 5 },
        { species: Species.Xatu, weight: 5 },
        { species: Species.Sunflora, weight: 5 },
        { species: Species.Ampharos, weight: 5 },
        { species: Species.Jumpluff, weight: 5 },
        { species: Species.Granbull, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [],
      uncommon: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Houndour, weight: 20 },
      ],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Houndoom, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [],
      uncommon: [
        { species: Species.Vulpix, weight: 10 },
        { species: Species.Houndour, weight: 20 },
      ],
      rare: [
        { species: Species.Ninetales, weight: 5 },
        { species: Species.Flareon, weight: 5 },
        { species: Species.Smeargle, weight: 5 },
        { species: Species.Houndoom, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
