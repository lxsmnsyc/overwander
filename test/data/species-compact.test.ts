import { describe, expect, it } from 'vitest';
import { getLearnSet, getSpeciesData } from '../../src/data/species/__create';
import {
  type LearnSetFile,
  type RecordFile,
  decodeLearnSet,
  decodeRecord,
} from '../../src/data/species/compact';
import { compactFiles, compactSource } from '../../src/data/species/source';

// The committed rows, by file name
const committed = import.meta.glob<string>('../../src/data/species/compact/*.json', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const records = import.meta.glob<RecordFile>('../../src/data/species/compact/*.records.json', {
  eager: true,
  import: 'default',
});
const learnSets = import.meta.glob<LearnSetFile>(
  '../../src/data/species/compact/*.learnsets.json',
  { eager: true, import: 'default' },
);

function fileOf(name: string): string | undefined {
  return committed[`../../src/data/species/compact/${name}`];
}

// Nothing else in this file registers species, so the source starts
// from an empty registry the way the generator does
const regions = compactSource();

describe('the compact species rows', () => {
  it('match the source, so nobody forgot pnpm species-compact', () => {
    for (const region of regions) {
      for (const [name, text] of compactFiles(region)) {
        expect(fileOf(name), name).toBe(text);
      }
    }
  });

  it('decode back into exactly what the source registered', () => {
    for (const region of regions) {
      for (const row of records[`../../src/data/species/compact/${region.name}.records.json`]) {
        const [species, data] = decodeRecord(row);

        expect(data, data.name).toEqual(getSpeciesData(species));
      }
      for (const row of learnSets[`../../src/data/species/compact/${region.name}.learnsets.json`]) {
        const [species, learnSet] = decodeLearnSet(row);

        expect(learnSet).toEqual(getLearnSet(species));
      }
    }
  });
});
