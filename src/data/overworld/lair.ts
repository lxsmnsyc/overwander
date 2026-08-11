import Biome from '../ids/biome';
import { BIOME_NAMES } from '../biome/names';
import { Species } from '../ids/species';

/**
 * The lairs: the places a legendary is found rather than the
 * legendary itself.
 *
 * A raid landmark used to draw from the biome's legendary pool and
 * take its name from whatever it staged, which meant a chunk could
 * hold "Articuno" twice over and mean two different things by it. A
 * lair is a place instead — Seafoam Islands is Seafoam Islands
 * whoever is in it — so a landmark is staged from the lairs the biome
 * can host, and the lair decides which legendary is at home there.
 *
 * The names are the ones the mainline games gave these places, which
 * is the point: a player who has seen Articuno before knows what a
 * Seafoam Islands lair is without being told.
 */
const enum Lairs {
  SeafoamIslands = 0,
  PowerPlant = 1,
  MtEmber = 2,
  CeruleanCave = 3,
  /**
   * Mew's island. It is never in a biome's list — the world stages no
   * mythical — but a mythical raid called out by a relic still needs
   * a name, and this is the one it has always had
   */
  FarawayIsland = 4,
}

export const LAIR_NAMES: Record<Lairs, string> = {
  [Lairs.SeafoamIslands]: 'Seafoam Islands',
  [Lairs.PowerPlant]: 'Power Plant',
  [Lairs.MtEmber]: 'Mt. Ember',
  [Lairs.CeruleanCave]: 'Cerulean Cave',
  [Lairs.FarawayIsland]: 'Faraway Island',
};

/**
 * Who lives in each one. A lair stages its own legendary and no
 * other, which is what makes travelling to a particular lair worth
 * doing
 */
export const LAIR_SPECIES: Record<Lairs, Species> = {
  [Lairs.SeafoamIslands]: Species.Articuno,
  [Lairs.PowerPlant]: Species.Zapdos,
  [Lairs.MtEmber]: Species.Moltres,
  [Lairs.CeruleanCave]: Species.Mewtwo,
  [Lairs.FarawayIsland]: Species.Mew,
};

/**
 * Every lair there is, in the order they are numbered
 */
export const EVERY_LAIR: Lairs[] = [
  Lairs.SeafoamIslands,
  Lairs.PowerPlant,
  Lairs.MtEmber,
  Lairs.CeruleanCave,
  Lairs.FarawayIsland,
];

/**
 * Which lairs a biome can host. A lair is a place, so it sits where
 * that place would be: the Seafoam Islands are a sea cave in cold
 * water, Mt. Ember is a volcano, Cerulean Cave is deep under a
 * mountain, and the Power Plant is the one building among them —
 * abandoned on flat ground, which is where the plains are.
 *
 * A biome with no lair stages no legendary lair at all, which is most
 * of them: a legendary the whole world could walk to is not a
 * legendary
 */
const BIOME_LAIRS: { [key in Biome]?: Lairs[] } = {
  [Biome.DeepOcean]: [Lairs.SeafoamIslands],
  [Biome.PolarOcean]: [Lairs.SeafoamIslands],
  [Biome.Glacier]: [Lairs.SeafoamIslands],
  [Biome.Grassland]: [Lairs.PowerPlant],
  [Biome.Steppe]: [Lairs.PowerPlant],
  [Biome.Desert]: [Lairs.MtEmber],
  [Biome.Mountain]: [Lairs.MtEmber, Lairs.CeruleanCave],
  [Biome.AlpineTundra]: [Lairs.CeruleanCave],
};

/**
 * The lairs this biome can host, in the order they are drawn from
 */
export function getBiomeLairs(biome: Biome): Lairs[] {
  return BIOME_LAIRS[biome] ?? [];
}

/**
 * The legendary at home in the lair
 */
export function getLairSpecies(lair: Lairs): Species {
  return LAIR_SPECIES[lair];
}

/**
 * The lair a species is at home in, or null for anything that has no
 * place of its own. It is the mythical raid's question: a relic calls
 * its pokemon out to where it has always been called from, wherever
 * the player happens to be standing
 */
export function getSpeciesLair(species: Species): Lairs | null {
  for (const lair of EVERY_LAIR) {
    if (LAIR_SPECIES[lair] === species) {
      return lair;
    }
  }
  return null;
}

/**
 * What a raid on this landmark is called.
 *
 * A lair is named after the place: **Seafoam Islands**, shadowed or
 * not — a shadow of the place is still that place, so it is only the
 * name with a word in front of it. A shadow raid that reached for one
 * of the biome's rare species instead stands in no lair at all, so it
 * is named after the ground it is standing on: **Shadow Woodland
 * Lair**
 */
export function getLairTitle(lair: Lairs | null, biome: Biome, shadow: boolean): string {
  const place = lair == null ? `${BIOME_NAMES[biome]} Lair` : LAIR_NAMES[lair];

  return shadow ? `Shadow ${place}` : place;
}

export default Lairs;
