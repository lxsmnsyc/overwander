import Biome, { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import { UNOWN_SPAWNS, registerSpawnPool } from './__create';

/**
 * DeepOcean spawn pool, grouped by day-cycle period and rarity band.
 *
 * The base band used to be the Omanyte alone. Now that nothing which
 * comes out of a fossil spawns anywhere, it is the open-water
 * commoners instead — a deep ocean whose only common was extinct
 * would stage nothing at all, since a roll that lands on an empty
 * base band is a cell with no pokemon on it.
 *
 * The dragons are the deep's own: a Dratini is a thin slot here and
 * on the shelf above, and the Dragonair it becomes is the one thing
 * this water keeps in the uncommon band
 */
export default function registerDeepOceanSpawns(): void {
  registerSpawnPool(Biome.DeepOcean, {
    [TimeOfDay.Morning]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Dratini, weight: 4 },
      ],
      uncommon: [
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Magikarp, weight: 20 },
        { species: Species.Chinchou, weight: 20 },
      ],
      rare: [{ species: Species.Dragonair, weight: 2 }],
      scarce: [
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lanturn, weight: 10 },
      ],
      elusive: [
        { species: Species.Lapras, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Lugia, weight: 10 }],
    },
    [TimeOfDay.Day]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Dratini, weight: 4 },
      ],
      uncommon: [
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Magikarp, weight: 20 },
        { species: Species.Chinchou, weight: 20 },
      ],
      rare: [{ species: Species.Dragonair, weight: 2 }],
      scarce: [
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lanturn, weight: 10 },
      ],
      elusive: [
        { species: Species.Lapras, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Lugia, weight: 10 }],
    },
    [TimeOfDay.Evening]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Dratini, weight: 4 },
      ],
      uncommon: [
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Magikarp, weight: 20 },
        { species: Species.Chinchou, weight: 20 },
      ],
      rare: [{ species: Species.Dragonair, weight: 2 }],
      scarce: [
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lanturn, weight: 10 },
      ],
      elusive: [
        { species: Species.Lapras, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Lugia, weight: 10 }],
    },
    [TimeOfDay.Night]: {
      base: [
        { species: Species.Horsea, weight: 20 },
        { species: Species.Dratini, weight: 4 },
      ],
      uncommon: [
        { species: Species.Tentacool, weight: 20 },
        { species: Species.Magikarp, weight: 20 },
        { species: Species.Chinchou, weight: 20 },
      ],
      rare: [{ species: Species.Dragonair, weight: 2 }],
      scarce: [
        { species: Species.Gyarados, weight: 10 },
        { species: Species.Lanturn, weight: 10 },
      ],
      elusive: [
        { species: Species.Lapras, weight: 5 },
        { species: Species.Dragonite, weight: 2 },
      ],
      prized: [...UNOWN_SPAWNS],
      special: [{ species: Species.Lugia, weight: 10 }],
    },
  });
}
