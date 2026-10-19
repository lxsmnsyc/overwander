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
 *
 * What each kind is drawn as and where each grows is data, in
 * `src/data/overworld/decorations.yaml` and `biome-decorations.yaml`
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

export { Decoration };
export default Decoration;
