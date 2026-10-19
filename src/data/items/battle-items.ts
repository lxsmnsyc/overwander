import { Stages } from '../constants/stats';
import { Items } from '../ids/items';

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
 * Every battle item, for callers that only care that it is one
 */
export const BATTLE_ITEMS: Items[] = [...X_ITEM_STAGES.keys(), Items.DireHit, Items.GuardSpec];

const BATTLE_ITEM_SET = new Set<Items>(BATTLE_ITEMS);

export function isBattleItem(item: Items): boolean {
  return BATTLE_ITEM_SET.has(item);
}
