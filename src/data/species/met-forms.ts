import Biome from '../ids/biome';
import { Species } from '../ids/species';

/**
 * The forms a species takes from where or when it is met rather than
 * from its own data, kept apart from the species source so the game
 * can load the compact rows without it
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
 * The deer that wears the year. Which coat a player meets is decided
 * by the month rather than by the ground: the season turns for
 * everybody at once, so two people walking far apart still meet the
 * same coat and the four are collected over a year rather than
 * walked to
 */

/** Each season's coat, spring first, in the order the year turns */
const DEERLING_COATS = [
  Species.Deerling,
  Species.DeerlingSummer,
  Species.DeerlingAutumn,
  Species.DeerlingWinter,
];

const SAWSBUCK_COATS = [
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

/**
 * The wings a Vivillon comes out with, one per country.
 *
 * The mainline decides the pattern by the part of the world the game
 * is played in; here the world is the world, so it is the country the
 * scatterbug was met in that the wings remember. Anywhere without a
 * pattern of its own leaves the meadow wings, which are the base form
 */
export const WING_PATTERNS: { species: Species; name: string; biome: Biome }[] = [
  { species: Species.VivillonIcySnow, name: 'Icy Snow Vivillon', biome: Biome.Glacier },
  { species: Species.VivillonPolar, name: 'Polar Vivillon', biome: Biome.AlpineTundra },
  { species: Species.VivillonTundra, name: 'Tundra Vivillon', biome: Biome.Tundra },
  {
    species: Species.VivillonContinental,
    name: 'Continental Vivillon',
    biome: Biome.TemperateForest,
  },
  { species: Species.VivillonGarden, name: 'Garden Vivillon', biome: Biome.Grassland },
  { species: Species.VivillonElegant, name: 'Elegant Vivillon', biome: Biome.Woodland },
  { species: Species.VivillonModern, name: 'Modern Vivillon', biome: Biome.Steppe },
  { species: Species.VivillonMarine, name: 'Marine Vivillon', biome: Biome.CoralReef },
  { species: Species.VivillonArchipelago, name: 'Archipelago Vivillon', biome: Biome.Beach },
  { species: Species.VivillonHighPlains, name: 'High Plains Vivillon', biome: Biome.Badlands },
  { species: Species.VivillonSandstorm, name: 'Sandstorm Vivillon', biome: Biome.Desert },
  { species: Species.VivillonRiver, name: 'River Vivillon', biome: Biome.Bog },
  { species: Species.VivillonMonsoon, name: 'Monsoon Vivillon', biome: Biome.TropicalRainforest },
  { species: Species.VivillonSavannah, name: 'Savannah Vivillon', biome: Biome.Savanna },
  { species: Species.VivillonSun, name: 'Sun Vivillon', biome: Biome.Volcano },
  { species: Species.VivillonOcean, name: 'Ocean Vivillon', biome: Biome.Ocean },
  { species: Species.VivillonJungle, name: 'Jungle Vivillon', biome: Biome.TropicalSeasonalForest },
];

const PATTERN_BY_BIOME = new Map<Biome, Species>(
  WING_PATTERNS.map((pattern) => [pattern.biome, pattern.species]),
);

/**
 * The wings this country hands a butterfly. Anything that is not a
 * Vivillon, and any country with no pattern of its own, comes back
 * unchanged
 */
export function getWingPattern(species: Species, biome: Biome): Species {
  return species === Species.Vivillon ? (PATTERN_BY_BIOME.get(biome) ?? species) : species;
}
