import * as v from 'valibot';
import { STAT_ORDER, Stages, Stats } from '../constants/stats';
import type Abilities from '../ids/abilities';
import type { Types } from '../constants/types';
import { isLegendarySpecies, isMythicalSpecies } from '../biome/__create';
import { Items } from '../ids/items';
import { ITEM_IDS, SPECIES_IDS, STAGE_IDS } from '../ids/names';
import { Species } from '../ids/species';
import { TYPE_CRYSTALS } from '../items/z-crystals';
import { getBaseSpecies, getSpeciesData, isWornForm } from '../species/__create';
import { isFullyEvolved } from '../species/evolution';
import { isTrueShadow } from '../species/true-shadow';
import { isUltraBeast } from '../species/ultra-beasts';
import { idOf } from '../yaml';
import totemsFile from './totems.yaml';

/**
 * Totem Pokémon: an oversized boss standing at a Totem landmark, an
 * Alolan trial site of its own.
 *
 * It starts the fight wrapped in an aura that raises its stats, calls
 * one ally of its own line once it is down to half, and leaves the
 * trial's Z-Crystal behind. Alola's twelve are written out in
 * `totems.yaml` as the games had them;
 * every other final stage is a Totem by rule, so a site in any biome
 * can hold the Totem of a line that lives there.
 */

/** What raising a stat by a stage is keyed by, for each stat a stage can raise */
const STAGE_OF: { [key in Stats]?: Stages } = {
  [Stats.Attack]: Stages.Attack,
  [Stats.Defense]: Stages.Defense,
  [Stats.SpecialAttack]: Stages.SpecialAttack,
  [Stats.SpecialDefense]: Stages.SpecialDefense,
  [Stats.Speed]: Stages.Speed,
};

/** A Totem's aura: how many stages each stat starts the fight raised by */
export type TotemAura = Partial<Record<Stages, number>>;

interface CanonTotem {
  aura: TotemAura;
  /** In meters and kilograms, the trial's own */
  height: number;
  weight: number;
  /** What the trial hands over */
  crystal: Items;
}

/** Every stat a stage raises, by the same amount */
function allStats(stages: number): TotemAura {
  return {
    [Stages.Attack]: stages,
    [Stages.Defense]: stages,
    [Stages.SpecialAttack]: stages,
    [Stages.SpecialDefense]: stages,
    [Stages.Speed]: stages,
  };
}

const CANON = v.strictObject({
  aura: v.record(v.string(), v.number()),
  height: v.number(),
  weight: v.number(),
  crystal: v.string(),
});

/** Alola's Totems, as the trials had them, written in `totems.yaml` */
const CANON_TOTEMS = new Map<Species, CanonTotem>();

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), CANON), totemsFile))) {
  const where = `totems.yaml: ${name}`;
  let aura: TotemAura = {};

  for (const [stage, stages] of Object.entries(written.aura)) {
    if (stage === 'all') {
      aura = { ...aura, ...allStats(stages) };
    } else {
      aura[idOf<Stages>(STAGE_IDS, stage, where)] = stages;
    }
  }
  CANON_TOTEMS.set(idOf<Species>(SPECIES_IDS, name, where), {
    aura,
    height: written.height,
    weight: written.weight,
    crystal: idOf<Items>(ITEM_IDS, written.crystal, where),
  });
}

/**
 * How much bigger a Totem by rule is than its species: twice as tall,
 * and four times as heavy, which is about how the trials' own grew
 * (Gumshoos, Mimikyu and Kommo-o among them)
 */
export const TOTEM_HEIGHT_SCALE = 2;
export const TOTEM_WEIGHT_SCALE = 4;

/** Whether this is one of Alola's own Totems rather than one by rule */
export function isCanonTotem(species: Species): boolean {
  return CANON_TOTEMS.has(species);
}

/**
 * Whether the species can stand as a Totem: a final stage that is met
 * rather than worn, and none of the kinds that hold lairs of their
 * own (legendaries, mythicals, Ultra Beasts and true shadows)
 */
export function isTotemSpecies(species: Species): boolean {
  if (CANON_TOTEMS.has(species)) {
    return true;
  }
  return (
    isFullyEvolved(species) &&
    !isWornForm(species) &&
    !isLegendarySpecies(species) &&
    !isMythicalSpecies(species) &&
    !isUltraBeast(species) &&
    !isTrueShadow(species)
  );
}

/** Whether the line is one stage long, which is what a Totem by rule's aura reads */
function standsAlone(species: Species): boolean {
  return getBaseSpecies(species) === species;
}

/**
 * The aura a Totem starts the fight in. One of Alola's carries the
 * trial's; any other raises its highest stat by 2 when its line is one
 * stage long, and its two highest by 1 when it grew into what it is.
 * HP is never raised, and a tie goes to the stat listed first
 */
export function getTotemAura(species: Species): TotemAura {
  // A schooled Wishiwashi is the trial's Totem all the same
  const canon = CANON_TOTEMS.get(
    species === Species.WishiwashiSchool ? Species.Wishiwashi : species,
  );

  if (canon != null) {
    return canon.aura;
  }

  const stats = getSpeciesData(species).stats;
  const ranked: Stats[] = [];

  for (const stat of STAT_ORDER) {
    if (STAGE_OF[stat] != null) {
      ranked.push(stat);
    }
  }
  ranked.sort((one, two) => stats[two] - stats[one]);

  if (standsAlone(species)) {
    return { [STAGE_OF[ranked[0]]!]: 2 };
  }
  return { [STAGE_OF[ranked[0]]!]: 1, [STAGE_OF[ranked[1]]!]: 1 };
}

/** How tall and how heavy a Totem of this species stands, in meters and kilograms */
export function getTotemSize(species: Species): { height: number; weight: number } {
  const canon = CANON_TOTEMS.get(species);

  if (canon != null) {
    return { height: canon.height, weight: canon.weight };
  }

  const data = getSpeciesData(species);

  return { height: data.height * TOTEM_HEIGHT_SCALE, weight: data.weight * TOTEM_WEIGHT_SCALE };
}

/**
 * Who a Totem calls: the first stage of its own line, or another of
 * itself when the line is one stage long
 */
export function getTotemAlly(species: Species): Species {
  return getBaseSpecies(species);
}

/**
 * The one ability a Totem-sized pokemon comes with, as Ultra Sun and
 * Ultra Moon hand them over: its hidden ability where it has one, and
 * its first otherwise
 */
export function getTotemAbility(species: Species): Abilities {
  const data = getSpeciesData(species);

  return data.hiddenAbilities?.[0] ?? data.abilities[0];
}

/** How many of a Totem-sized pokemon's stats are perfect, at the least */
export const TOTEM_PERFECT_STATS = 3;

const CRYSTAL_OF = (() => {
  const crystals = new Map<Types, Items>();

  for (const [item, crystal] of TYPE_CRYSTALS) {
    crystals.set(crystal.type, item);
  }
  return crystals;
})();

/**
 * The Z-Crystal a beaten Totem leaves: the trial's for one of Alola's,
 * and the crystal of its first type for any other
 */
export function getTotemCrystal(species: Species): Items {
  const canon = CANON_TOTEMS.get(species);

  if (canon != null) {
    return canon.crystal;
  }
  return CRYSTAL_OF.get(getSpeciesData(species).types[0]) ?? Items.NormaliumZ;
}

/**
 * The Totems a species met in the wild grows into: every final stage
 * its line reaches from here that can stand as one. A line that
 * branches, Eevee's for one, offers each branch
 */
export function getTotemsOf(species: Species): Species[] {
  const found: Species[] = [];
  const seen = new Set<Species>();
  const walk = [species];

  for (let next = walk.pop(); next != null; next = walk.pop()) {
    if (seen.has(next)) {
      continue;
    }
    seen.add(next);

    const roads = getSpeciesData(next).evolvesInto ?? [];

    if (roads.length === 0) {
      if (isTotemSpecies(next)) {
        found.push(next);
      }
      continue;
    }
    for (const road of roads) {
      walk.push(road.species);
    }
  }
  return found;
}
