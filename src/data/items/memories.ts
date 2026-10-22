import { TYPE_NAMES } from '../constants/types';
import type { Items } from '../ids/items';
import { itemText } from './__create';
import recordsFile from './records/memories.yaml';
import { recordField } from './yaml';

/**
 * The Memories: held discs that set the type of a Multi-Attack. The
 * battle side is in `src/battle/moves/judgment.ts`, beside the Plates
 * and Drives that do the same for Judgment and Techno Blast
 */
export const MEMORIES = recordField('memories', recordsFile, 'moveType');

export function describeMemory(item: Items): string {
  const type = MEMORIES.get(item);

  if (type == null) {
    throw new Error(`Item #${item} is not a memory`);
  }
  return itemText('memories', 'memory', { type: TYPE_NAMES[type] });
}
