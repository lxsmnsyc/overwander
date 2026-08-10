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
   * TODO: behavior
   */
  LegendaryRaid = 2,
}

export default Landmark;

/**
 * Every landmark, for uniform rolls over the variants
 */
export const LANDMARKS: Landmark[] = [
  Landmark.ItemCache,
  Landmark.HiddenGrotto,
  Landmark.LegendaryRaid,
];

/**
 * Display names for the landmarks
 */
export const LANDMARK_NAMES: Record<Landmark, string> = {
  [Landmark.ItemCache]: 'Item Cache',
  [Landmark.HiddenGrotto]: 'Hidden Grotto',
  [Landmark.LegendaryRaid]: 'Legendary Raid',
};
