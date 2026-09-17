import { TimeOfDay } from '../ids/biome';
import { Species } from '../ids/species';
import type { SpawnRarityGroups } from './__create';
import { UNOWN_SPAWNS, registerCavePool } from './__create';

/**
 * What lives in the caves.
 *
 * One pool for the whole of underground rather than one per biome.
 * A cave is a cave: the country overhead decides which cave a player
 * has walked into and how far they had to go to reach it, but what is
 * living in the dark is much the same under a desert as under a
 * taiga, and the mainline agrees with that.
 *
 * **The same at every hour.** There is no sky down there, so nothing
 * about a cave changes with the time of day, which is one of the
 * things a player gives up by going under: no dawn, no dusk, and
 * nothing that only comes out at night.
 */
const CAVE_SPAWNS: SpawnRarityGroups = {
  base: [
    { species: Species.Zubat, weight: 30 },
    { species: Species.Geodude, weight: 24 },
    { species: Species.Machop, weight: 12 },
    { species: Species.Whismur, weight: 12 },
    { species: Species.Aron, weight: 8 },
    { species: Species.Rhyhorn, weight: 6 },
    { species: Species.Larvitar, weight: 3 },
    { species: Species.Gible, weight: 3 },
  ],
  uncommon: [
    { species: Species.Diglett, weight: 16 },
    { species: Species.Sandshrew, weight: 12 },
    { species: Species.Onix, weight: 10 },
    { species: Species.Clefairy, weight: 8 },
    { species: Species.Paras, weight: 8 },
    { species: Species.Makuhita, weight: 8 },
    { species: Species.Baltoy, weight: 7 },
    { species: Species.Nosepass, weight: 6 },
    { species: Species.Bronzor, weight: 6 },
    { species: Species.Meditite, weight: 6 },
    { species: Species.Slugma, weight: 5 },
  ],
  rare: [
    { species: Species.Golbat, weight: 16 },
    { species: Species.Graveler, weight: 12 },
    { species: Species.Machoke, weight: 8 },
    { species: Species.Loudred, weight: 8 },
    { species: Species.Lairon, weight: 6 },
    { species: Species.Rhydon, weight: 5 },
    { species: Species.Pupitar, weight: 3 },
    { species: Species.Gabite, weight: 3 },
  ],
  scarce: [
    { species: Species.Dugtrio, weight: 10 },
    { species: Species.Sandslash, weight: 9 },
    { species: Species.Steelix, weight: 7 },
    { species: Species.Parasect, weight: 7 },
    { species: Species.Hariyama, weight: 6 },
    { species: Species.Claydol, weight: 6 },
    { species: Species.Clefable, weight: 5 },
    { species: Species.Bronzong, weight: 5 },
    { species: Species.Medicham, weight: 5 },
    { species: Species.Magcargo, weight: 5 },
    { species: Species.Probopass, weight: 4 },
  ],
  elusive: [
    // The ones that never evolve are the reason to be down here at
    // all: none of them stands anywhere else in the world
    { species: Species.Dunsparce, weight: 10 },
    { species: Species.Wobbuffet, weight: 8 },
    { species: Species.Sableye, weight: 7 },
    { species: Species.Mawile, weight: 7 },
    { species: Species.Solrock, weight: 6 },
    { species: Species.Lunatone, weight: 6 },
    { species: Species.Crobat, weight: 6 },
    { species: Species.Golem, weight: 6 },
    { species: Species.Machamp, weight: 5 },
    { species: Species.Exploud, weight: 5 },
    { species: Species.Aggron, weight: 4 },
    { species: Species.Rhyperior, weight: 3 },
    { species: Species.Garchomp, weight: 2 },
    { species: Species.Tyranitar, weight: 2 },
  ],
  prized: [...UNOWN_SPAWNS],
  // Nothing. A legendary underground is at home in a lair rather than
  // standing about in a passage, and the cave lairs already stage the
  // five whose real address is a cave
  special: [],
};

/** The one pool every cave in the world draws from, at every hour */
export default function registerCaveSpawns(): void {
  registerCavePool({
    [TimeOfDay.Morning]: CAVE_SPAWNS,
    [TimeOfDay.Day]: CAVE_SPAWNS,
    [TimeOfDay.Evening]: CAVE_SPAWNS,
    [TimeOfDay.Night]: CAVE_SPAWNS,
  });
}
