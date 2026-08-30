import Regions from '../ids/regions';
import type { Species } from '../ids/species';
import { getRegisteredSpecies } from './__create';

/**
 * Which region a pokemon is from, and what that region is called.
 *
 * A dex number says it already — the first hundred and fifty-one are
 * Kanto's, and a generation added later takes the next stretch — so
 * this is a table of ranges rather than a list of a hundred and fifty
 * entries that would have to be kept in step with the dex.
 *
 * Anything outside every range is `Unknown`, which is where the three
 * that are drawn like pokemon without being pokemon land: Missingno,
 * an egg and a substitute are numbered past a hundred thousand for
 * exactly that reason.
 */

/** The dex numbers each region covers, ends included. */
const RANGES: { region: Regions; from: number; to: number }[] = [
  { region: Regions.Kanto, from: 1, to: 151 },
  { region: Regions.Johto, from: 152, to: 251 },
];

/**
 * What each region is called. It is also the directory its sprite
 * sheets are filed under, so these are lower case and stay put
 */
export const REGION_NAMES: Record<Regions, string> = {
  [Regions.Unknown]: 'unknown',
  [Regions.Kanto]: 'kanto',
  [Regions.Johto]: 'johto',
};

/** Every region there is, in order. */
export const REGIONS: Regions[] = [Regions.Unknown, Regions.Kanto, Regions.Johto];

/** The dex numbers one region covers, ends included, or null for Unknown */
export function getRegionSpan(region: Regions): [from: number, to: number] | null {
  const range = RANGES.find((one) => one.region === region);

  return range == null ? null : [range.from, range.to];
}

export function getSpeciesRegion(species: Species): Regions {
  // Widened on purpose: a dex number is what the ranges are written in
  const dex: number = species;

  return RANGES.find((range) => dex >= range.from && dex <= range.to)?.region ?? Regions.Unknown;
}

/**
 * Every registered pokemon of one region, in dex order. It answers off
 * the registry rather than off the ranges, so a region whose species
 * are not all written yet lists what there is
 */
export function getSpeciesByRegion(region: Regions): Species[] {
  return getRegisteredSpecies()
    .filter((species) => getSpeciesRegion(species) === region)
    .sort((one, two) => one - two);
}
