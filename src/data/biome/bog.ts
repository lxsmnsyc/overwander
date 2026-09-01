import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Bog spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerBogSpawns(): void {
  registerSpawnPool(Biome.Bog, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Venonat, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Weepinbell, weight: 5 },
      ],
      rare: [
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Venonat, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Weepinbell, weight: 5 },
      ],
      rare: [
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Venonat, weight: 20 },
        { species: Species.Gastly, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Haunter, weight: 5 },
      ],
      rare: [
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Gengar, weight: 5 },
        { species: Species.Muk, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Oddish, weight: 20 },
        { species: Species.Gastly, weight: 20 },
        { species: Species.Grimer, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
      ],
      uncommon: [
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Gloom, weight: 5 },
        { species: Species.Haunter, weight: 5 },
      ],
      rare: [
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Vileplume, weight: 5 },
        { species: Species.Gengar, weight: 5 },
        { species: Species.Muk, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Yanma, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [],
    },
  });
}
