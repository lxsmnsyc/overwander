import { TYPE_NAMES, Types } from '../constants/types';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { PLATE_RESALE } from './plates';
import { nameToIcon, registerItem } from './__create';

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

const NAMES: { [key in Items]?: string } = {
  [Items.DouseDrive]: 'Douse Drive',
  [Items.ShockDrive]: 'Shock Drive',
  [Items.BurnDrive]: 'Burn Drive',
  [Items.ChillDrive]: 'Chill Drive',
};

/** Held, never spent, and found rather than bought, the way a plate is */
export default function registerDrives(): void {
  for (const [item, type] of DRIVES) {
    const name = NAMES[item] ?? `Item #${item}`;

    registerItem(item, {
      name,
      type: ItemTypes.Held,
      description: `Techno Blast is ${TYPE_NAMES[type]}-type while it is held.`,
      icon: nameToIcon('held', name),
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: PLATE_RESALE,
    });
  }
}
