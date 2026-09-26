import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerIcePool, registerSpawnPool } from './__create';

/**
 * Tundra spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTundraSpawns(): void {
  registerSpawnPool(Biome.Tundra, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.FlabebeWhite, weight: 24 },
        { species: Species.Scatterbug, weight: 24 },
        { species: Species.Swinub, weight: 25 },
        { species: Species.Vanillite, weight: 24 },
      ],
      uncommon: [
        { species: Species.Snover, weight: 20 },
        { species: Species.Cubchoo, weight: 20 },
      ],
      rare: [
        { species: Species.FloetteWhite, weight: 8 },
        { species: Species.Spewpa, weight: 8 },
        { species: Species.Piloswine, weight: 10 },
        { species: Species.Vanillish, weight: 10 },
      ],
      scarce: [
        { species: Species.Beartic, weight: 6 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Abomasnow, weight: 6 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.FlorgesWhite, weight: 5 },
        { species: Species.Vivillon, weight: 5 },
        { species: Species.Vanilluxe, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Mamoswine, weight: 5 },
        { species: Species.Stoutland, weight: 6 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Reshiram, weight: 10 },
        { species: Species.Zekrom, weight: 10 },
        { species: Species.Kyurem, weight: 10 },
        { species: Species.Suicune, weight: 10 },
        { species: Species.Uxie, weight: 10 },
        { species: Species.Regigigas, weight: 10 },
        { species: Species.Regice, weight: 10 },
      ],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.FlabebeWhite, weight: 24 },
        { species: Species.Scatterbug, weight: 24 },
        { species: Species.Swinub, weight: 25 },
        { species: Species.Vanillite, weight: 24 },
      ],
      uncommon: [
        { species: Species.Snover, weight: 20 },
        { species: Species.Cubchoo, weight: 20 },
      ],
      rare: [
        { species: Species.FloetteWhite, weight: 8 },
        { species: Species.Spewpa, weight: 8 },
        { species: Species.Piloswine, weight: 10 },
        { species: Species.Vanillish, weight: 10 },
      ],
      scarce: [
        { species: Species.Beartic, weight: 6 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Abomasnow, weight: 6 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.FlorgesWhite, weight: 5 },
        { species: Species.Vivillon, weight: 5 },
        { species: Species.Vanilluxe, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Mamoswine, weight: 5 },
        { species: Species.Stoutland, weight: 6 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Reshiram, weight: 10 },
        { species: Species.Zekrom, weight: 10 },
        { species: Species.Kyurem, weight: 10 },
        { species: Species.Suicune, weight: 10 },
        { species: Species.Uxie, weight: 10 },
        { species: Species.Regigigas, weight: 10 },
        { species: Species.Regice, weight: 10 },
      ],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [
        { species: Species.Sneasel, weight: 5 },
        { species: Species.Snover, weight: 20 },
      ],
      rare: [{ species: Species.Piloswine, weight: 5 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Abomasnow, weight: 6 },
        { species: Species.Weavile, weight: 6 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.Jynx, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Mamoswine, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Reshiram, weight: 10 },
        { species: Species.Zekrom, weight: 10 },
        { species: Species.Kyurem, weight: 10 },
        { species: Species.Suicune, weight: 10 },
        { species: Species.Uxie, weight: 10 },
        { species: Species.Regigigas, weight: 10 },
        { species: Species.Regice, weight: 10 },
      ],
    },
    [TimeOfDay.Night]: {
      base: [{ species: Species.Swinub, weight: 25 }],
      uncommon: [
        { species: Species.Sneasel, weight: 5 },
        { species: Species.Snover, weight: 20 },
      ],
      rare: [{ species: Species.Piloswine, weight: 5 }],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Abomasnow, weight: 6 },
        { species: Species.Weavile, weight: 6 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.Jynx, weight: 5 },
        { species: Species.Delibird, weight: 5 },
        { species: Species.Mamoswine, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Smoochum, weight: PRIZED_WEIGHT }],
      special: [
        { species: Species.Reshiram, weight: 10 },
        { species: Species.Zekrom, weight: 10 },
        { species: Species.Kyurem, weight: 10 },
        { species: Species.Suicune, weight: 10 },
        { species: Species.Uxie, weight: 10 },
        { species: Species.Regigigas, weight: 10 },
        { species: Species.Regice, weight: 10 },
      ],
    },
  });
  registerIcePool(Biome.Tundra, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Vanillite, weight: 24 },
        { species: Species.Spheal, weight: 25 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [
        { species: Species.Cubchoo, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Snorunt, weight: 22 },
      ],
      rare: [
        { species: Species.Vanillish, weight: 10 },
        { species: Species.Sealeo, weight: 8 },
        { species: Species.Piloswine, weight: 5 },
      ],
      scarce: [
        { species: Species.Beartic, weight: 6 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Glalie, weight: 6 },
        { species: Species.Froslass, weight: 6 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.Vanilluxe, weight: 5 },
        { species: Species.Walrein, weight: 5 },
        { species: Species.Mamoswine, weight: 5 },
      ],
      special: [{ species: Species.Uxie, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Vanillite, weight: 24 },
        { species: Species.Spheal, weight: 25 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [
        { species: Species.Cubchoo, weight: 20 },
        { species: Species.Seel, weight: 20 },
        { species: Species.Snorunt, weight: 22 },
      ],
      rare: [
        { species: Species.Vanillish, weight: 10 },
        { species: Species.Sealeo, weight: 8 },
        { species: Species.Piloswine, weight: 5 },
      ],
      scarce: [
        { species: Species.Beartic, weight: 6 },
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Glalie, weight: 6 },
        { species: Species.Froslass, weight: 6 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.Vanilluxe, weight: 5 },
        { species: Species.Walrein, weight: 5 },
        { species: Species.Mamoswine, weight: 5 },
      ],
      special: [{ species: Species.Uxie, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Spheal, weight: 25 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [
        { species: Species.Seel, weight: 20 },
        { species: Species.Snorunt, weight: 22 },
      ],
      rare: [
        { species: Species.Sealeo, weight: 8 },
        { species: Species.Piloswine, weight: 5 },
      ],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Glalie, weight: 6 },
        { species: Species.Froslass, weight: 6 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.Walrein, weight: 5 },
        { species: Species.Mamoswine, weight: 5 },
      ],
      special: [{ species: Species.Uxie, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Spheal, weight: 25 },
        { species: Species.Swinub, weight: 25 },
      ],
      uncommon: [
        { species: Species.Seel, weight: 20 },
        { species: Species.Snorunt, weight: 22 },
      ],
      rare: [
        { species: Species.Sealeo, weight: 8 },
        { species: Species.Piloswine, weight: 5 },
      ],
      scarce: [
        { species: Species.Dewgong, weight: 10 },
        { species: Species.Glalie, weight: 6 },
        { species: Species.Froslass, weight: 6 },
        { species: Species.Glaceon, weight: 6 },
      ],
      elusive: [
        { species: Species.Walrein, weight: 5 },
        { species: Species.Mamoswine, weight: 5 },
      ],
      special: [{ species: Species.Uxie, weight: 10 }],
    },
  });
}
