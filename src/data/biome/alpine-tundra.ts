import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * AlpineTundra spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerAlpineTundraSpawns(): void {
  registerSpawnPool(Biome.AlpineTundra, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Machop, weight: 20 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [{ species: Species.Snorunt, weight: 22 }],
      rare: [
        { species: Species.Machoke, weight: 5 },
        { species: Species.Piloswine, weight: 5 },
      ],
      scarce: [{ species: Species.Glalie, weight: 6 }],
      elusive: [
        { species: Species.Machamp, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Skarmory, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Bagon, weight: 3 },
        { species: Species.Machop, weight: 20 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [{ species: Species.Snorunt, weight: 22 }],
      rare: [
        { species: Species.Shelgon, weight: 1 },
        { species: Species.Machoke, weight: 5 },
        { species: Species.Piloswine, weight: 5 },
      ],
      scarce: [{ species: Species.Glalie, weight: 6 }],
      elusive: [
        { species: Species.Salamence, weight: 2 },
        { species: Species.Machamp, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Skarmory, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Bagon, weight: 3 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [
        { species: Species.Snorunt, weight: 22 },
        { species: Species.Sneasel, weight: 5 },
      ],
      rare: [
        { species: Species.Shelgon, weight: 1 },
        { species: Species.Piloswine, weight: 5 },
      ],
      scarce: [{ species: Species.Glalie, weight: 6 }],
      elusive: [
        { species: Species.Salamence, weight: 2 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Absol, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [
        { species: Species.Snorunt, weight: 22 },
        { species: Species.Sneasel, weight: 5 },
      ],
      rare: [{ species: Species.Piloswine, weight: 5 }],
      scarce: [{ species: Species.Glalie, weight: 6 }],
      elusive: [
        { species: Species.Delibird, weight: 5 },
        { species: Species.Absol, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Articuno, weight: 10 }],
    },
  });
}
