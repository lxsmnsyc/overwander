import * as v from 'valibot';
import Landmark from '../ids/landmarks';
import { LANDMARK_IDS } from '../ids/names';
import namesFile from '../text/en/landmarks.yaml';
import { idOf } from '../yaml';
import landmarksFile from './landmarks.yaml';

export default Landmark;

/**
 * The landmarks, read out of `landmarks.yaml` and
 * `text/en/landmarks.yaml`; the numbers are `ids/landmarks.ts`
 */
const LANDMARK = v.object({
  weight: v.pipe(v.number(), v.minValue(0)),
  picture: v.optional(v.string()),
  taken: v.optional(v.string()),
  underground: v.optional(v.string()),
});

/** A landmark's pictures, for `landmark-sprite.ts` */
export interface LandmarkArt {
  picture?: string;
  taken?: string;
  underground?: string;
}

/**
 * Every landmark, which is the list the country rolls from once its
 * biome has taken out what cannot be there
 */
export const LANDMARKS: Landmark[] = [];

/**
 * How often each is rolled out in the country, as a weight against
 * the rest of its biome's pool. A flat roll made a legendary's lair as
 * common as a berry patch, which is the whole of why this exists
 */
export const LANDMARK_WEIGHTS: Record<number, number> = {};

/** Display names for the landmarks */
export const LANDMARK_NAMES: Record<number, string> = {};

/** What each is drawn as, where it is drawn as a thing at all */
export const LANDMARK_ART: Record<number, LandmarkArt> = {};

for (const [name, written] of Object.entries(
  v.parse(v.record(v.string(), LANDMARK), landmarksFile),
)) {
  const landmark = idOf<Landmark>(LANDMARK_IDS, name, `landmarks.yaml: ${name}`);

  LANDMARKS.push(landmark);
  LANDMARK_WEIGHTS[landmark] = written.weight;
  LANDMARK_ART[landmark] = {
    picture: written.picture,
    taken: written.taken,
    underground: written.underground,
  };
}
LANDMARKS.sort((one, two) => one - two);

for (const [name, title] of Object.entries(v.parse(v.record(v.string(), v.string()), namesFile))) {
  LANDMARK_NAMES[idOf<Landmark>(LANDMARK_IDS, name, `text/en/landmarks.yaml: ${name}`)] = title;
}

// Every landmark the enum has is written down, so none is unrollable or nameless
for (const [name, landmark] of Object.entries(LANDMARK_IDS)) {
  if (!Object.hasOwn(LANDMARK_WEIGHTS, landmark) || !Object.hasOwn(LANDMARK_NAMES, landmark)) {
    throw new Error(`${name} needs a record in landmarks.yaml and a name in text/en`);
  }
}
