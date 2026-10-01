import { TYPE_NAMES } from '../constants/types';
import { ItemFlags, ItemTypes, type Items } from '../ids/items';
import { ZENITH_SHAPES, type ZenithShape } from '../species/zeniths';
import { REGION_NAMES, getSpeciesRegion } from '../species/regions';
import { registerItem } from './__create';
import { MEGA_STONE_RESALE } from './mega-stones';

/**
 * The Zenith Shards: held for the Zenith a pokemon takes in a fight,
 * one shard for each pokemon that has one. Like a Mega Stone, holding
 * one is not enough on its own: a team reaches one Zenith a fight, and
 * the battle side in
 * [`src/battle/items/zeniths.ts`](../../battle/items/zeniths.ts) picks
 * which holder gets to.
 *
 * Each shard is buried only where its own line lives, so finding it
 * means going to that pokemon's ground.
 */
export const ZENITH_SHARDS = (() => {
  const shards = new Map<Items, ZenithShape>();

  for (const shape of ZENITH_SHAPES) {
    shards.set(shape.shard, shape);
  }
  return shards;
})();

/**
 * The icon a shard is drawn with, which the item icon script tints per
 * Zenith. The shards keep sheets of their own, one per region, so they
 * stay apart from the held items and easy to find
 */
export function zenithShardIcon(shape: ZenithShape): string {
  const name = shape.holder.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');

  return `zenith/${REGION_NAMES[getSpeciesRegion(shape.base)]}/${name}`;
}

/** Held, never spent, and never listed: a shard is dug up rather than bought */
export default function registerZenithShards(): void {
  for (const [item, shape] of ZENITH_SHARDS) {
    const { holder } = shape;
    const types: string[] = [];

    for (const type of shape.types) {
      types.push(TYPE_NAMES[type]);
    }

    registerItem(item, {
      name: `${holder} Zenith Shard`,
      description: `Lets ${/^[AEIOU]/.test(holder) ? 'an' : 'a'} ${holder} holding it reach its ${types.join('/')} Zenith. Only one pokemon on a team reaches its Zenith in a fight.`,
      type: ItemTypes.Held,
      icon: zenithShardIcon(shape),
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: MEGA_STONE_RESALE,
    });
  }
}
