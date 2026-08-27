// A record keyed by a const enum is indexed by number once the keys
// have been round-tripped through Object.entries; tsc wants the
// assertion back, tsgolint resolves the enum to number and calls it
// redundant
// oxlint-disable typescript/no-unnecessary-type-assertion
import Biome from '../ids/biome';
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
 * The mouth a biome's lairs are drawn with.
 *
 * Only the lair varies, and only by what grows over a cave there: a
 * board reads a lair as somewhere to go in, and a mouth hung with ice
 * says which somewhere without a word of text. Everything else on the
 * sheet is the same object wherever it stands
 */
const BY_BIOME: Partial<Record<Biome, string>> = {
  // Cold enough for the mouth to hang with ice
  [Biome.Taiga]: 'lair-ice',
  [Biome.Tundra]: 'lair-ice',
  [Biome.AlpineTundra]: 'lair-ice',
  [Biome.Glacier]: 'lair-ice',
  [Biome.PolarOcean]: 'lair-ice',
  // Wet enough for the mouth to grow over
  [Biome.TropicalRainforest]: 'lair-moss',
  [Biome.TemperateRainforest]: 'lair-moss',
  [Biome.Mangrove]: 'lair-moss',
  [Biome.Swamp]: 'lair-moss',
  [Biome.Bog]: 'lair-moss',
};

/**
 * The two states a shadow lair is found in: choked with rubble, or
 * boarded over. Which of them a cell shows is the cell's own low bit,
 * so a lair keeps the mouth it had rather than changing every frame,
 * and two of them on one chunk are unlikely to match
 */
const SHADOW_MOUTHS = [PICTURES[Landmark.ShadowLair] ?? 'lair-rubble', 'lair-sealed'];

/**
 * The picture one landmark is drawn as, in the biome it stands in, the
 * cell it stands on and the state this player left it in. Null for a
 * landmark that is drawn some other way
 */
export default function landmarkPicture(
  kind: Landmark,
  biome: Biome,
  taken = false,
  cell = 0,
): string | null {
  if (taken) {
    const gone = TAKEN[kind];

    if (gone != null) {
      return gone;
    }
  }
  if (kind === Landmark.LegendaryLair) {
    return BY_BIOME[biome] ?? PICTURES[kind] ?? null;
  }
  if (kind === Landmark.ShadowLair) {
    return SHADOW_MOUTHS[Math.abs(cell) % SHADOW_MOUTHS.length];
  }
  return PICTURES[kind] ?? null;
}

/** Every picture the sheet is expected to carry. */
export function landmarkPictures(): string[] {
  return [
    ...new Set([
      ...Object.values(PICTURES),
      ...Object.values(TAKEN),
      ...Object.values(BY_BIOME),
      ...SHADOW_MOUTHS,
    ]),
  ];
}

/** Whether a landmark is drawn from the sheet rather than as a mark. */
export function hasLandmarkPicture(kind: Landmark): boolean {
  return PICTURES[kind] != null;
}
