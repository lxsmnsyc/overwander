import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { registerSpawnPool } from './__create';

/**
 * TemperateForest spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerTemperateForestSpawns(): void {
  registerSpawnPool(Biome.TemperateForest, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Bulbasaur, weight: 2 },
        { species: Species.Caterpie, weight: 30 },
        { species: Species.Weedle, weight: 30 },
        { species: Species.Pikachu, weight: 5 },
        { species: Species.Bellsprout, weight: 20 },
      ],
      uncommon: [
        { species: Species.Ivysaur, weight: 1 },
        { species: Species.Metapod, weight: 15 },
        { species: Species.Kakuna, weight: 15 },
        { species: Species.Weepinbell, weight: 5 },
      ],
      rare: [
        { species: Species.Venusaur, weight: 2 },
        { species: Species.Butterfree, weight: 10 },
        { species: Species.Beedrill, weight: 10 },
        { species: Species.Raichu, weight: 5 },
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Scyther, weight: 5 },
        { species: Species.Snorlax, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Bulbasaur, weight: 2 },
        { species: Species.Caterpie, weight: 30 },
        { species: Species.Weedle, weight: 30 },
        { species: Species.Pikachu, weight: 5 },
        { species: Species.Bellsprout, weight: 20 },
      ],
      uncommon: [
        { species: Species.Ivysaur, weight: 1 },
        { species: Species.Metapod, weight: 15 },
        { species: Species.Kakuna, weight: 15 },
        { species: Species.Weepinbell, weight: 5 },
      ],
      rare: [
        { species: Species.Venusaur, weight: 2 },
        { species: Species.Butterfree, weight: 10 },
        { species: Species.Beedrill, weight: 10 },
        { species: Species.Raichu, weight: 5 },
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Scyther, weight: 5 },
        { species: Species.Pinsir, weight: 5 },
        { species: Species.Snorlax, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Pikachu, weight: 5 },
        { species: Species.Oddish, weight: 20 },
        { species: Species.Venonat, weight: 20 },
      ],
      uncommon: [{ species: Species.Gloom, weight: 5 }],
      rare: [
        { species: Species.Raichu, weight: 5 },
        { species: Species.Vileplume, weight: 5 },
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Snorlax, weight: 5 },
      ],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Pikachu, weight: 5 },
        { species: Species.Oddish, weight: 20 },
        { species: Species.Paras, weight: 20 },
        { species: Species.Venonat, weight: 20 },
      ],
      uncommon: [{ species: Species.Gloom, weight: 5 }],
      rare: [
        { species: Species.Raichu, weight: 5 },
        { species: Species.Vileplume, weight: 5 },
        { species: Species.Parasect, weight: 10 },
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Snorlax, weight: 5 },
      ],
      special: [],
    },
  });
}
