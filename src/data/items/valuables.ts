import { Items } from '../ids/items';
import { getItemData, itemText } from './__create';

/**
 * Valuables: dug out of the overworld and worth only what they
 * fetch. None of them are marketable — a nugget is found, never
 * bought — so their buy price stays zero and the market never lists
 * them. What a vendor pays is the `sell` figure in
 * `records/valuables.yaml`, which he will hand over for anything
 * priced whether or not he stocks it.
 *
 * They are the game's **gold** rather than its trinkets, and the
 * ladder below is what a walk is worth. It runs from a shell somebody
 * picked off a beach to a crown somebody dug out of a ruin, and the
 * band each is hidden in — see [`item-pool.ts`](../overworld/item-pool.ts)
 * — climbs with it: the cheap ones are what makes an ordinary walk pay
 * at all, and the dear ones are the reason to keep walking.
 */

/** The valuables, in the order they are worth it */
const VALUABLES: readonly Items[] = [
  Items.ShoalSalt,
  Items.ShoalShell,
  Items.PrettyWing,
  Items.TinyMushroom,
  Items.Pearl,
  Items.Stardust,
  Items.RelicCopper,
  Items.BigMushroom,
  Items.RareBone,
  Items.BigPearl,
  Items.StarPiece,
  Items.RelicSilver,
  Items.SlowpokeTail,
  Items.Nugget,
  Items.PearlString,
  Items.RelicGold,
  Items.BalmMushroom,
  Items.BigNugget,
  Items.RelicVase,
  Items.CometShard,
  Items.RelicBand,
  Items.RelicStatue,
  Items.RelicCrown,
];

const VALUABLE_SET = new Set<Items>(VALUABLES);

/**
 * What the ground hides, cheapest first, with what each fetches. The
 * price is read from the registry as it is walked, since it is only
 * there once the items are registered
 */
export const VALUABLE_SELL: Iterable<[item: Items, sell: number]> = {
  *[Symbol.iterator]() {
    for (const item of VALUABLES) {
      yield [item, getItemData(item).sell];
    }
  },
};

export function isValuable(item: Items): boolean {
  return VALUABLE_SET.has(item);
}

export function describeValuable(item: Items): string {
  if (!VALUABLE_SET.has(item)) {
    throw new Error(`No valuable description for item ${item}`);
  }
  return itemText('valuables', 'worth', { sell: getItemData(item).sell });
}
