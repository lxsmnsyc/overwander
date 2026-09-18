import { STAT_NAMES, Stats } from '../constants/stats';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * The power items: held gear whose whole effect is on the next
 * generation. Each one names a stat, and an egg copies that stat's
 * individual value straight off whichever parent was carrying it —
 * which is how a player breeds toward a stat rather than waiting for
 * one.
 *
 * The inheritance itself is in
 * [`src/overworld/breeding.ts`](../../overworld/breeding.ts).
 *
 * TODO: in the mainline these also hand their holder extra effort
 * values for fighting. That half is not written, because nothing here
 * asks an item what a fight was worth yet
 */
export const POWER_ITEMS: Map<Items, [name: string, stat: Stats]> = new Map([
  [Items.PowerWeight, ['Power Weight', Stats.HP]],
  [Items.PowerBracer, ['Power Bracer', Stats.Attack]],
  [Items.PowerBelt, ['Power Belt', Stats.Defense]],
  [Items.PowerLens, ['Power Lens', Stats.SpecialAttack]],
  [Items.PowerBand, ['Power Band', Stats.SpecialDefense]],
  [Items.PowerAnklet, ['Power Anklet', Stats.Speed]],
]);

/**
 * What one costs. Twice the gear price: a piece of gear wins a fight
 * that is happening, and one of these decides what a player's next
 * fifty pokemon are made of
 */
export const POWER_ITEM_PRICE = 10000;

const POWER_ITEM_RESALE = 0.5;

/**
 * The stat this item forces an egg to inherit, or null for anything
 * that is not a power item
 */
export function getPowerStat(item: Items): Stats | null {
  return POWER_ITEMS.get(item)?.[1] ?? null;
}

export function isPowerItem(item: Items): boolean {
  return POWER_ITEMS.has(item);
}

/**
 * The stat named by the first power item in the grip, or null when
 * there is none. A pokemon with room for two of them still names one
 * stat — the one it picked up first
 */
export function getHeldPowerStat(items: Items[]): Stats | null {
  for (const item of items) {
    const stat = getPowerStat(item);

    if (stat != null) {
      return stat;
    }
  }
  return null;
}

/**
 * What the brace doubles, and what it costs while it is worn.
 *
 * Effort here is paid out by the levels rather than earned a species
 * at a time, so there is no battle's worth of it to double. What the
 * brace multiplies instead is the effort a **wing or a vitamin**
 * grants, which is the one effort in the game that is found rather
 * than levelled. The Speed is the mainline's own price for it
 */
export const MACHO_BRACE_EFFORT = 2;
export const MACHO_BRACE_SPEED = 0.5;

export default function registerPowerItems(): void {
  registerItem(Items.MachoBrace, {
    name: 'Macho Brace',
    description:
      'A wing or vitamin used on its holder is worth 2x the effort, but its Speed is halved.',
    type: ItemTypes.Held,
    icon: nameToIcon('ev-items', 'Macho Brace'),
    flags: ItemFlags.Holdable | ItemFlags.Marketable,
    buy: POWER_ITEM_PRICE,
    sell: POWER_ITEM_PRICE * POWER_ITEM_RESALE,
  });

  for (const [item, [name, stat]] of POWER_ITEMS) {
    registerItem(item, {
      name,
      description: `An egg bred from its holder copies that parent’s ${STAT_NAMES[stat]}.`,
      type: ItemTypes.Held,
      // The sheet is named for what the mainline uses these for rather
      // than for what they do here
      icon: nameToIcon('ev-items', name),
      flags: ItemFlags.Holdable | ItemFlags.Marketable,
      buy: POWER_ITEM_PRICE,
      sell: POWER_ITEM_PRICE * POWER_ITEM_RESALE,
    });
  }
}
