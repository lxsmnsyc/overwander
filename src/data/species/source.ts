import type { Species } from '../ids/species';
import { getLearnSet, getRegisteredSpecies, getSpeciesData } from './__create';
import {
  type LearnSetFile,
  type RecordFile,
  encodeLearnSet,
  encodeRecord,
  serializeRows,
} from './compact';
import registerGen1Species from './gen-1';
import registerGen2Species from './gen-2';
import registerGen3Species from './gen-3';
import registerGen4Species from './gen-4';
import registerGen5Species from './gen-5';
import registerGen6Species from './gen-6';
import registerTrueShadowSpecies from './true-shadow';

/**
 * The species source files, run and cut into compact rows. Only the
 * generator and its test import this: the game loads the rows.
 */

/** Each region's file name and the source that registers it, in registration order */
export const SOURCE_REGIONS: [string, () => void][] = [
  ['gen-1', registerGen1Species],
  ['gen-2', registerGen2Species],
  ['gen-3', registerGen3Species],
  ['gen-4', registerGen4Species],
  ['gen-5', registerGen5Species],
  ['gen-6', registerGen6Species],
  // Last: each one is a copy of a counterpart that has to exist first
  ['true-shadow', registerTrueShadowSpecies],
];

export interface CompactRegion {
  name: string;
  records: RecordFile;
  learnSets: LearnSetFile;
}

/**
 * Every region's rows, from the source. A region is whatever its
 * source registered that nothing before it had
 */
export function compactSource(): CompactRegion[] {
  const regions: CompactRegion[] = [];
  const seen = new Set<Species>();

  // A region is read off what registering it added, so it has to start empty
  if (getRegisteredSpecies().length > 0) {
    throw new Error('compactSource needs an empty species registry');
  }

  for (const [name, register] of SOURCE_REGIONS) {
    register();

    const records: RecordFile = [];
    const learnSets: LearnSetFile = [];

    for (const species of getRegisteredSpecies()) {
      if (!seen.has(species)) {
        seen.add(species);
        records.push(encodeRecord(species, getSpeciesData(species)));
        learnSets.push(encodeLearnSet(species, getLearnSet(species)));
      }
    }
    regions.push({ name, records, learnSets });
  }
  return regions;
}

/** The two files a region writes, by path under `src/data/species/compact` */
export function compactFiles(region: CompactRegion): [string, string][] {
  return [
    [`${region.name}.records.json`, serializeRows(region.records)],
    [`${region.name}.learnsets.json`, serializeRows(region.learnSets)],
  ];
}
