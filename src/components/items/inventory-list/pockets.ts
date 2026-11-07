import { ItemFlags, ItemTypes, type Items } from '../../../data/ids/items';
import { isEscapeRope } from '../../../data/items/escape-rope';
import { getRaidSpecies } from '../../../data/items/raid-items';
import { getItemData } from '../../../data/items';
import { m } from '../../../i18n/paraglide/messages.js';

/** The items tab that holds every type at once, beside one tab per type */
export const ALL_ITEMS = -1;

/** The candy pocket, numbered past the item types like `ALL_ITEMS` */
export const CANDIES = -2;

/** An item's type, or null for one the registry does not know */
export function getItemType(item: Items): ItemTypes | null {
  try {
    return getItemData(item).type;
  } catch {
    return null;
  }
}

/**
 * Whether this is a thing that gets spent on a pokemon: a remedy, a
 * cap, a machine. Everything else in the bag is held, sold or carried
 * until somebody asks for it, and has nothing to press.
 *
 * A relic is `Usable` too but goes nowhere near a pokemon, so it is
 * kept out of this one and answered by `isRelic` instead
 */
export function isUsable(item: Items): boolean {
  try {
    return (getItemData(item).flags & ItemFlags.Usable) !== 0;
  } catch {
    return false;
  }
}

/**
 * Whether pressing it opens a raid rather than asking for a pokemon.
 * A relic is spent on a place, not on anything the bag could pick
 */
export function isRelic(item: Items): boolean {
  return getRaidSpecies(item) != null;
}

/** What each pocket of the bag is called: plural, since a pocket names a shelf */
export const POCKET_NAMES: Record<ItemTypes, () => string> = {
  [ItemTypes.Medicine]: m.item_pocket_medicine,
  [ItemTypes.PokeBall]: m.item_pocket_balls,
  [ItemTypes.Berry]: m.item_pocket_berries,
  [ItemTypes.Held]: m.item_pocket_held,
  [ItemTypes.Machine]: m.item_pocket_machines,
  [ItemTypes.KeyItem]: m.item_pocket_key,
  [ItemTypes.Evolution]: m.item_pocket_evolution,
  [ItemTypes.Valuable]: m.item_pocket_valuables,
  [ItemTypes.Training]: m.item_pocket_training,
  [ItemTypes.Fossil]: m.item_pocket_fossils,
};

/** What pressing this square is announced as doing, with the item named */
export function relicVerb(item: Items, named: string): string {
  if (isRelic(item)) {
    return m.item_open_raid_with({ item: named });
  }
  if (isEscapeRope(item)) {
    return m.item_climb_out_with({ item: named });
  }
  return isUsable(item) ? m.item_cell_verb({ verb: m.catch_use(), item: named }) : named;
}

/**
 * Each pocket's colour, so a pocket is found by colour as a box is.
 * Drawn from the theme where a token means the same thing (medicine is
 * health, a ball a catch); the rest share the box palette
 */
export const POCKET_TONES: Record<ItemTypes, string> = {
  [ItemTypes.Medicine]: 'var(--color-leaf)',
  [ItemTypes.PokeBall]: 'var(--color-ember)',
  [ItemTypes.Berry]: 'var(--color-gold)',
  [ItemTypes.Held]: 'var(--color-tide)',
  [ItemTypes.Machine]: 'var(--color-arcane)',
  [ItemTypes.KeyItem]: '#5e7291',
  [ItemTypes.Evolution]: '#2f8f8a',
  [ItemTypes.Valuable]: '#c4497e',
  [ItemTypes.Training]: '#e2702b',
  [ItemTypes.Fossil]: '#94643a',
};

/** The colour of All, which is every pocket at once */
export const ALL_TONE = 'var(--color-line)';

/** The colour of the candy jar, the gold of its tray */
export const CANDY_TONE = 'var(--color-gold)';
