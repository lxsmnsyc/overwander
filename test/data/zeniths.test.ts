import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import { STAT_ORDER } from '../../src/data/constants/stats';
import { getBaseFormSpecies } from '../../src/data/ids/forms';
import type { Species } from '../../src/data/ids/species';
import { FORM_ITEMS } from '../../src/data/items/form-items';
import { getItemBiomes } from '../../src/data/overworld/biome-items';
import { getItemBand } from '../../src/data/overworld/item-pool';
import {
  getSpeciesAbilities,
  getSpeciesData,
  isFullyEvolved,
  listMegas,
} from '../../src/data/species';
import { getMegaBase } from '../../src/data/species/megas';
import {
  NO_ZENITH,
  ZENITH_BONUS,
  ZENITH_SHAPES,
  zenithShardId,
} from '../../src/data/species/zeniths';

function totalOf(species: Species): number {
  let total = 0;

  for (const stat of STAT_ORDER) {
    total += getSpeciesData(species).stats[stat];
  }
  return total;
}

describe('Zeniths', () => {
  beforeAll(() => {
    registerGameData();
  });

  it('gives each a final stage with no other held shape', () => {
    // The pokemon a held item already changes: every Mega, and every
    // shape a form item puts something in
    const spoken = new Set<Species>(NO_ZENITH);

    for (const mega of listMegas()) {
      spoken.add(getMegaBase(mega)!);
    }
    for (const forms of FORM_ITEMS.values()) {
      for (const form of forms) {
        spoken.add(getBaseFormSpecies(form));
      }
    }

    const seen = new Set<Species>();

    for (const shape of ZENITH_SHAPES) {
      expect(getSpeciesData(shape.base).baseForm, shape.holder).not.toBe(false);
      expect(isFullyEvolved(shape.base), shape.holder).toBe(true);
      expect(spoken.has(shape.base), shape.holder).toBe(false);
      expect(seen.has(shape.base), shape.holder).toBe(false);
      expect(getBaseFormSpecies(shape.zenith), shape.holder).toBe(getBaseFormSpecies(shape.base));
      expect(shape.shard, shape.holder).toBe(zenithShardId(shape.zenith));
      seen.add(shape.base);
    }
  });

  it('puts each exactly 100 points above its own base stat total', () => {
    for (const shape of ZENITH_SHAPES) {
      expect(totalOf(shape.zenith), shape.holder).toBe(totalOf(shape.base) + ZENITH_BONUS);
    }
  });

  it('wears an ability the line can never be born with', () => {
    for (const shape of ZENITH_SHAPES) {
      expect(getSpeciesAbilities(shape.base).has(shape.ability), shape.holder).toBe(false);
    }
  });

  it('buries each shard in the prized band, only where its line is met', () => {
    for (const shape of ZENITH_SHAPES) {
      const biomes = getItemBiomes(shape.shard);

      expect(getItemBand(shape.shard), shape.holder).toBe('prized');
      expect(biomes.length, shape.holder).toBeGreaterThan(0);
      for (const biome of getSpeciesData(shape.base).biomes) {
        expect(biomes, shape.holder).toContain(biome);
      }
    }
  });
});
