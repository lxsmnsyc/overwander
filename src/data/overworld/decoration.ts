import Biome from '../ids/biome';

/**
 * Scenery: what a chunk has standing in it that a player does nothing
 * with.
 *
 * A chunk of nothing but grass with six landmarks and a few pokemon on
 * it reads as a board rather than as a place, and every biome looked
 * the same but for the colour of the ground. Decorations are what
 * makes a taiga a taiga — pines in it, rocks on a mountain, cactus in
 * a desert — and they are placed by the same rules as everything else,
 * so scenery never crowds the thing a player walked over to.
 *
 * Nothing here is interactive and nothing is rolled per window: a tree
 * belongs to the chunk the way a landmark does, and it is standing
 * there whenever anybody comes back.
 */
const enum Decoration {
  Tree = 0,
  Pine = 1,
  Palm = 2,
  Cactus = 3,
  Shrub = 4,
  Grass = 5,
  Flower = 6,
  Rock = 7,
  Boulder = 8,
  Reed = 9,
  Coral = 10,
  Ice = 11,
  Mushroom = 12,
  Stump = 13,
}

export default Decoration;

export const DECORATION_NAMES: Record<Decoration, string> = {
  [Decoration.Tree]: 'Tree',
  [Decoration.Pine]: 'Pine',
  [Decoration.Palm]: 'Palm',
  [Decoration.Cactus]: 'Cactus',
  [Decoration.Shrub]: 'Shrub',
  [Decoration.Grass]: 'Tall grass',
  [Decoration.Flower]: 'Flowers',
  [Decoration.Rock]: 'Rock',
  [Decoration.Boulder]: 'Boulder',
  [Decoration.Reed]: 'Reeds',
  [Decoration.Coral]: 'Coral',
  [Decoration.Ice]: 'Ice',
  [Decoration.Mushroom]: 'Mushrooms',
  [Decoration.Stump]: 'Stump',
};

/**
 * How many pieces of scenery a chunk carries. Enough to furnish it,
 * few enough that the ground is still mostly ground
 */
export const MIN_DECORATIONS = 8;
export const MAX_DECORATIONS = 12;

/**
 * What grows or lies about in each biome, rolled over uniformly.
 *
 * A kind may appear more than once in a list, which is how a biome
 * says what it is mostly made of: a taiga is pines with the odd rock,
 * not half pines and half rocks
 */
const DECORATIONS: Record<Biome, Decoration[]> = {
  [Biome.DeepOcean]: [Decoration.Coral],
  [Biome.Ocean]: [Decoration.Coral, Decoration.Rock],
  [Biome.CoralReef]: [Decoration.Coral, Decoration.Coral, Decoration.Rock],
  [Biome.Beach]: [Decoration.Palm, Decoration.Rock, Decoration.Shrub],
  [Biome.Mangrove]: [Decoration.Tree, Decoration.Reed, Decoration.Reed],
  [Biome.Swamp]: [Decoration.Reed, Decoration.Reed, Decoration.Mushroom, Decoration.Stump],
  [Biome.TropicalRainforest]: [Decoration.Tree, Decoration.Tree, Decoration.Mushroom],
  [Biome.TropicalSeasonalForest]: [Decoration.Tree, Decoration.Shrub, Decoration.Grass],
  [Biome.Savanna]: [Decoration.Grass, Decoration.Grass, Decoration.Tree, Decoration.Rock],
  [Biome.Desert]: [Decoration.Cactus, Decoration.Cactus, Decoration.Rock, Decoration.Boulder],
  [Biome.Shrubland]: [Decoration.Shrub, Decoration.Shrub, Decoration.Rock],
  [Biome.Grassland]: [Decoration.Grass, Decoration.Grass, Decoration.Flower, Decoration.Tree],
  [Biome.TemperateForest]: [Decoration.Tree, Decoration.Tree, Decoration.Stump, Decoration.Shrub],
  [Biome.TemperateRainforest]: [
    Decoration.Tree,
    Decoration.Tree,
    Decoration.Mushroom,
    Decoration.Stump,
  ],
  [Biome.ColdDesert]: [Decoration.Rock, Decoration.Boulder, Decoration.Shrub],
  [Biome.Taiga]: [Decoration.Pine, Decoration.Pine, Decoration.Rock],
  [Biome.Tundra]: [Decoration.Rock, Decoration.Shrub, Decoration.Ice],
  [Biome.Mountain]: [Decoration.Boulder, Decoration.Rock, Decoration.Pine],
  [Biome.AlpineTundra]: [Decoration.Rock, Decoration.Ice, Decoration.Shrub],
  // Nothing grows on it: bare stone and what the last eruption left
  [Biome.Volcano]: [Decoration.Boulder, Decoration.Boulder, Decoration.Rock],
  [Biome.Glacier]: [Decoration.Ice, Decoration.Ice, Decoration.Rock],
  [Biome.Woodland]: [Decoration.Tree, Decoration.Grass, Decoration.Flower],
  [Biome.Steppe]: [Decoration.Grass, Decoration.Grass, Decoration.Rock],
  [Biome.MontaneForest]: [Decoration.Pine, Decoration.Tree, Decoration.Boulder],
  [Biome.PolarOcean]: [Decoration.Ice, Decoration.Ice, Decoration.Coral],
  // Nowhere on the map, and nothing standing in it
  [Biome.Beyond]: [],
};

export function getBiomeDecorations(biome: Biome): Decoration[] {
  return DECORATIONS[biome];
}
