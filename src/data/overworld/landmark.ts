/**
 * Interactive overworld points a chunk can host
 */
const enum Landmark {
  /**
   * A hidden item stash rolled from the item pool
   */
  ItemCache = 0,
  /**
   * Something happening rather than something buried: a grotto, a
   * dust cloud, water rippling, a shadow overhead. Which of them the
   * cell is showing depends on the biome and turns over every hour,
   * and any of them may be a pokemon
   */
  Phenomenon = 1,
  /**
   * A legendary's lair: the place it lives rather than the pokemon
   * itself. Which lairs a chunk can hold comes from its biome, and
   * the lair decides which legendary is at home there
   */
  LegendaryLair = 2,
  /**
   * A lair with something wrong in it. It stages one of the biome's
   * own lairs where there is one, and otherwise a rare local species
   * standing in a lair of no particular name — always a shadow boss
   */
  ShadowLair = 3,
  /**
   * A patch of berries, ripe once per landmark window
   */
  BerryPatch = 4,
  /**
   * A Team Rocket checkpoint: a grunt who bars the way for three
   * hours and fights whoever accepts
   */
  TeamRocketStop = 5,
  /**
   * A nest: somewhere a species of the biome leaves an egg. It holds
   * one for half a day rather than a quarter hour, so finding one is
   * worth walking to
   */
  Nest = 6,
  /**
   * A spot people pass through: which of them is standing there
   * changes every six hours, and each has their own business with a
   * player who stops
   */
  WanderingNpc = 7,
  /**
   * A way through to somewhere else. It does nothing on its own — a
   * Portal Key is what opens one — and where it goes is another portal
   * of the biome the traveller names, which is what makes the network
   * a network rather than a teleport
   */
  Portal = 8,
}

export default Landmark;

/**
 * Every landmark, for uniform rolls over the variants
 */
export const LANDMARKS: Landmark[] = [
  Landmark.ItemCache,
  Landmark.Phenomenon,
  Landmark.LegendaryLair,
  Landmark.ShadowLair,
  Landmark.BerryPatch,
  Landmark.TeamRocketStop,
  Landmark.Nest,
  Landmark.WanderingNpc,
  Landmark.Portal,
];

/**
 * Display names for the landmarks
 */
export const LANDMARK_NAMES: Record<Landmark, string> = {
  [Landmark.ItemCache]: 'Item Cache',
  [Landmark.Phenomenon]: 'Phenomenon',
  [Landmark.LegendaryLair]: 'Legendary Raid',
  [Landmark.ShadowLair]: 'Shadow Raid',
  [Landmark.BerryPatch]: 'Berry Patch',
  [Landmark.TeamRocketStop]: 'Team Rocket Stop',
  [Landmark.Nest]: 'Nest',
  [Landmark.WanderingNpc]: 'Wandering NPC',
  [Landmark.Portal]: 'Portal',
};
