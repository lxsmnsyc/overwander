import { describe, expect, it } from 'vitest';
import Regions from '../../src/data/ids/regions';
import { PALDEAN_FORMS, Species } from '../../src/data/ids/species';
import { REGIONS, getRegionSpan, getSpeciesRegion } from '../../src/data/species/regions';

describe('Paldea', () => {
  it('covers the Gen 9 dex numbers after Hisui', () => {
    expect(REGIONS.at(-1)).toBe(Regions.Paldea);
    expect(getRegionSpan(Regions.Paldea)).toEqual([906, 1025]);
  });

  it('files each Paldean form under Paldea', () => {
    for (const form of PALDEAN_FORMS) {
      expect(getSpeciesRegion(form)).toBe(Regions.Paldea);
    }
    expect(getSpeciesRegion(Species.Tauros)).toBe(Regions.Kanto);
    expect(getSpeciesRegion(Species.Wooper)).toBe(Regions.Johto);
    // Filed beside Ursaluna, where the collection keeps its sprite
    expect(getSpeciesRegion(Species.UrsalunaBloodmoon)).toBe(Regions.Hisui);
  });
});
