/**
 * Interactive overworld points a chunk can host
 */
const enum Landmark {
  /**
   * A tucked-away hollow with rarer-than-usual spawns
   */
  HiddenGrotto = 0,
  /**
   * A lobby that stages legendary raid encounters
   */
  RaidLobby = 1,
  /**
   * A trainer standing in the overworld, ready to battle
   */
  NpcTrainer = 2,
  /**
   * A hidden item stash
   */
  ItemCache = 3,
  /**
   * A harvestable patch of berries
   */
  BerryPatch = 4,
  /**
   * A spot where water encounters can be fished up
   */
  FishingSpot = 5,
  /**
   * A shrine tied to mythical encounters
   */
  Shrine = 6,
  /**
   * A nest that periodically drives outbreak spawns of one species
   */
  Nest = 7,
}

export default Landmark;

/**
 * Every landmark, for uniform rolls over the variants
 */
export const LANDMARKS: Landmark[] = [
  Landmark.HiddenGrotto,
  Landmark.RaidLobby,
  Landmark.NpcTrainer,
  Landmark.ItemCache,
  Landmark.BerryPatch,
  Landmark.FishingSpot,
  Landmark.Shrine,
  Landmark.Nest,
];
