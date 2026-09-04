import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Glacier spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerGlacierSpawns(): void {
  registerSpawnPool(Biome.Glacier, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Snorunt, weight: 22 },
        { species: Species.Spheal, weight: 25 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [{ species: Species.Sealeo, weight: 8 }],
      rare: [
        { species: Species.Glalie, weight: 6 },
        { species: Species.Walrein, weight: 5 },
        { species: Species.Delibird, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Regice, weight: 10 },
        { species: Species.Articuno, weight: 10 },
      ],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Snorunt, weight: 22 },
        { species: Species.Spheal, weight: 25 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [{ species: Species.Sealeo, weight: 8 }],
      rare: [
        { species: Species.Glalie, weight: 6 },
        { species: Species.Walrein, weight: 5 },
        { species: Species.Delibird, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Regice, weight: 10 },
        { species: Species.Articuno, weight: 10 },
      ],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Snorunt, weight: 22 },
        { species: Species.Spheal, weight: 25 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [{ species: Species.Sealeo, weight: 8 }],
      rare: [
        { species: Species.Glalie, weight: 6 },
        { species: Species.Walrein, weight: 5 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Sneasel, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Regice, weight: 10 },
        { species: Species.Articuno, weight: 10 },
      ],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Snorunt, weight: 22 },
        { species: Species.Spheal, weight: 25 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [{ species: Species.Sealeo, weight: 8 }],
      rare: [
        { species: Species.Glalie, weight: 6 },
        { species: Species.Walrein, weight: 5 },
        { species: Species.Jynx, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Sneasel, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Regice, weight: 10 },
        { species: Species.Articuno, weight: 10 },
      ],
    },
  });
}
