import { STAT_NAMES, Stats } from '../constants/stats';
import { Items } from '../ids/items';
import { itemText } from './__create';

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
export const POWER_ITEMS: Map<Items, Stats> = new Map([
  [Items.PowerWeight, Stats.HP],
  [Items.PowerBracer, Stats.Attack],
  [Items.PowerBelt, Stats.Defense],
  [Items.PowerLens, Stats.SpecialAttack],
  [Items.PowerBand, Stats.SpecialDefense],
  [Items.PowerAnklet, Stats.Speed],
]);

/**
 * The stat this item forces an egg to inherit, or null for anything
 * that is not a power item
 */
export function getPowerStat(item: Items): Stats | null {
  return POWER_ITEMS.get(item) ?? null;
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

export function describePowerItem(item: Items): string {
  const stat = POWER_ITEMS.get(item);

  if (stat == null) {
    throw new Error(`No power item line for item #${item}`);
  }
  return itemText('power-items', 'stat', { stat: STAT_NAMES[stat] });
}
