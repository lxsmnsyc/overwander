import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * Volcano spawn pool, grouped by day-cycle period and rarity band.
 *
 * The one biome that is hot and high at once, so it is where the fire
 * lines are actually at home rather than borrowing a mountain or a
 * desert. Little else lives on it: the rock types that can take the
 * heat, and nothing that needs a plant.
 */
export default function registerVolcanoSpawns(): void {
  registerSpawnPool(Biome.Volcano, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Charmander, weight: 6 },
        { species: Species.Growlithe, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cyndaquil, weight: 6 },
        { species: Species.Slugma, weight: 20 },
        { species: Species.Torchic, weight: 2 },
      ],
      uncommon: [
        { species: Species.Charmeleon, weight: 3 },
        { species: Species.Graveler, weight: 5 },
        { species: Species.Quilava, weight: 3 },
        { species: Species.Combusken, weight: 1 },
      ],
      rare: [
        { species: Species.Charizard, weight: 3 },
        { species: Species.Arcanine, weight: 5 },
        { species: Species.Magmar, weight: 10 },
        { species: Species.Golem, weight: 5 },
        { species: Species.Typhlosion, weight: 3 },
        { species: Species.Blaziken, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Moltres, weight: 10 },
        { species: Species.Entei, weight: 10 },
        { species: Species.HoOh, weight: 10 },
      ],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Charmander, weight: 6 },
        { species: Species.Growlithe, weight: 20 },
        { species: Species.Ponyta, weight: 20 },
        { species: Species.Geodude, weight: 20 },
        { species: Species.Cyndaquil, weight: 6 },
        { species: Species.Slugma, weight: 20 },
        { species: Species.Onix, weight: 10 },
        { species: Species.Torchic, weight: 2 },
      ],
      uncommon: [
        { species: Species.Charmeleon, weight: 3 },
        { species: Species.Graveler, weight: 5 },
        { species: Species.Quilava, weight: 3 },
        { species: Species.Combusken, weight: 1 },
      ],
      rare: [
        { species: Species.Charizard, weight: 3 },
        { species: Species.Arcanine, weight: 5 },
        { species: Species.Rapidash, weight: 5 },
        { species: Species.Magmar, weight: 10 },
        { species: Species.Golem, weight: 5 },
        { species: Species.Typhlosion, weight: 3 },
        { species: Species.Blaziken, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Moltres, weight: 10 },
        { species: Species.Entei, weight: 10 },
        { species: Species.HoOh, weight: 10 },
      ],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Charmander, weight: 6 },
        { species: Species.Vulpix, weight: 20 },
        { species: Species.Ponyta, weight: 20 },
        { species: Species.Slugma, weight: 20 },
      ],
      uncommon: [{ species: Species.Charmeleon, weight: 3 }],
      rare: [
        { species: Species.Charizard, weight: 3 },
        { species: Species.Rapidash, weight: 5 },
        { species: Species.Magmar, weight: 10 },
        { species: Species.Ninetales, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Moltres, weight: 10 },
        { species: Species.Entei, weight: 10 },
        { species: Species.HoOh, weight: 10 },
      ],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Vulpix, weight: 20 },
        { species: Species.Koffing, weight: 20 },
        { species: Species.Slugma, weight: 20 },
      ],
      uncommon: [],
      rare: [
        { species: Species.Weezing, weight: 5 },
        { species: Species.Magmar, weight: 10 },
        { species: Species.Ninetales, weight: 5 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [
        { species: Species.Moltres, weight: 10 },
        { species: Species.Entei, weight: 10 },
        { species: Species.HoOh, weight: 10 },
      ],
    },
  });
}
