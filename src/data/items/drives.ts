import { TYPE_NAMES, Types } from '../constants/types';
import { Items } from '../ids/items';
import { itemText } from './__create';

/**
 * The Drives: held cassettes that do nothing but set the type of a
 * Techno Blast. The battle side is in `src/battle/moves/judgment.ts`,
 * beside the Plates that do the same for Judgment
 */
export const DRIVES = new Map<Items, Types>([
  [Items.DouseDrive, Types.Water],
  [Items.ShockDrive, Types.Electric],
  [Items.BurnDrive, Types.Fire],
  [Items.ChillDrive, Types.Ice],
]);

export function describeDrive(item: Items): string {
  const type = DRIVES.get(item);

  if (type == null) {
    throw new Error(`Item #${item} is not a drive`);
  }
  return itemText('drives', 'drive', { type: TYPE_NAMES[type] });
}
