import { TYPE_NAMES, Types } from '../constants/types';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { PLATE_RESALE } from './plates';
import { registerItem } from './__create';

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

/** Held, never spent, and found rather than bought, the way a plate is */
export default function registerMemories(): void {
  for (const [item, type] of MEMORIES) {
    registerItem(item, {
      name: `${TYPE_NAMES[type]} Memory`,
      type: ItemTypes.Held,
      description: `Multi-Attack is ${TYPE_NAMES[type]}-type while it is held.`,
      icon: `memories/${TYPE_NAMES[type].toLowerCase()}`,
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: PLATE_RESALE,
    });
  }
}
