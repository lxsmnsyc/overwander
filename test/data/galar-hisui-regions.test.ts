import { describe, expect, it } from 'vitest';
import Regions from '../../src/data/ids/regions';
import { GALARIAN_FORMS, HISUIAN_FORMS, Species } from '../../src/data/ids/species';
import { REGIONS, getRegionSpan, getSpeciesRegion } from '../../src/data/species/regions';

describe('Galar and Hisui', () => {
  it('cover the Gen 8 dex numbers after Alola', () => {
    expect(REGIONS.slice(-2)).toEqual([Regions.Galar, Regions.Hisui]);
    expect(getRegionSpan(Regions.Galar)).toEqual([810, 898]);
    expect(getRegionSpan(Regions.Hisui)).toEqual([899, 905]);
    expect(getSpeciesRegion(Species.Grookey)).toBe(Regions.Galar);
    expect(getSpeciesRegion(Species.Calyrex)).toBe(Regions.Galar);
    expect(getSpeciesRegion(Species.Wyrdeer)).toBe(Regions.Hisui);
    expect(getSpeciesRegion(Species.BasculegionFemale)).toBe(Regions.Hisui);
  });

  it('file each regional form under the region that shaped it', () => {
    for (const form of GALARIAN_FORMS) {
      expect(getSpeciesRegion(form)).toBe(Regions.Galar);
    }
    for (const form of HISUIAN_FORMS) {
      expect(getSpeciesRegion(form)).toBe(Regions.Hisui);
    }
    expect(getSpeciesRegion(Species.Meowth)).toBe(Regions.Kanto);
    expect(getSpeciesRegion(Species.Darmanitan)).toBe(Regions.Unova);
  });
});
