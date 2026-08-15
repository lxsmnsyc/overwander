import { STAT_NAMES, Stats } from '../constants/stats';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * The wings: one stat, three points of effort, and gone.
 *
 * Every other point of effort a pokemon has was paid for by a level
 * it took. A wing is the exception — it is found rather than earned,
 * and what it grants sits on top of the level's allowance rather than
 * out of it, so a wing is worth the same to a pokemon at level 5 as
 * to one at 100.
 *
 * The rules the server enforces are in
 * [`src/server/training.ts`](../../server/training.ts); this is what a
 * wing is and which stat it belongs to.
 */
export const WING_STATS = new Map<Items, Stats>([
  [Items.HealthWing, Stats.HP],
  [Items.MuscleWing, Stats.Attack],
  [Items.ResistWing, Stats.Defense],
  [Items.GeniusWing, Stats.SpecialAttack],
  [Items.CleverWing, Stats.SpecialDefense],
  [Items.SwiftWing, Stats.Speed],
]);

/**
 * What one wing is worth. Four points of effort buy one point of a
 * stat, so three is deliberately not a whole point on its own: wings
 * are a trickle, and the levels are the river
 */
export const WING_EFFORT = 3;

const NAMES: { [key in Items]?: string } = {
  [Items.HealthWing]: 'Health Wing',
  [Items.MuscleWing]: 'Muscle Wing',
  [Items.ResistWing]: 'Resist Wing',
  [Items.GeniusWing]: 'Genius Wing',
  [Items.CleverWing]: 'Clever Wing',
  [Items.SwiftWing]: 'Swift Wing',
};

export function isWing(item: Items): boolean {
  return WING_STATS.has(item);
}

export default function registerWings(): void {
  for (const [item, stat] of WING_STATS) {
    registerItem(item, {
      name: NAMES[item] ?? 'Wing',
      description: `Adds ${WING_EFFORT} ${STAT_NAMES[stat]} effort. Spent on use.`,
      type: ItemTypes.Training,
      // The wings are drawn on the medicine sheet, since that is what
      // they are: something a pokemon swallows for what it does to it
      icon: nameToIcon('medicine', NAMES[item] ?? 'Wing'),
      flags: ItemFlags.Usable | ItemFlags.Consumable,
      // Found on the wind rather than stocked: a shop that sold them
      // would sell training by the gold piece
      buy: 0,
      sell: 100,
    });
  }
}
