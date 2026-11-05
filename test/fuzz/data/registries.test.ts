import { beforeAll, describe, expect, it } from 'vitest';
import registerGameData from '../../../src/data';
import { getSpeciesSignature } from '../../../src/data/abilities/__create';
import { SPECIAL_ABILITIES } from '../../../src/data/constants/slots';
import type Abilities from '../../../src/data/ids/abilities';
import type Families from '../../../src/data/ids/families';
import {
  FORMS_PER_SPECIES,
  SPECIES_FORM_BAND,
  speciesDexNumber,
  speciesFormIndex,
} from '../../../src/data/ids/forms';
import type { Items } from '../../../src/data/ids/items';
import { ABILITY_IDS, FAMILY_IDS, ITEM_IDS } from '../../../src/data/ids/names';
import type { Species } from '../../../src/data/ids/species';
import {
  getBaseSpecies,
  getRegisteredFamilies,
  getRegisteredSpecies,
  getSpeciesData,
  listEvolutionLine,
} from '../../../src/data/species';
import { ZENITH_SHARDS } from '../../../src/data/items/zenith-shards';
import {
  ZENITH_SHAPES,
  ZENITH_SHARD_BAND,
  isLastStage,
  zenithShardId,
} from '../../../src/data/species/zeniths';

/**
 * The structural rules every registry entry holds, checked over every
 * entry rather than a sample. Each guards an id that reaches stored
 * player data, where a mistake costs a migration: a family id held
 * twice (ff2572159), a shard scheme rewritten four times in an hour
 * (2026-10-01), a line that walked a cycle (1ca566ee3)
 */
beforeAll(() => {
  registerGameData();
});

/** Where the invented abilities start, as `src/data/ids/abilities.ts` numbers them */
const INVENTED_ABILITY_BAND = 200000;

/** Where the engine's own abilities (Boss, Shadow, Totem and the rest) start */
const SPECIAL_ABILITY_BAND = 100000;

/** Which band an ability id sits in */
function readAbilityBand(ability: Abilities): 'invented' | 'special' | 'mainline' {
  const id: number = ability;

  if (id >= INVENTED_ABILITY_BAND) {
    return 'invented';
  }
  return id >= SPECIAL_ABILITY_BAND ? 'special' : 'mainline';
}

describe('family ids', () => {
  // A family whose region is not written yet holds its id empty, and
  // the species day passes over it (`getRegisteredFamilies`)
  it('run from 0 with no gap, each held by one family, and every species names one', () => {
    const ids = Object.values(FAMILY_IDS).sort((a, b) => a - b);
    const expected: Families[] = [];

    for (let id = 0; id < ids.length; id++) {
      expected.push(id);
    }
    expect(ids).toEqual(expected);
    for (const family of getRegisteredFamilies()) {
      expect(expected).toContain(family);
    }
  });

  it('name one first stage each', () => {
    const roots = new Map<Families, Set<Species>>();

    for (const species of getRegisteredSpecies()) {
      const data = getSpeciesData(species);

      // A form of a first stage is the same first stage in another
      // coat, and one that lays another's egg (Manaphy) is not a first stage
      if (
        data.evolvesFrom != null ||
        speciesFormIndex(species) !== 0 ||
        (data.eggSpecies != null && data.eggSpecies !== species)
      ) {
        continue;
      }
      const held = roots.get(data.family) ?? new Set<Species>();

      held.add(species);
      roots.set(data.family, held);
    }

    const shared: string[] = [];

    for (const family of getRegisteredFamilies()) {
      const held = roots.get(family);

      if (held?.size !== 1) {
        shared.push(`family ${family}: ${[...(held ?? [])].join(', ')}`);
      }
    }
    expect(shared).toEqual([]);
  });

  it('are the family of every stage of a line', () => {
    const strays: string[] = [];

    for (const species of getRegisteredSpecies()) {
      const root = getBaseSpecies(species);

      if (getSpeciesData(root).family !== getSpeciesData(species).family) {
        strays.push(`${species} is not in the family of ${root}`);
      }
    }
    expect(strays).toEqual([]);
  });
});

describe('id bands', () => {
  it('keep a species and its forms apart, each form numbered off a species there is', () => {
    const known = new Set(getRegisteredSpecies());
    const strays: string[] = [];

    for (const species of known) {
      const id: number = species;
      const dex = speciesDexNumber(species);
      const form = speciesFormIndex(species);

      if (id < SPECIES_FORM_BAND) {
        if (form !== 0 || dex !== id) {
          strays.push(`${species} reads as dex ${dex} form ${form}`);
        }
        continue;
      }
      // A form decodes to a dex number and a slot, and back to itself
      if (
        form < 1 ||
        form >= FORMS_PER_SPECIES ||
        SPECIES_FORM_BAND + dex * FORMS_PER_SPECIES + form !== id ||
        !known.has(dex)
      ) {
        strays.push(`${species} reads as dex ${dex} form ${form}`);
      }
      if (id >= ZENITH_SHARD_BAND) {
        strays.push(`${species} runs into the shard band`);
      }
    }
    expect(strays).toEqual([]);
  });

  it('keep the Zenith Shards in a band no other item reaches', () => {
    const strays: string[] = [];

    for (const item of Object.values(ITEM_IDS) as Items[]) {
      const id: number = item;

      if (id >= ZENITH_SHARD_BAND !== ZENITH_SHARDS.has(item)) {
        strays.push(`item ${item}`);
      }
    }
    expect(strays).toEqual([]);
  });

  it('keep the invented abilities above the engine’s, and the engine’s above the mainline', () => {
    const invented = new Set<Abilities>();
    const strays: string[] = [];

    for (const species of getRegisteredSpecies()) {
      const signature = getSpeciesSignature(species);

      if (signature != null) {
        invented.add(signature);
      }
    }
    for (const ability of Object.values(ABILITY_IDS) as Abilities[]) {
      const band = readAbilityBand(ability);

      if (invented.has(ability) && band !== 'invented') {
        strays.push(`invented ability ${ability} sits in the ${band} band`);
      }
      if (SPECIAL_ABILITIES.has(ability) !== (band === 'special')) {
        strays.push(`ability ${ability} sits in the ${band} band`);
      }
    }
    expect(strays).toEqual([]);
  });
});

/** A shard id back into the Zenith it is for: the dex number, then its slot counted down from 99 */
function decodeShard(shard: number): Species {
  const below = shard - ZENITH_SHARD_BAND;
  const dex = Math.floor(below / FORMS_PER_SPECIES);
  const slot = FORMS_PER_SPECIES - (below % FORMS_PER_SPECIES);

  return SPECIES_FORM_BAND + dex * FORMS_PER_SPECIES + slot;
}

describe('Zenith Shards', () => {
  it('turn into the Zenith they are for and back, one shard a Zenith', () => {
    const shards = new Set<number>();

    for (const shape of ZENITH_SHAPES) {
      const shard = zenithShardId(shape.zenith);

      expect(decodeShard(shard), shape.holder).toBe(shape.zenith);
      expect(ZENITH_SHARDS.get(shard)?.zenith, shape.holder).toBe(shape.zenith);
      shards.add(shard);
    }
    expect(shards.size).toBe(ZENITH_SHAPES.length);
  });
});

describe('evolution lines', () => {
  it('hold each species once and end', () => {
    const broken: string[] = [];

    for (const species of getRegisteredSpecies()) {
      const line: Species[] = [];

      for (const stage of listEvolutionLine(species)) {
        line.push(stage.species);
      }

      let ends = false;

      for (const stage of line) {
        if (isLastStage(stage)) {
          ends = true;
          break;
        }
      }
      if (new Set(line).size !== line.length) {
        broken.push(`${species} repeats a stage`);
      }
      if (!ends) {
        broken.push(`${species} never reaches a last stage`);
      }
    }
    expect(broken).toEqual([]);
  });
});
