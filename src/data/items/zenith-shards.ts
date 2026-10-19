import { TYPE_NAMES } from '../constants/types';
import type { Items } from '../ids/items';
import { ZENITH_SHAPES, type ZenithShape } from '../species/zeniths';
import { itemText } from './__create';

/**
 * The Zenith Shards: held for the Zenith a pokemon takes in a fight,
 * one shard for each pokemon that has one. Like a Mega Stone, holding
 * one is not enough on its own: a team reaches one Zenith a fight, and
 * the battle side in
 * [`src/battle/gimmicks/zenith.ts`](../../battle/gimmicks/zenith.ts)
 * picks which holder gets to.
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

/** Every shard's line names the pokemon that holds it and the types it takes */
export function describeZenithShard(item: Items): string {
  const shape = ZENITH_SHARDS.get(item);

  if (shape == null) {
    throw new Error(`${item} is not a Zenith Shard`);
  }
  const types: string[] = [];

  for (const type of shape.types) {
    types.push(TYPE_NAMES[type]);
  }
  return itemText('zenith-shards', 'shard', {
    article: /^[AEIOU]/.test(shape.holder) ? 'an' : 'a',
    holder: shape.holder,
    types: types.join('/'),
  });
}
