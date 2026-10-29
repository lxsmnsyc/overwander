import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import { STAT_ORDER, Stats } from '../../src/data/constants/stats';
import { getBaseFormSpecies } from '../../src/data/ids/forms';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { FORM_ITEMS } from '../../src/data/items/form-items';
import { getItemBiomes } from '../../src/data/overworld/biome-items';
import { getItemBand } from '../../src/data/overworld/item-pool';
import {
  getRegisteredSpecies,
  getSpeciesAbilities,
  getSpeciesData,
  getSpeciesForms,
  listMegas,
} from '../../src/data/species';
import { getMegaBase } from '../../src/data/species/megas';
import {
  NO_ZENITH,
  ZENITH_BONUS,
  ZENITH_SHAPES,
  getZenithForm,
  isLastStage,
  isZenithSpecies,
  listKeptShapes,
  listZenithForms,
  naturalSpecies,
  zenithShardId,
} from '../../src/data/species/zeniths';
import { getSpeciesRegion } from '../../src/data/species/regions';
import { isTrueShadow } from '../../src/data/species/true-shadow';
import Regions from '../../src/data/ids/regions';
import Abilities from '../../src/data/ids/abilities';

function totalOf(species: Species): number {
  let total = 0;

  for (const stat of STAT_ORDER) {
    total += getSpeciesData(species).stats[stat];
  }
  return total;
}

// A shape an ability of its own turns a pokemon into mid-fight. Its
// Mega is in reach of every pokemon that can have the ability
const ABILITY_SHAPES = new Map<Species, Abilities>([
  [Species.ZygardeComplete, Abilities.PowerConstruct],
]);

function addMegaBases(spoken: Set<Species>): void {
  for (const mega of listMegas()) {
    const base = getMegaBase(mega)!;
    const ability = ABILITY_SHAPES.get(base);

    spoken.add(base);
    if (ability == null) {
      continue;
    }
    for (const form of getSpeciesForms(getBaseFormSpecies(base))) {
      if (getSpeciesAbilities(form).has(ability)) {
        spoken.add(form);
      }
    }
  }
}

describe('Zeniths', () => {
  beforeAll(() => {
    registerGameData();
  });

  it('gives each a final stage with no other held shape', () => {
    // The pokemon a held item already changes: every Mega, and every
    // shape a form item puts something in
    const spoken = new Set<Species>(NO_ZENITH);

    addMegaBases(spoken);
    for (const forms of FORM_ITEMS.values()) {
      for (const form of forms) {
        spoken.add(getBaseFormSpecies(form));
      }
    }

    const seen = new Set<Species>();

    for (const shape of ZENITH_SHAPES) {
      expect(getSpeciesData(shape.base).baseForm, shape.holder).not.toBe(false);
      expect(isLastStage(shape.base), shape.holder).toBe(true);
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

  it("keeps its pokemon's HP, as a Mega does", () => {
    for (const shape of ZENITH_SHAPES) {
      expect(getSpeciesData(shape.zenith).stats[Stats.HP], shape.holder).toBe(
        getSpeciesData(shape.base).stats[Stats.HP],
      );
    }
    for (const form of listZenithForms()) {
      expect(getSpeciesData(form.zenith).stats[Stats.HP], form.holder).toBe(
        getSpeciesData(form.base).stats[Stats.HP],
      );
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
      for (const biome of getSpeciesData(shape.base).biomes) {
        expect(biomes, shape.holder).toContain(biome);
      }
    }
  });

  it("buries a revived fossil line's shard everywhere, since the line is met nowhere", () => {
    expect(getItemBiomes(Items.OmastarZenithShard)).toEqual([]);
    expect(getItemBiomes(Items.KabutopsZenithShard)).toEqual([]);
    expect(getItemBiomes(Items.ArcanineZenithShard).length).toBeGreaterThan(0);
  });

  it('puts each Zenith shape 100 above the shape it stands in for, in the same pokemon', () => {
    for (const form of listZenithForms()) {
      expect(totalOf(form.zenith), form.holder).toBe(totalOf(form.base) + ZENITH_BONUS);
      expect(getBaseFormSpecies(form.base), form.holder).toBe(getBaseFormSpecies(form.of));
      expect(getZenithForm(form.of, form.base), form.holder).toBe(form.zenith);
      expect(getSpeciesAbilities(form.base).has(form.ability), form.holder).toBe(false);
    }
  });

  it('gives every shape its pokemon is kept in a Zenith shape of its own', () => {
    // One shard for the whole line, so an Attack Deoxys holding it reaches a Zenith too
    for (const shape of ZENITH_SHAPES) {
      for (const kept of listKeptShapes(shape.base)) {
        expect(getZenithForm(shape.zenith, kept), shape.holder).not.toBeNull();
      }
    }
  });

  it('gives every other shape its pokemon is born or worn in a Zenith shape of its own', () => {
    // A Trash Wormadam or an East Sea Gastrodon holds the same shard. A
    // regional form waits for its own region's batch, a form that still
    // evolves (a White-Striped Basculin) has no Zenith, and a true shadow
    // is past putting right
    for (const shape of ZENITH_SHAPES) {
      for (const form of getSpeciesForms(shape.base)) {
        if (
          isZenithSpecies(form) ||
          isTrueShadow(form) ||
          !isLastStage(form) ||
          getSpeciesRegion(form) !== getSpeciesRegion(shape.base)
        ) {
          continue;
        }
        expect(getZenithForm(shape.zenith, form), getSpeciesData(form).name).not.toBeNull();
      }
    }
  });

  it('counts a pokemon that only turns into kept shapes of itself as its last stage', () => {
    expect(isLastStage(Species.Deoxys)).toBe(true);
    expect(isLastStage(Species.Rotom)).toBe(true);
    expect(isLastStage(Species.Growlithe)).toBe(false);
  });

  it('answers to the pokemon underneath, which is what a form change asks', () => {
    expect(naturalSpecies(Species.ArcanineZenith)).toBe(Species.Arcanine);
    expect(naturalSpecies(Species.Arcanine)).toBe(Species.Arcanine);
  });

  it('gives every eligible pokemon of a finished region its Zenith', () => {
    // Added to as each region's batch lands
    const finished = new Set<Regions>([
      Regions.Kanto,
      Regions.Johto,
      Regions.Hoenn,
      Regions.Sinnoh,
      Regions.Unova,
      Regions.Kalos,
    ]);
    const spoken = new Set<Species>(NO_ZENITH);

    addMegaBases(spoken);
    for (const forms of FORM_ITEMS.values()) {
      for (const form of forms) {
        spoken.add(getBaseFormSpecies(form));
      }
    }

    const having = new Set<Species>();

    for (const shape of ZENITH_SHAPES) {
      having.add(shape.base);
    }

    const missing: string[] = [];

    for (const species of getRegisteredSpecies()) {
      const data = getSpeciesData(species);

      if (
        data.baseForm === false ||
        data.worn === true ||
        !finished.has(getSpeciesRegion(species)) ||
        !isLastStage(species) ||
        spoken.has(species) ||
        having.has(species)
      ) {
        continue;
      }
      missing.push(data.name);
    }
    expect(missing).toEqual([]);
  });
});
