// A record keyed by a const enum is indexed by number once the keys
// have been round-tripped through Object.entries; tsc wants the
// assertion back, tsgolint resolves the enum to number and calls it
// redundant
// oxlint-disable typescript/no-unnecessary-type-assertion
import Landmark from './landmark';

/**
 * What a landmark is drawn as, where it is drawn as a thing at all.
 *
 * The ones a person keeps are not here: a market is its vendor and a
 * gym is its leader, and both stand about in charsets. Nor is the berry
 * patch, which grows its own plant. What is left used to be a letter in
 * a circle.
 */

/** The sheet, under the overworld sprite root. */
export const LANDMARK_SHEET = 'landmarks';

/**
 * The picture each landmark is drawn as. A landmark left out is one
 * somebody is standing on, or one that grows
 */
const PICTURES: Partial<Record<Landmark, string>> = {
  [Landmark.ItemCache]: 'cache',
  [Landmark.LegendaryLair]: 'lair',
  [Landmark.ShadowLair]: 'lair-rubble',
  [Landmark.Nest]: 'nest',
  [Landmark.Portal]: 'portal',
  [Landmark.GymSeat]: 'seat',
  [Landmark.AuctionBoard]: 'board',
  [Landmark.CaveMouth]: 'cave',
};

/**
 * What a landmark is drawn as from underneath, where it differs.
 *
 * Only the cave mouth does, and it is the only landmark that stands on
 * both layers at once: a hole in the hillside seen from the country
 * above, and the lit way out seen from the dark below. Everything else
 * underground is the same thing whichever side of it you are on
 */
const UNDERGROUND: Partial<Record<Landmark, string>> = {
  [Landmark.CaveMouth]: 'cave-exit',
};

/**
 * What a cache looks like once this player has been. Per player, the
 * way a picked berry patch is: a stash one trainer carried off is
 * still buried for the next
 */
const TAKEN: Partial<Record<Landmark, string>> = {
  [Landmark.ItemCache]: 'cache-taken',
};

/**
 * The picture one landmark is drawn as, in the state this player left
 * it in and on the layer they are standing on. Null for a landmark
 * that is drawn some other way.
 *
 * It used to read the biome and the cell as well, for the mouths a
 * lair was drawn with in cold or wet country and the two a shadow one
 * alternated between. A lair is one statue now, so neither is asked
 */
export default function landmarkPicture(
  kind: Landmark,
  taken = false,
  underground = false,
): string | null {
  if (taken) {
    const gone = TAKEN[kind];

    if (gone != null) {
      return gone;
    }
  }
  if (underground) {
    const below = UNDERGROUND[kind];

    if (below != null) {
      return below;
    }
  }
  return PICTURES[kind] ?? null;
}

/** Every picture the sheet is expected to carry. */
export function landmarkPictures(): string[] {
  return [
    ...new Set([
      ...Object.values(PICTURES),
      ...Object.values(TAKEN),
      ...Object.values(UNDERGROUND),
    ]),
  ];
}

/** Whether a landmark is drawn from the sheet rather than as a mark. */
export function hasLandmarkPicture(kind: Landmark): boolean {
  return PICTURES[kind] != null;
}
