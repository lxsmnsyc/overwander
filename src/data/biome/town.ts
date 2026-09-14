import { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import type { SpawnRarityGroups } from './__create';
import { registerTownPool } from './__create';

/**
 * What lives in the towns: the pokemon that live around people, one
 * pool every town's streets draw from whatever country it stands in.
 * The sewer crowd comes out after dark and the birds keep to the day
 */
// TODO: add back Starly, Staravia, Glameow, Purugly, Buneary, Rotom and Magnezone once Sinnoh is on main
const DAY: SpawnRarityGroups = {
  base: [
    { species: Species.Pidgey, weight: 30 },
    { species: Species.Magnemite, weight: 25 },
    { species: Species.Porygon, weight: 15 },
  ],
  uncommon: [
    { species: Species.Rattata, weight: 20 },
    { species: Species.Zigzagoon, weight: 20 },
    { species: Species.Voltorb, weight: 16 },
  ],
  rare: [
    { species: Species.Pidgeotto, weight: 20 },
    { species: Species.Magneton, weight: 14 },
  ],
  scarce: [
    { species: Species.Raticate, weight: 12 },
    { species: Species.Linoone, weight: 12 },
    { species: Species.Electrode, weight: 10 },
  ],
  elusive: [
    { species: Species.Ditto, weight: 10 },
    { species: Species.Kecleon, weight: 8 },
  ],
  prized: [],
  special: [],
};

const EVENING: SpawnRarityGroups = {
  base: [
    { species: Species.Magnemite, weight: 25 },
    { species: Species.Porygon, weight: 15 },
  ],
  uncommon: [
    { species: Species.Rattata, weight: 20 },
    { species: Species.Zigzagoon, weight: 20 },
    { species: Species.Voltorb, weight: 16 },
  ],
  rare: [{ species: Species.Magneton, weight: 14 }],
  scarce: [
    { species: Species.Raticate, weight: 12 },
    { species: Species.Linoone, weight: 12 },
    { species: Species.Electrode, weight: 10 },
  ],
  elusive: [{ species: Species.Ditto, weight: 10 }],
  prized: [],
  special: [],
};

const NIGHT: SpawnRarityGroups = {
  base: EVENING.base,
  uncommon: [
    ...EVENING.uncommon,
    { species: Species.Meowth, weight: 18 },
    { species: Species.Grimer, weight: 16 },
    { species: Species.Koffing, weight: 16 },
  ],
  rare: EVENING.rare,
  scarce: [
    ...(EVENING.scarce ?? []),
    { species: Species.Persian, weight: 10 },
    { species: Species.Muk, weight: 8 },
    { species: Species.Weezing, weight: 8 },
  ],
  elusive: EVENING.elusive,
  prized: [],
  special: [],
};

export default function registerTownSpawns(): void {
  registerTownPool({
    [TimeOfDay.Morning]: DAY,
    [TimeOfDay.Day]: DAY,
    [TimeOfDay.Evening]: EVENING,
    [TimeOfDay.Night]: NIGHT,
  });
}
