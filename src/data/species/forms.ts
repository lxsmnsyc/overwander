import Biome from '../ids/biome';
import { Species } from '../ids/species';

/**
 * The forms the world picks rather than the data: which shell a shore
 * hands over, which wings a country gives a butterfly, which coat the
 * season dresses a deer in. The forms themselves are written in the
 * species YAML; these are the rules that choose between them
 */

/**
 * Which shell a shore hands over, by the side of the world it is on.
 * The mainline splits the two seas at a mountain range; here the
 * meridian is what a chunk's own x already is, so west of nothing is
 * the pink one and east of it the blue
 */
const EAST_SHELLS = new Map<Species, Species>([
  [Species.Shellos, Species.ShellosEast],
  [Species.Gastrodon, Species.GastrodonEast],
]);

export function getShoreForm(species: Species, x: number): Species {
  return x < 0 ? species : (EAST_SHELLS.get(species) ?? species);
}

/**
 * The wings a Vivillon comes out with, one per country.
 *
 * The mainline decides the pattern by the part of the world the game
 * is played in; here the world is the world, so it is the country the
 * scatterbug was met in that the wings remember. Anywhere without a
 * pattern of its own leaves the meadow wings, which are the base form
 */
const WING_PATTERNS = new Map<Biome, Species>([
  [Biome.Glacier, Species.VivillonIcySnow],
  [Biome.AlpineTundra, Species.VivillonPolar],
  [Biome.Tundra, Species.VivillonTundra],
  [Biome.TemperateForest, Species.VivillonContinental],
  [Biome.Grassland, Species.VivillonGarden],
  [Biome.Woodland, Species.VivillonElegant],
  [Biome.Steppe, Species.VivillonModern],
  [Biome.CoralReef, Species.VivillonMarine],
  [Biome.Beach, Species.VivillonArchipelago],
  [Biome.Badlands, Species.VivillonHighPlains],
  [Biome.Desert, Species.VivillonSandstorm],
  [Biome.Bog, Species.VivillonRiver],
  [Biome.TropicalRainforest, Species.VivillonMonsoon],
  [Biome.Savanna, Species.VivillonSavannah],
  [Biome.Volcano, Species.VivillonSun],
  [Biome.Ocean, Species.VivillonOcean],
  [Biome.TropicalSeasonalForest, Species.VivillonJungle],
]);

/**
 * The wings this country hands a butterfly. Anything that is not a
 * Vivillon, and any country with no pattern of its own, comes back
 * unchanged
 */
export function getWingPattern(species: Species, biome: Biome): Species {
  return species === Species.Vivillon ? (WING_PATTERNS.get(biome) ?? species) : species;
}

/**
 * The deer that wears the year. Which coat a player meets is decided
 * by the month rather than by the ground: the season turns for
 * everybody at once, so two people walking far apart still meet the
 * same coat and the four are collected over a year rather than
 * walked to
 */

/** Each season's coat, spring first, in the order the year turns */
export const DEERLING_COATS = [
  Species.Deerling,
  Species.DeerlingSummer,
  Species.DeerlingAutumn,
  Species.DeerlingWinter,
];

export const SAWSBUCK_COATS = [
  Species.Sawsbuck,
  Species.SawsbuckSummer,
  Species.SawsbuckAutumn,
  Species.SawsbuckWinter,
];

const SEASONAL_COATS = new Map<Species, Species[]>([
  [Species.Deerling, DEERLING_COATS],
  [Species.Sawsbuck, SAWSBUCK_COATS],
]);

/**
 * The coat this season hands over, or the species itself for anything
 * that does not change with the year. The season is an index, spring
 * first, so this stays out of the biome clock's way
 */
export function getSeasonalCoat(species: Species, season: number): Species {
  return SEASONAL_COATS.get(species)?.[season] ?? species;
}
