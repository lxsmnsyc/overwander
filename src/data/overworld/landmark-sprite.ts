import type Landmark from './landmark';
import { LANDMARK_ART, type LandmarkArt } from './landmark';

/**
 * What a landmark is drawn as, where it is drawn as a thing at all.
 *
 * The ones a person keeps are not here: a market is its vendor and a
 * gym is its leader, and both stand about in charsets. Nor is the berry
 * patch, which grows its own plant. What is left used to be a letter in
 * a circle. The pictures are each landmark's row in `landmarks.yaml`
 */

/** The sheet, under the overworld sprite root. */
export const LANDMARK_SHEET = 'landmarks';

/** A landmark's pictures, or none for a number no landmark has */
function artOf(kind: Landmark): LandmarkArt {
  return Object.hasOwn(LANDMARK_ART, kind) ? LANDMARK_ART[kind] : {};
}

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
    const gone = artOf(kind).taken;

    if (gone != null) {
      return gone;
    }
  }
  if (underground) {
    const below = artOf(kind).underground;

    if (below != null) {
      return below;
    }
  }
  return artOf(kind).picture ?? null;
}

/** Every picture the sheet is expected to carry. */
export function landmarkPictures(): string[] {
  const pictures = new Set<string>();

  // Each kind in the order the old tables listed them: the plain ones,
  // then what a taken one looks like, then the ones seen from below
  for (const key of ['picture', 'taken', 'underground'] as const) {
    for (const art of Object.values(LANDMARK_ART)) {
      const picture = art[key];

      if (picture != null) {
        pictures.add(picture);
      }
    }
  }
  return [...pictures];
}

/** Whether a landmark is drawn from the sheet rather than as a mark. */
export function hasLandmarkPicture(kind: Landmark): boolean {
  return artOf(kind).picture != null;
}
