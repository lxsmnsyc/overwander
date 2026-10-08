import * as v from 'valibot';
import type Awards from '../ids/awards';
import { AWARD_IDS, REGION_IDS } from '../ids/names';
import Regions from '../ids/regions';
import { idOf } from '../yaml';
import regionsFile from './regions.yaml';
import type { Species } from '../ids/species';
import { ALOLAN_FORMS, GALARIAN_FORMS, HISUIAN_FORMS, speciesDexNumber } from '../ids/species';
import { getRegisteredSpecies } from './__create';

/**
 * Which region a pokemon is from, and what that region is called.
 *
 * A dex number says it already — the first hundred and fifty-one are
 * Kanto's, and a generation added later takes the next stretch — so
 * this is a table of ranges, kept in `regions.yaml`, rather than a list
 * of a hundred and fifty entries that would have to be kept in step
 * with the dex.
 *
 * Anything outside every range is `Unknown`, which is where the three
 * that are drawn like pokemon without being pokemon land: Missingno,
 * an egg and a substitute are numbered past a hundred thousand for
 * exactly that reason.
 */

/** One region as `regions.yaml` writes it */
const REGION = v.object({
  dex: v.tuple([v.number(), v.number()]),
  milestones: v.optional(v.array(v.number())),
  medal: v.optional(v.string()),
});

/** What a region's dex chain asks for, where it has one */
export interface RegionDex {
  /** How many of the region's own each rung asks the dex to hold */
  milestones: number[];
  /** What the last rung hangs on the shelf */
  medal: Awards;
}

/** The dex numbers each region covers, ends included, in region order */
const RANGES: { region: Regions; from: number; to: number }[] = [];

/** Each region's dex chain, for the regions that have one */
export const REGION_DEXES: Partial<Record<Regions, RegionDex>> = {};

/**
 * What each region is called. It is also the directory its sprite
 * sheets are filed under, so these are lower case and stay put: they
 * are the files' names rather than data, and stay here with the enum
 */
export const REGION_NAMES: Record<Regions, string> = {
  [Regions.Unknown]: 'unknown',
  [Regions.Kanto]: 'kanto',
  [Regions.Johto]: 'johto',
  [Regions.Hoenn]: 'hoenn',
  [Regions.Sinnoh]: 'sinnoh',
  [Regions.Unova]: 'unova',
  [Regions.Kalos]: 'kalos',
  [Regions.Alola]: 'alola',
  [Regions.Galar]: 'galar',
  [Regions.Hisui]: 'hisui',
};

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), REGION), regionsFile))) {
  const where = `regions.yaml: ${name}`;
  const region = idOf(REGION_IDS, name, where);

  RANGES.push({ region, from: written.dex[0], to: written.dex[1] });
  if ((written.milestones == null) !== (written.medal == null)) {
    throw new Error(`${where}: a dex chain needs both milestones and a medal`);
  }
  if (written.milestones != null && written.medal != null) {
    REGION_DEXES[region] = {
      milestones: written.milestones,
      medal: idOf(AWARD_IDS, written.medal, where),
    };
  }
}
RANGES.sort((one, two) => one.region - two.region);

/** Every region there is, in order. */
export const REGIONS: Regions[] = [Regions.Unknown];

for (const range of RANGES) {
  REGIONS.push(range.region);
}

/** The dex numbers one region covers, ends included, or null for Unknown */
export function getRegionSpan(region: Regions): [from: number, to: number] | null {
  for (const range of RANGES) {
    if (range.region === region) {
      return [range.from, range.to];
    }
  }
  return null;
}

/** Regional forms, which belong to the region that shaped them rather than their dex number's */
const REGIONAL_FORMS = new Map<Species, Regions>();

for (const form of ALOLAN_FORMS) {
  REGIONAL_FORMS.set(form, Regions.Alola);
}
for (const form of GALARIAN_FORMS) {
  REGIONAL_FORMS.set(form, Regions.Galar);
}
for (const form of HISUIAN_FORMS) {
  REGIONAL_FORMS.set(form, Regions.Hisui);
}

export function getSpeciesRegion(species: Species): Regions {
  const regional = REGIONAL_FORMS.get(species);

  if (regional != null) {
    return regional;
  }
  // Any other form is of the same region as the species it is a form
  // of, so the ranges are asked about the dex number rather than the id
  const dex = speciesDexNumber(species);

  for (const range of RANGES) {
    if (dex >= range.from && dex <= range.to) {
      return range.region;
    }
  }
  return Regions.Unknown;
}

/**
 * Every registered pokemon of one region, in dex order. It answers off
 * the registry rather than off the ranges, so a region whose species
 * are not all written yet lists what there is
 */
export function getSpeciesByRegion(region: Regions): Species[] {
  const found: Species[] = [];

  for (const species of getRegisteredSpecies()) {
    if (getSpeciesRegion(species) === region) {
      found.push(species);
    }
  }
  return found.sort((one, two) => one - two);
}
