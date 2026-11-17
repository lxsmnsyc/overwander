import Abilities from '../ids/abilities';
import { getBaseFormSpecies } from '../ids/forms';
import { Items } from '../ids/items';
import { Species } from '../ids/species';
import { getItemForms } from '../items/form-items';
import { getShadowlessSpecies, getTrueShadowShape } from './true-shadow';

/**
 * The ability a shape brings on top of what the catch carries. Worn
 * rather than rolled: the base species' pool never holds a form's own
 * ability, so this is the only way it reaches a fight
 */
export const SHAPE_ABILITIES = new Map<Species, Abilities>([
  [Species.DialgaOrigin, Abilities.Unaware],
  [Species.PalkiaOrigin, Abilities.ShadowTag],
  [Species.GiratinaOrigin, Abilities.Levitate],
  [Species.ShayminSky, Abilities.SereneGrace],
  [Species.KyogrePrimal, Abilities.PrimordialSea],
  [Species.GroudonPrimal, Abilities.DesolateLand],
  [Species.TornadusTherian, Abilities.Regenerator],
  [Species.ThundurusTherian, Abilities.VoltAbsorb],
  [Species.LandorusTherian, Abilities.Intimidate],
  [Species.EnamorusTherian, Abilities.Overcoat],
  // Ogerpon has no ability of its own: each mask brings one, the Teal
  // with nothing in hand, and every Terastal shape brings Embody Aspect
  [Species.Ogerpon, Abilities.Defiant],
  [Species.OgerponWellspring, Abilities.WaterAbsorb],
  [Species.OgerponHearthflame, Abilities.MoldBreaker],
  [Species.OgerponCornerstone, Abilities.Sturdy],
  [Species.OgerponTealTera, Abilities.EmbodyAspect],
  [Species.OgerponWellspringTera, Abilities.EmbodyAspect],
  [Species.OgerponHearthflameTera, Abilities.EmbodyAspect],
  [Species.OgerponCornerstoneTera, Abilities.EmbodyAspect],
  [Species.TerapagosTerastal, Abilities.TeraShell],
]);

/** The shapes taken only in the middle of a fight, so never on a catch */
const MID_FIGHT_SHAPES = new Set<Species>([
  Species.OgerponTealTera,
  Species.OgerponWellspringTera,
  Species.OgerponHearthflameTera,
  Species.OgerponCornerstoneTera,
  Species.TerapagosTerastal,
]);

/** The shapes of Necrozma that can let their light out */
export const ULTRA_BURST_FROM = new Set<Species>([
  Species.NecrozmaDuskMane,
  Species.NecrozmaDawnWings,
]);

/** The crystal that lets a fused Necrozma burst, and what the burst wears */
export const ULTRA_BURST_ITEM = Items.UltranecroziumZ;
export const ULTRA_BURST_ABILITY = Abilities.Neuroforce;

/** A true shadow's shape brings what its counterpart's would */
export function shapeAbilityOf(species: Species): Abilities | undefined {
  return SHAPE_ABILITIES.get(getShadowlessSpecies(species) ?? species);
}

/** An ability a catch wears in battle, and the item that brings it, if one does */
export interface WornAbility {
  ability: Abilities;
  item: Items | null;
}

/**
 * What a catch wears in battle beyond the abilities it carries: its
 * own shape's ability, then what each form item it holds brings for
 * its species. Nothing repeats, and nothing in `carried`, the pool the
 * catch holds, is listed. It is the catch's own pool that is read and
 * not the species': a form's registered abilities are what it wears.
 *
 * The shapes taken only mid-fight are left out
 */
export function getWornAbilities(
  species: Species,
  items: readonly Items[],
  carried: readonly Abilities[] = [],
): WornAbility[] {
  const worn: WornAbility[] = [];
  const seen = new Set<Abilities>(carried);

  function add(ability: Abilities | undefined, item: Items | null): void {
    if (ability == null || seen.has(ability)) {
      return;
    }
    seen.add(ability);
    worn.push({ ability, item });
  }

  // The shape the catch is stored as
  if (!MID_FIGHT_SHAPES.has(species)) {
    add(shapeAbilityOf(species), null);
  }

  // The shape each form item it holds puts it in
  const base = getBaseFormSpecies(species);
  const shadow = getShadowlessSpecies(species) != null;

  for (const item of items) {
    if (item === ULTRA_BURST_ITEM) {
      if (ULTRA_BURST_FROM.has(species)) {
        add(ULTRA_BURST_ABILITY, item);
      }
      continue;
    }
    for (const form of getItemForms(item)) {
      if (getBaseFormSpecies(form) !== base) {
        continue;
      }
      // A true shadow takes its own colours of the shape, or none
      const shape = shadow ? getTrueShadowShape(form) : form;

      if (shape != null && !MID_FIGHT_SHAPES.has(shape)) {
        add(shapeAbilityOf(shape), item);
      }
    }
  }
  return worn;
}
