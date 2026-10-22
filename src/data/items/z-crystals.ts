import { TYPE_NAMES, type Types } from '../constants/types';
import type { Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import type { Species } from '../ids/species';
import { getMoveData } from '../moves/__create';
import { itemText } from './__create';
import recordsFile from './records/z-crystals.yaml';
import { readFamilyRecords } from './yaml';

/**
 * The Z-Crystals. Held, and never spent: the crystal turns one of the
 * holder's moves into its Z-Move as it is thrown, once a side a fight.
 * The battle side is in `src/battle/gimmicks/z-moves.ts`
 */

/** A crystal that turns any damaging move of one type */
export interface TypeCrystal {
  type: Types;
  zMove: Moves;
}

/** A crystal that turns one move of one line into that line's own Z-Move */
export interface SignatureCrystal {
  /** Who may use it, every form included */
  holders: Species[];
  move: Moves;
  zMove: Moves;
}

/** The crystals of one type, each turning any damaging move of it */
export const TYPE_CRYSTALS = new Map<Items, TypeCrystal>();

export const SIGNATURE_CRYSTALS = new Map<Items, SignatureCrystal>();

for (const [item, record] of readFamilyRecords('z-crystals', recordsFile)) {
  const { zType, zMove, holders, move } = record;

  if (zMove != null && zType != null) {
    TYPE_CRYSTALS.set(item, { type: zType, zMove });
  } else if (zMove != null && move != null) {
    SIGNATURE_CRYSTALS.set(item, { holders: holders ?? [], move, zMove });
  } else {
    throw new Error(`z-crystals: item #${item} needs a z-move and either a z-type or a move`);
  }
}

export function describeZCrystal(item: Items): string {
  const crystal = TYPE_CRYSTALS.get(item);

  if (crystal == null) {
    throw new Error(`Item #${item} is not a type crystal`);
  }
  return itemText('z-crystals', 'type', {
    type: TYPE_NAMES[crystal.type],
    zMove: getMoveData(crystal.zMove).name,
  });
}
