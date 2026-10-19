import type { CaughtPokemon } from '../../caught-record';
import type { Items } from '../../../data/ids/items';
import { ITEM_TYPE_ORDER, listItemsByType } from '../../../data/items';
import type { Species } from '../../../data/ids/species';
import { isEgg } from '../../egg';
import { inside, namedAll, ranges } from '../../../core/query';

/** The level nothing goes past, which is what `is:maxed` asks about */
export const MAX_LEVEL = 100;
/**
 * What a search knows that a record does not: which pokemon this one
 * is, and the handful of facts that live in another table.
 *
 * A list that has not read them leaves them out, and every mark that
 * needs one is then answered no — the same answer a field nobody has
 * heard of gets, and for the same reason
 */
export interface CatchContext {
  /** The id of the record being asked about */
  id?: string;
  /** The owner's buddy, as a catch id */
  buddy?: string;
  /** Everything of theirs standing on the auction block */
  listed?: ReadonlySet<string>;
  /** Everything of theirs drafted into a raid party */
  raiding?: ReadonlySet<string>;
  /** Every species they own more than one of */
  duplicates?: ReadonlySet<Species>;
}

/** What one field asks of one pokemon */
export type CatchField = (caught: CaughtPokemon, value: string, context: CatchContext) => boolean;

/**
 * Everything about a pokemon that an egg keeps to itself. The wrapper
 * is what makes that a rule rather than something each field has to
 * remember
 */
export function hidden(field: CatchField): CatchField {
  return (caught, value, context) => !isEgg(caught) && field(caught, value, context);
}

/** Whether a number answers a numeric term */
export function numeric(value: string, actual: number): boolean {
  for (const bounds of ranges(value)) {
    if (inside(bounds, actual)) {
      return true;
    }
  }
  return false;
}

export function idsFor(table: Record<number, string>, value: string): number[] {
  return namedAll(table, value);
}

/** Every registered item, which is the tray in one list */
export function everyItem(): Items[] {
  const items: Items[] = [];

  for (const type of ITEM_TYPE_ORDER) {
    items.push(...listItemsByType(type));
  }
  return items;
}
