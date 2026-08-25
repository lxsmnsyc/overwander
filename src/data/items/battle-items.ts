import { Stages } from '../constants/stats';
import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { nameToIcon, registerItem } from './__create';

/**
 * The battle items: an X Attack, a Dire Hit, a Guard Spec.
 *
 * The mainline lets a trainer throw one in from the side of the fight.
 * Nothing here can be handed to a pokemon mid-battle, so each is
 * carried instead and answers the moment it was always for: a stat
 * being knocked down. What it does about that is in
 * [`src/battle/items/battle-items.ts`](../../battle/items/battle-items.ts).
 */

/**
 * The X items, and the stage each one puts back up
 */
export const X_ITEM_STAGES: Map<Items, Stages> = new Map([
  [Items.XAttack, Stages.Attack],
  [Items.XDefense, Stages.Defense],
  [Items.XSpAtk, Stages.SpecialAttack],
  [Items.XSpDef, Stages.SpecialDefense],
  [Items.XSpeed, Stages.Speed],
  [Items.XAccuracy, Stages.Accuracy],
]);

/**
 * What each one is for, said the way this engine spends it: every one
 * of them answers a stat being knocked down rather than being reached
 * for from a bag
 */
const DESCRIPTIONS: { [key in Items]?: string } = {
  [Items.XAttack]: '+2 Attack when its holder’s Attack is knocked down.',
  [Items.XDefense]: '+2 Defense when its holder’s Defense is knocked down.',
  [Items.XSpAtk]: '+2 Special Attack when its holder’s Special Attack is knocked down.',
  [Items.XSpDef]: '+2 Special Defense when its holder’s Special Defense is knocked down.',
  [Items.XSpeed]: '+2 Speed when its holder’s Speed is knocked down.',
  [Items.XAccuracy]: '+2 Accuracy when its holder’s Accuracy is knocked down.',
  [Items.DireHit]: 'Sharpens its holder’s criticals by 2 stages when any stat is knocked down.',
  [Items.GuardSpec]: 'Refuses the first stat drop anybody else tries on its holder.',
};

const NAMES: { [key in Items]?: string } = {
  [Items.XAttack]: 'X Attack',
  [Items.XDefense]: 'X Defense',
  [Items.XSpAtk]: 'X Sp. Atk',
  [Items.XSpDef]: 'X Sp. Def',
  [Items.XSpeed]: 'X Speed',
  [Items.XAccuracy]: 'X Accuracy',
  [Items.DireHit]: 'Dire Hit',
  [Items.GuardSpec]: 'Guard Spec',
};

/**
 * Every battle item, for callers that only care that it is one
 */
export const BATTLE_ITEMS: Items[] = [...X_ITEM_STAGES.keys(), Items.DireHit, Items.GuardSpec];

/**
 * What one costs. Less than a one-shot, because a one-shot answers
 * whatever happens to its holder and these answer one thing only:
 * a pokemon nobody bothers to weaken carries its X item all fight
 */
export const BATTLE_ITEM_PRICE = 1500;

const BATTLE_ITEM_RESALE = 0.5;

export function isBattleItem(item: Items): boolean {
  return NAMES[item] != null;
}

export default function registerBattleItems(): void {
  for (const item of BATTLE_ITEMS) {
    const name = NAMES[item] ?? `Item #${item}`;

    registerItem(item, {
      name,
      description: DESCRIPTIONS[item] ?? '',
      type: ItemTypes.Held,
      icon: nameToIcon('battle-items', name),
      flags: ItemFlags.Holdable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy: BATTLE_ITEM_PRICE,
      sell: BATTLE_ITEM_PRICE * BATTLE_ITEM_RESALE,
    });
  }
}
