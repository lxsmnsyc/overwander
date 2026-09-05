/** What kind of meeting this was, which is what a catch remembers it by */
/**
 * How a pokemon came to be encountered
 */
export const enum EncounterType {
  /**
   * Met in the overworld through a chunk snapshot's spawns
   */
  Wild = 0,
  /**
   * Hatched from an egg
   */
  Hatched = 1,
  /**
   * Fought and caught in a legendary raid lobby
   */
  LegendaryRaid = 2,
  /**
   * Distributed by an event or mystery gift
   */
  Fateful = 3,
  /**
   * Taken off a beaten syndicate grunt: fought alone, a commoner at
   * a fixed low level, and shadowed. Not a raid, and a record calling
   * it one would say the wrong thing about where it came from
   */
  Rocket = 4,
  /**
   * Fought and caught in a shadow raid lobby. Its own kind because the
   * prize differs: usually one of the biome's rare species, handed
   * over lower, and it keeps the Shadow ability for good
   */
  ShadowRaid = 5,
  /**
   * Fought and caught in a mythical raid — the one a raid item called
   */
  MythicalRaid = 6,
  /**
   * Brought back out of a fossil — the only pokemon nobody met. A
   * record calling it wild would name a chunk the species has not
   * lived in for a very long time
   */
  Revived = 7,
}

/**
 * Whether the meeting was a raid of any kind. What a raid gives — the
 * species-day IV floor, a prize that never bolts — belongs to all of
 * them, so records tell them apart without listing each one everywhere
 */
export function isRaidEncounter(type: EncounterType): boolean {
  return (
    type === EncounterType.LegendaryRaid ||
    type === EncounterType.ShadowRaid ||
    type === EncounterType.MythicalRaid
  );
}

/**
 * Whether the meeting happened nowhere. A gift, an event pokemon and a
 * mythical called out of a relic were none of them standing anywhere,
 * so none has a place to name — to a player they are one thing
 */
export function isFatefulEncounter(type: EncounterType): boolean {
  return type === EncounterType.Fateful || type === EncounterType.MythicalRaid;
}

/**
 * What each kind is called where a record is shown
 */
export const ENCOUNTER_TYPE_NAMES: Record<EncounterType, string> = {
  [EncounterType.Wild]: 'Wild',
  [EncounterType.Hatched]: 'Hatched',
  [EncounterType.LegendaryRaid]: 'Legendary Raid',
  [EncounterType.Fateful]: 'Fateful encounter',
  [EncounterType.Rocket]: 'Taken from a syndicate',
  [EncounterType.ShadowRaid]: 'Shadow Raid',
  [EncounterType.MythicalRaid]: 'Mythical Raid',
  [EncounterType.Revived]: 'Revived from a fossil',
};
