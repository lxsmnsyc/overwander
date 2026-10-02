import { SpawnRarity, getSpawnRarity } from '../biome';
import type { Items } from '../ids/items';
import { Species, getBaseFormSpecies, speciesDexNumber } from '../ids/species';
import { getItemForms } from '../items/form-items';
import { getSpeciesData } from '../species';
import { DuelBan } from './duel-bans';

/**
 * Staged by a raid like a legendary, but a line of its own rather than
 * one of the one-per-world kind, so a ban on legendaries lets it through
 */
const RAID_ONLY_LEGENDARIES = new Set<Species>([Species.Volcarona]);

/** What a duel's rules ask of each pokemon fielded */
export interface DuelSpeciesRules {
  /** The highest base stat total allowed, or 0 for none */
  maxBst: number;
  /** The `DuelBan` flags in force */
  bans: number;
}

/** The base stat total of one species or form */
export function baseStatTotal(species: Species): number {
  let total = 0;

  for (const stat of Object.values(getSpeciesData(species).stats)) {
    total += stat;
  }
  return total;
}

/** The forms of this species that one of these held items would put it into */
function heldForms(species: Species, items: Iterable<Items>): Species[] {
  const dex = speciesDexNumber(species);
  const forms: Species[] = [];

  for (const item of items) {
    for (const form of getItemForms(item)) {
      if (speciesDexNumber(form) === dex) {
        forms.push(form);
      }
    }
  }
  return forms;
}

/**
 * Why a pokemon cannot be fielded under these rules, or null. Its total
 * is the highest of any shape its held items put it into, since that is
 * the one it fights in
 */
export function duelRefusal(
  caught: { species: Species; items: Items[] },
  rules: DuelSpeciesRules,
): string | null {
  const base = getBaseFormSpecies(caught.species);
  const rarity = getSpawnRarity(base);

  if ((rules.bans & DuelBan.Mythical) !== 0 && rarity === SpawnRarity.Mythical) {
    return 'mythical';
  }
  if (
    (rules.bans & DuelBan.Legendary) !== 0 &&
    rarity === SpawnRarity.Special &&
    !RAID_ONLY_LEGENDARIES.has(base)
  ) {
    return 'legendary';
  }

  const forms = heldForms(caught.species, caught.items);

  if ((rules.bans & DuelBan.ItemForms) !== 0 && forms.length > 0) {
    return 'holds a form item';
  }
  if (rules.maxBst > 0) {
    let total = baseStatTotal(caught.species);

    for (const form of forms) {
      total = Math.max(total, baseStatTotal(form));
    }
    if (total > rules.maxBst) {
      return `stat total ${total}`;
    }
  }
  return null;
}
