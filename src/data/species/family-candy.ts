import type Families from '../ids/families';
import Regions from '../ids/regions';
import { getRegisteredSpecies, getSpeciesData } from './__create';
import { REGION_NAMES, getSpeciesRegion } from './regions';

/**
 * Which picture a family's candy is.
 *
 * Candy is held by the family, so there is one picture per family and
 * it is named by the family's own id: nothing has to keep a table of
 * names beside the enum that already numbers them. The sheets are
 * filed by region the way the pokemon sheets are, so a bag draws a
 * dex's worth of candies from one image rather than all of them.
 *
 * ```
 * public/sprites/ui/candies/kanto/image.png
 * public/sprites/ui/candies/kanto/data.json
 * ```
 *
 * The pictures are palette swaps of one drawing, painted in the
 * colours of the family's base species. See
 * [`scripts/family-candies.ts`](../../../scripts/family-candies.ts).
 */

/** Where the sheets sit under the interface sprites. */
export const CANDY_SHEETS = 'candies';

/**
 * Which region's sheet a family is on: where its line first appeared,
 * which is its lowest dex number rather than its base species. A baby
 * added a generation later is still a Kanto line's candy
 */
export function familyCandyRegion(family: Families): Regions {
  let earliest = Number.POSITIVE_INFINITY;
  let region = Regions.Unknown;

  for (const species of getRegisteredSpecies()) {
    const data = getSpeciesData(species);

    if (data.family === family && data.dexNumber < earliest) {
      earliest = data.dexNumber;
      region = getSpeciesRegion(species);
    }
  }
  return region;
}

/** The sheet and picture one family's candy is, as `sheet/name`. */
export default function familyCandyIcon(family: Families): string {
  return `${CANDY_SHEETS}/${REGION_NAMES[familyCandyRegion(family)]}/${family}`;
}
