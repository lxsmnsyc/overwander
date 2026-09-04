import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { PRIZED_WEIGHT, UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Bog spawn pool, grouped by day-cycle period and rarity band
 */
export default function registerBogSpawns(): void {
  registerSpawnPool(Biome.Bog, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Mudkip, weight: 2 },
        { species: Species.Lotad, weight: 20 },
      ],
      uncommon: [
        { species: Species.Gulpin, weight: 22 },
        { species: Species.Barboach, weight: 25 },
        { species: Species.Feebas, weight: 10 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
        { species: Species.Surskit, weight: 25 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Weepinbell, weight: 5 },
        { species: Species.Marshtomp, weight: 1 },
        { species: Species.Lombre, weight: 10 },
      ],
      scarce: [
        { species: Species.Swalot, weight: 7 },
        { species: Species.Whiscash, weight: 8 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Masquerain, weight: 10 },
        { species: Species.Quagsire, weight: 5 },
      ],
      elusive: [
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Swampert, weight: 2 },
        { species: Species.Ludicolo, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Azurill, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Bellsprout, weight: 20 },
        { species: Species.Mudkip, weight: 2 },
        { species: Species.Lotad, weight: 20 },
      ],
      uncommon: [
        { species: Species.Gulpin, weight: 22 },
        { species: Species.Barboach, weight: 25 },
        { species: Species.Feebas, weight: 10 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
        { species: Species.Surskit, weight: 25 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Weepinbell, weight: 5 },
        { species: Species.Marshtomp, weight: 1 },
        { species: Species.Lombre, weight: 10 },
      ],
      scarce: [
        { species: Species.Swalot, weight: 7 },
        { species: Species.Whiscash, weight: 8 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Masquerain, weight: 10 },
        { species: Species.Quagsire, weight: 5 },
      ],
      elusive: [
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Victreebel, weight: 5 },
        { species: Species.Swampert, weight: 2 },
        { species: Species.Ludicolo, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Azurill, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Evening]: {
      base: [{ species: Species.Poliwag, weight: 20 }],
      uncommon: [
        { species: Species.Gulpin, weight: 22 },
        { species: Species.Barboach, weight: 25 },
        { species: Species.Feebas, weight: 10 },
        { species: Species.Venonat, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [{ species: Species.Poliwhirl, weight: 5 }],
      scarce: [
        { species: Species.Swalot, weight: 7 },
        { species: Species.Whiscash, weight: 8 },
        { species: Species.Venomoth, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Quagsire, weight: 5 },
      ],
      elusive: [
        { species: Species.Volbeat, weight: 8 },
        { species: Species.Illumise, weight: 8 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Azurill, weight: PRIZED_WEIGHT }],
      special: [],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Poliwag, weight: 20 },
        { species: Species.Oddish, weight: 20 },
        { species: Species.Gastly, weight: 20 },
      ],
      uncommon: [
        { species: Species.Gulpin, weight: 22 },
        { species: Species.Barboach, weight: 25 },
        { species: Species.Feebas, weight: 10 },
        { species: Species.Grimer, weight: 20 },
        { species: Species.Magikarp, weight: 30 },
        { species: Species.Wooper, weight: 25 },
        { species: Species.Marill, weight: 20 },
        { species: Species.Yanma, weight: 5 },
      ],
      rare: [
        { species: Species.Poliwhirl, weight: 5 },
        { species: Species.Gloom, weight: 5 },
        { species: Species.Haunter, weight: 5 },
      ],
      scarce: [
        { species: Species.Swalot, weight: 7 },
        { species: Species.Whiscash, weight: 8 },
        { species: Species.Muk, weight: 10 },
        { species: Species.Azumarill, weight: 5 },
        { species: Species.Quagsire, weight: 5 },
      ],
      elusive: [
        { species: Species.Poliwrath, weight: 5 },
        { species: Species.Vileplume, weight: 5 },
        { species: Species.Gengar, weight: 5 },
        { species: Species.Volbeat, weight: 8 },
        { species: Species.Illumise, weight: 8 },
      ],
      prized: [...UNOWN_SPAWNS, { species: Species.Azurill, weight: PRIZED_WEIGHT }],
      special: [],
    },
  });
}
