import * as v from 'valibot';
import type Biome from '../ids/biome';
import { isMythicalSpecies } from '../biome';
import { BIOME_NAMES } from '../biome/names';
import Lairs from '../ids/lairs';
import { BIOME_IDS, LAIR_IDS, SPECIES_IDS } from '../ids/names';
import type { Species } from '../ids/species';
import { getTrueShadowCounterpart } from '../species/true-shadow';
import namesFile from '../text/en/lairs.yaml';
import { idOf, idsOf } from '../yaml';
import biomeLairsFile from './biome-lairs.yaml';
import lairsFile from './lairs.yaml';

/**
 * The lairs: the places a legendary is found. A raid landmark stages a
 * lair its biome can host, and the lair decides who is at home.
 *
 * The data is in `lairs.yaml`, `biome-lairs.yaml` and
 * `text/en/lairs.yaml`; the numbers are `ids/lairs.ts`.
 */
const LAIR = v.object({
  species: v.array(v.string()),
  underground: v.optional(v.boolean()),
  reserved: v.optional(v.boolean()),
});

/**
 * Who lives in each one. A lair stages its own residents and no
 * others, which is what makes travelling to a particular lair worth
 * doing. Nearly all of them hold a single legendary; the Burned Tower
 * holds the three beasts, so which one is at home is a roll. A
 * legendary may be at home in more than one lair
 */
export const LAIR_SPECIES: Record<number, Species[]> = {};

/** What each is called, by lair */
export const LAIR_NAMES: Record<number, string> = {};

/**
 * Every lair there is but the reserved ones, in the order they are
 * numbered
 */
export const EVERY_LAIR: Lairs[] = [];

/**
 * The lairs whose real place is underground: a cave, a buried chamber
 * or a cavern inside a mountain. A cave stages the ones its biome
 * hosts and nothing else, and the surface keeps them too
 */
const SUBTERRANEAN_LAIRS = new Set<Lairs>();

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), LAIR), lairsFile))) {
  const where = `lairs.yaml: ${name}`;
  const lair = idOf(LAIR_IDS, name, where);

  LAIR_SPECIES[lair] = idsOf<Species>(SPECIES_IDS, written.species, where);
  if (written.underground === true) {
    SUBTERRANEAN_LAIRS.add(lair);
  }
  if (written.reserved !== true) {
    EVERY_LAIR.push(lair);
  }
}
EVERY_LAIR.sort((one, two) => one - two);

for (const [name, title] of Object.entries(v.parse(v.record(v.string(), v.string()), namesFile))) {
  LAIR_NAMES[idOf(LAIR_IDS, name, `text/en/lairs.yaml: ${name}`)] = title;
}

// Every lair the enum has is written down, so none reads as nameless or empty
for (const [name, lair] of Object.entries(LAIR_IDS)) {
  if (!Object.hasOwn(LAIR_SPECIES, lair) || !Object.hasOwn(LAIR_NAMES, lair)) {
    throw new Error(`${name} needs a row in lairs.yaml and a name in text/en/lairs.yaml`);
  }
}

/**
 * The lairs the **world** may stage: every one whose residents are
 * legendaries.
 *
 * A mythical's lair is left out, because a relic is the only way to
 * one. It is what keeps a Mew off the end of Giovanni's party, and
 * what a landmark draws from. `EVERY_LAIR` still holds all of them,
 * since a pool that has to keep lair species out has to know about
 * every lair there is
 */
export const EVERY_STAGED_LAIR: Lairs[] = (() => {
  const staged: Lairs[] = [];

  lairs: for (const lair of EVERY_LAIR) {
    for (const species of LAIR_SPECIES[lair]) {
      if (isMythicalSpecies(species)) {
        continue lairs;
      }
    }
    staged.push(lair);
  }
  return staged;
})();

const STAGED_LAIRS = new Set<Lairs>(EVERY_STAGED_LAIR);

/**
 * Which lairs each biome can host, in the order a landmark draws from
 * them. The order is part of the shared world, so it is the biome's
 * list as written rather than anything sorted
 */
const BIOME_LAIRS = new Map<Biome, Lairs[]>();

for (const [name, lairs] of Object.entries(
  v.parse(v.record(v.string(), v.array(v.string())), biomeLairsFile),
)) {
  const where = `biome-lairs.yaml: ${name}`;

  BIOME_LAIRS.set(idOf(BIOME_IDS, name, where), idsOf<Lairs>(LAIR_IDS, lairs, where));
}

/**
 * The lairs this biome can host, in the order they are drawn from.
 * Filtered rather than trusted: a mythical's lair listed here by
 * mistake would put one on the map, and the relic is the only way to
 * one
 */
export function getBiomeLairs(biome: Biome): Lairs[] {
  const lairs: Lairs[] = [];

  for (const lair of BIOME_LAIRS.get(biome) ?? []) {
    if (STAGED_LAIRS.has(lair)) {
      lairs.push(lair);
    }
  }
  return lairs;
}

/** Whether the lair's real place is underground */
export function isSubterraneanLair(lair: Lairs): boolean {
  return SUBTERRANEAN_LAIRS.has(lair);
}

/**
 * The lairs whose place is the water itself: a lake, or the sea over a
 * flooded cavern. They stand only on water, so a Lake Acuity is never
 * a field
 */
const AQUATIC_LAIRS = new Set<Lairs>([
  Lairs.LakeAcuity,
  Lairs.LakeVerity,
  Lairs.LakeValor,
  Lairs.MarineCave,
  Lairs.SeaTemple,
]);

/**
 * The lairs on an island out at sea, which stand on the water as well
 * as on the ground: a lair at sea is the island being there
 */
const ISLAND_LAIRS = new Set<Lairs>([
  Lairs.SeafoamIslands,
  Lairs.FarawayIsland,
  Lairs.WhirlIslands,
  Lairs.IslandCave,
  Lairs.SouthernIsland,
  Lairs.BirthIsland,
  Lairs.FullmoonIsland,
  Lairs.NewmoonIsland,
  Lairs.NavelRock,
]);

/**
 * Whether the lair's place may be on this cell, by whether it is water.
 * Every lair that is neither on the water nor an island stays off it,
 * so a Mt. Ember is never the open sea
 */
export function lairStandsOn(lair: Lairs, water: boolean): boolean {
  if (ISLAND_LAIRS.has(lair)) {
    return true;
  }
  return AQUATIC_LAIRS.has(lair) === water;
}

/** The lairs the caves under this biome can host */
export function getCaveLairs(biome: Biome): Lairs[] {
  const lairs: Lairs[] = [];

  for (const lair of getBiomeLairs(biome)) {
    if (SUBTERRANEAN_LAIRS.has(lair)) {
      lairs.push(lair);
    }
  }
  return lairs;
}

/**
 * Everyone at home in the lair
 */
export function getLairResidents(lair: Lairs): Species[] {
  return LAIR_SPECIES[lair];
}

/**
 * Which of a lair's residents a raid stages, from a roll the whole
 * chunk shares. `allowed` narrows to the ones that can be staged at
 * all, and the caller has already checked that one of them can be
 */
export function pickLairSpecies(
  lair: Lairs,
  allowed: (species: Species) => boolean,
  roll: number,
): Species {
  const residents: Species[] = [];

  for (const species of getLairResidents(lair)) {
    if (allowed(species)) {
      residents.push(species);
    }
  }

  return residents[Math.abs(roll) % residents.length];
}

/**
 * Every lair a species is at home in, in the order they are numbered,
 * and empty for anything that has no place of its own. A true shadow
 * is at home where its counterpart is
 */
export function getSpeciesLairs(species: Species): Lairs[] {
  const resident = getTrueShadowCounterpart(species) ?? species;

  return EVERY_LAIR.filter((lair) => LAIR_SPECIES[lair].includes(resident));
}

/**
 * What a raid on this landmark is called.
 *
 * A lair is named after the place: **Seafoam Islands**, shadowed or
 * not — a shadow of the place is still that place, so it is only the
 * name with a word in front of it. A shadow raid that reached for one
 * of the biome's rare species instead stands in no lair at all, so it
 * is named after the ground it is standing on: **Shadow Woodland
 * Lair**
 */
export function getLairTitle(lair: Lairs | null, biome: Biome, shadow: boolean): string {
  const place = lair == null ? `${BIOME_NAMES[biome]} Lair` : LAIR_NAMES[lair];

  return shadow ? `Shadow ${place}` : place;
}

export default Lairs;
