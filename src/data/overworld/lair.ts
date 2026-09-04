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
  /**
   * Where the three beasts were burned and brought back. It is the
   * one lair with more than one resident, which is what the games
   * say: they were made together and set loose together, and no
   * place belongs to any one of them
   */
  BurnedTower = 5,
  WhirlIslands = 6,
  BellTower = 7,
  /**
   * Celebi's shrine. A mythical's lair, so the world never stages it
   */
  IlexForest = 8,
  /**
   * The three sealed chambers, one golem apiece. Unlike the Burned
   * Tower, which holds three, each of these holds exactly one: they
   * were sealed separately and are opened separately
   */
  DesertRuins = 9,
  IslandCave = 10,
  AncientTomb = 11,
  /**
   * The island the eon pair keep to, well out in open water. Like the
   * Burned Tower it holds two, so which of the pair is at home is a
   * roll
   */
  SouthernIsland = 12,
  /**
   * The three the weather trio sleep in: a cavern that floods, one
   * that fills with heat, and the tower the sky is reached from
   */
  MarineCave = 13,
  TerraCave = 14,
  SkyPillar = 15,
  /**
   * Deoxys' island. A mythical's lair, so no biome lists it: the
   * ticket is the only way there
   */
  BirthIsland = 16,
}

export const LAIR_NAMES: Record<Lairs, string> = {
  [Lairs.SeafoamIslands]: 'Seafoam Islands',
  [Lairs.PowerPlant]: 'Power Plant',
  [Lairs.MtEmber]: 'Mt. Ember',
  [Lairs.CeruleanCave]: 'Cerulean Cave',
  [Lairs.FarawayIsland]: 'Faraway Island',
  [Lairs.BurnedTower]: 'Burned Tower',
  [Lairs.WhirlIslands]: 'Whirl Islands',
  [Lairs.BellTower]: 'Bell Tower',
  [Lairs.IlexForest]: 'Ilex Forest',
  [Lairs.DesertRuins]: 'Desert Ruins',
  [Lairs.IslandCave]: 'Island Cave',
  [Lairs.AncientTomb]: 'Ancient Tomb',
  [Lairs.SouthernIsland]: 'Southern Island',
  [Lairs.MarineCave]: 'Marine Cave',
  [Lairs.TerraCave]: 'Terra Cave',
  [Lairs.SkyPillar]: 'Sky Pillar',
  [Lairs.BirthIsland]: 'Birth Island',
};

/**
 * Who lives in each one. A lair stages its own residents and no
 * others, which is what makes travelling to a particular lair worth
 * doing. Nearly all of them hold a single legendary; the Burned Tower
 * holds the three beasts, so which one is at home is a roll
 */
export const LAIR_SPECIES: Record<Lairs, Species[]> = {
  [Lairs.SeafoamIslands]: [Species.Articuno],
  [Lairs.PowerPlant]: [Species.Zapdos],
  [Lairs.MtEmber]: [Species.Moltres],
  [Lairs.CeruleanCave]: [Species.Mewtwo],
  [Lairs.FarawayIsland]: [Species.Mew],
  [Lairs.BurnedTower]: [Species.Raikou, Species.Entei, Species.Suicune],
  [Lairs.WhirlIslands]: [Species.Lugia],
  [Lairs.BellTower]: [Species.HoOh],
  [Lairs.IlexForest]: [Species.Celebi],
  [Lairs.DesertRuins]: [Species.Regirock],
  [Lairs.IslandCave]: [Species.Regice],
  [Lairs.AncientTomb]: [Species.Registeel],
  [Lairs.SouthernIsland]: [Species.Latias, Species.Latios],
  [Lairs.MarineCave]: [Species.Kyogre],
  [Lairs.TerraCave]: [Species.Groudon],
  [Lairs.SkyPillar]: [Species.Rayquaza],
  [Lairs.BirthIsland]: [Species.Deoxys],
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
  Lairs.BurnedTower,
  Lairs.WhirlIslands,
  Lairs.BellTower,
  Lairs.IlexForest,
  Lairs.DesertRuins,
  Lairs.IslandCave,
  Lairs.AncientTomb,
  Lairs.SouthernIsland,
  Lairs.MarineCave,
  Lairs.TerraCave,
  Lairs.SkyPillar,
  Lairs.BirthIsland,
];

/**
 * Which lairs a biome can host. A lair is a place, so it sits where
 * that place would be: the Seafoam Islands are a sea cave in cold
 * water, Mt. Ember is a volcano, Cerulean Cave is deep under a
 * mountain, and the Power Plant is the one building among them,
 * abandoned on flat ground, which is where the plains are. The three
 * sealed chambers sit where their doors were cut: ruins in the sand,
 * a cave in the ice, a tomb under the rock.
 *
 * A biome with no lair stages no legendary lair at all, which is most
 * of them: a legendary the whole world could walk to is not a
 * legendary
 */
const BIOME_LAIRS: { [key in Biome]?: Lairs[] } = {
  [Biome.DeepOcean]: [Lairs.SeafoamIslands, Lairs.WhirlIslands, Lairs.MarineCave],
  [Biome.Ocean]: [Lairs.WhirlIslands, Lairs.SouthernIsland],
  [Biome.PolarOcean]: [Lairs.SeafoamIslands, Lairs.IslandCave],
  [Biome.Glacier]: [Lairs.SeafoamIslands, Lairs.IslandCave],
  [Biome.Grassland]: [Lairs.PowerPlant, Lairs.BurnedTower],
  [Biome.Woodland]: [Lairs.BurnedTower],
  [Biome.Steppe]: [Lairs.PowerPlant],
  [Biome.Desert]: [Lairs.MtEmber, Lairs.DesertRuins],
  [Biome.Badlands]: [Lairs.DesertRuins, Lairs.AncientTomb],
  [Biome.Mountain]: [
    Lairs.MtEmber,
    Lairs.CeruleanCave,
    Lairs.BellTower,
    Lairs.AncientTomb,
    Lairs.SkyPillar,
  ],
  [Biome.AlpineTundra]: [Lairs.CeruleanCave],
  [Biome.Volcano]: [Lairs.TerraCave],
};

/**
 * The lairs this biome can host, in the order they are drawn from
 */
export function getBiomeLairs(biome: Biome): Lairs[] {
  return BIOME_LAIRS[biome] ?? [];
}

/**
 * Everyone at home in the lair
 */
export function getLairResidents(lair: Lairs): Species[] {
  return LAIR_SPECIES[lair];
}

/**
 * Which of a lair's residents a raid stages, from a roll the whole
 * chunk shares. `allowed` narrows to the ones that can be staged at
 * all, and the caller has already checked that one of them can be
 */
export function pickLairSpecies(
  lair: Lairs,
  allowed: (species: Species) => boolean,
  roll: number,
): Species {
  const residents = getLairResidents(lair).filter(allowed);

  return residents[Math.abs(roll) % residents.length];
}

/**
 * The lair a species is at home in, or null for anything that has no
 * place of its own. It is the mythical raid's question: a relic calls
 * its pokemon out to where it has always been called from, wherever
 * the player happens to be standing
 */
export function getSpeciesLair(species: Species): Lairs | null {
  for (const lair of EVERY_LAIR) {
    if (LAIR_SPECIES[lair].includes(species)) {
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
