import { TYPE_NAMES } from '../constants/types';
import type { Items } from '../ids/items';
import { itemText } from './__create';
import recordsFile from './records/drives.yaml';
import { recordField } from './yaml';

/**
 * The Drives: held cassettes that do nothing but set the type of a
 * Techno Blast. The battle side is in `src/battle/moves/judgment.ts`,
 * beside the Plates that do the same for Judgment
 */
export const DRIVES = recordField('drives', recordsFile, 'moveType');

export function describeDrive(item: Items): string {
  const type = DRIVES.get(item);

  if (type == null) {
    throw new Error(`Item #${item} is not a drive`);
  }
  return itemText('drives', 'drive', { type: TYPE_NAMES[type] });
}
