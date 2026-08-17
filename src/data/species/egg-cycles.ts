import { Species } from '../ids/species';
import { getBaseSpecies } from './__create';

/**
 * How long a species' egg takes to open, in hatch cycles.
 *
 * A cycle is the mainline's own unit, and the figures below are its
 * figures: a Magikarp is the cheapest egg in the game and a Mewtwo the
 * dearest, with most of the dex sitting on the same middling number.
 * Only the exceptions are written down — anything absent takes
 * `DEFAULT_EGG_CYCLES`, which is what the great majority take.
 *
 * What a cycle is worth in steps is
 * [`src/auth/egg.ts`](../../auth/egg.ts)'s business, not this table's:
 * this is the shape of the curve, and that file decides how far a
 * player has to walk along it.
 *
 * Only the stage a line hatches at needs an entry, since an egg is
 * always the first stage of its line
 */
export const DEFAULT_EGG_CYCLES = 20;

const SPECIES_EGG_CYCLES: Map<Species, number> = new Map([
  // The one everybody knows: a Magikarp is out of the shell before
  // anything else has started
  [Species.Magikarp, 5],

  [Species.Pikachu, 10],
  [Species.Clefairy, 10],
  [Species.Jigglypuff, 10],

  // The early-route lines, which is what makes them early-route
  [Species.Caterpie, 15],
  [Species.Weedle, 15],
  [Species.Pidgey, 15],
  [Species.Rattata, 15],
  [Species.Spearow, 15],
  [Species.Zubat, 15],
  [Species.Geodude, 15],

  [Species.Onix, 25],
  [Species.Hitmonlee, 25],
  [Species.Hitmonchan, 25],
  [Species.MrMime, 25],
  [Species.Scyther, 25],
  [Species.Jynx, 25],
  [Species.Electabuzz, 25],
  [Species.Magmar, 25],
  [Species.Pinsir, 25],

  // Revived rather than born, and priced accordingly
  [Species.Omanyte, 30],
  [Species.Kabuto, 30],

  [Species.Eevee, 35],
  [Species.Aerodactyl, 35],

  [Species.Chansey, 40],
  [Species.Lapras, 40],
  [Species.Snorlax, 40],
  [Species.Dratini, 40],

  // Nothing lays these, so the figures only ever reach a nest egg or a
  // raid prize — but a legendary out of a shell should cost a walk
  [Species.Articuno, 80],
  [Species.Zapdos, 80],
  [Species.Moltres, 80],
  [Species.Mewtwo, 120],
  [Species.Mew, 120],
]);

/**
 * How many cycles this species' egg takes.
 *
 * Asked of the stage that hatches rather than of the species handed
 * in, because a line runs on one figure the whole way up and a raid
 * can hand out an egg of something already evolved
 */
export function getEggCycles(species: Species): number {
  return SPECIES_EGG_CYCLES.get(getBaseSpecies(species)) ?? DEFAULT_EGG_CYCLES;
}
