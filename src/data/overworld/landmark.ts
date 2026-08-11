/**
 * Interactive overworld points a chunk can host
 */
const enum Landmark {
  /**
   * A hidden item stash rolled from the item pool
   */
  ItemCache = 0,
  /**
   * A tucked-away hollow: yields either an uncommon/rare pokemon or
   * a luckier item cache
   */
  HiddenGrotto = 1,
  /**
   * A lobby that stages legendary raid encounters
   */
  LegendaryRaid = 2,
  /**
   * A lobby staging a shadow raid: usually a rare local species,
   * occasionally a legendary, and always a shadow boss
   */
  ShadowRaid = 3,
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
}

export default Landmark;

/**
 * Every landmark, for uniform rolls over the variants
 */
export const LANDMARKS: Landmark[] = [
  Landmark.ItemCache,
  Landmark.HiddenGrotto,
  Landmark.LegendaryRaid,
  Landmark.ShadowRaid,
  Landmark.BerryPatch,
  Landmark.TeamRocketStop,
  Landmark.Nest,
  Landmark.WanderingNpc,
];

/**
 * Display names for the landmarks
 */
export const LANDMARK_NAMES: Record<Landmark, string> = {
  [Landmark.ItemCache]: 'Item Cache',
  [Landmark.HiddenGrotto]: 'Hidden Grotto',
  [Landmark.LegendaryRaid]: 'Legendary Raid',
  [Landmark.ShadowRaid]: 'Shadow Raid',
  [Landmark.BerryPatch]: 'Berry Patch',
  [Landmark.TeamRocketStop]: 'Team Rocket Stop',
  [Landmark.Nest]: 'Nest',
  [Landmark.WanderingNpc]: 'Wandering NPC',
};
