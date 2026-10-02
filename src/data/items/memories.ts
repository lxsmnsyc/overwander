import { TYPE_NAMES, Types } from '../constants/types';
import { Items } from '../ids/items';
import { itemText } from './__create';

/**
 * The Memories: held discs that set the type of a Multi-Attack. The
 * battle side is in `src/battle/moves/judgment.ts`, beside the Plates
 * and Drives that do the same for Judgment and Techno Blast
 */
export const MEMORIES = new Map<Items, Types>([
  [Items.FightingMemory, Types.Fighting],
  [Items.FlyingMemory, Types.Flying],
  [Items.PoisonMemory, Types.Poison],
  [Items.GroundMemory, Types.Ground],
  [Items.RockMemory, Types.Rock],
  [Items.BugMemory, Types.Bug],
  [Items.GhostMemory, Types.Ghost],
  [Items.SteelMemory, Types.Steel],
  [Items.FireMemory, Types.Fire],
  [Items.WaterMemory, Types.Water],
  [Items.GrassMemory, Types.Grass],
  [Items.ElectricMemory, Types.Electric],
  [Items.PsychicMemory, Types.Psychic],
  [Items.IceMemory, Types.Ice],
  [Items.DragonMemory, Types.Dragon],
  [Items.DarkMemory, Types.Dark],
  [Items.FairyMemory, Types.Fairy],
]);

export function describeMemory(item: Items): string {
  const type = MEMORIES.get(item);

  if (type == null) {
    throw new Error(`Item #${item} is not a memory`);
  }
  return itemText('memories', 'memory', { type: TYPE_NAMES[type] });
}
