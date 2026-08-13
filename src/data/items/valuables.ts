import { ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * Valuables: dug out of the overworld and worth only what they
 * fetch. None of them are marketable — a nugget is found, never
 * bought — so their buy price stays zero and the market never lists
 * them. What a vendor pays is the `sell` figure below, which he will
 * hand over for anything priced whether or not he stocks it.
 *
 * They are the game's **gold** rather than its trinkets, and the
 * ladder below is what a walk is worth. It runs from a shell somebody
 * picked off a beach to a crown somebody dug out of a ruin, and the
 * band each is hidden in — see [`item-pool.ts`](../overworld/item-pool.ts)
 * — climbs with it: the cheap ones are what makes an ordinary walk pay
 * at all, and the dear ones are the reason to keep walking.
 */

/**
 * What one is worth, in the order they are worth it.
 *
 * Every figure is the mainline's **doubled**, which is what the five
 * originals already were — a Pearl fetches 700 there and 1400 here —
 * so the ladder is one rule rather than a list of judgements. The two
 * exceptions are the shore finds: a Shoal Salt sells for ten in the
 * mainline, and twenty gold is beneath a player's notice in a game
 * where the cheapest ball costs two hundred, so the pair are priced at
 * what makes them worth bending down for.
 *
 * The top of the ladder is deliberately steep. A Relic Crown is worth
 * six hundred thousand — sixty raids, a hundred and twenty vitamins —
 * and it is drawn from the rarest band there is, about as often as a
 * Master Ball. It is the one thing in the game that is *only* gold and
 * still belongs beside the things gold cannot buy
 */
const VALUABLES: [item: Items, name: string, icon: string, sell: number][] = [
  // The shore and the roadside: what a walk turns up between the
  // things a walk is actually for
  [Items.ShoalSalt, 'Shoal Salt', 'shoal-salt', 200],
  [Items.ShoalShell, 'Shoal Shell', 'shoal-shell', 200],
  [Items.PrettyWing, 'Pretty Wing', 'pretty-wing', 200],
  [Items.TinyMushroom, 'Tiny Mushroom', 'tiny-mushroom', 500],
  [Items.Pearl, 'Pearl', 'pearl', 1400],
  [Items.Stardust, 'Stardust', 'stardust', 2000],
  [Items.RelicCopper, 'Relic Copper', 'relic-copper', 2000],
  // Worth the detour: a morning's walk in one pocket
  [Items.BigMushroom, 'Big Mushroom', 'big-mushroom', 5000],
  [Items.RareBone, 'Rare Bone', 'rare-bone', 5000],
  [Items.BigPearl, 'Big Pearl', 'big-pearl', 7500],
  [Items.StarPiece, 'Star Piece', 'star-piece', 9800],
  [Items.RelicSilver, 'Relic Silver', 'relic-silver', 10000],
  [Items.SlowpokeTail, 'Slowpoke Tail', 'slowpoke-tail', 13600],
  // The prize of the pile, and what a player saves a trip for
  [Items.Nugget, 'Nugget', 'nugget', 10000],
  [Items.PearlString, 'Pearl String', 'pearl-string', 15000],
  [Items.RelicGold, 'Relic Gold', 'relic-gold', 20000],
  [Items.BalmMushroom, 'Balm Mushroom', 'balm-mushroom', 25000],
  [Items.BigNugget, 'Big Nugget', 'big-nugget', 40000],
  // The ruins, which are a different kind of find altogether: one of
  // these pays for a season of everything else
  [Items.RelicVase, 'Relic Vase', 'relic-vase', 100000],
  [Items.CometShard, 'Comet Shard', 'comet-shard', 120000],
  [Items.RelicBand, 'Relic Band', 'relic-band', 200000],
  [Items.RelicStatue, 'Relic Statue', 'relic-statue', 400000],
  // And the one that stands with the Master Ball
  [Items.RelicCrown, 'Relic Crown', 'relic-crown', 600000],
];

/**
 * What the ground hides, cheapest first. It is the same list the
 * registrations are read off, so a valuable added above is a valuable
 * the pool can place without being listed twice
 */
export const VALUABLE_SELL = new Map<Items, number>(
  VALUABLES.map(([item, , , sell]) => [item, sell]),
);

export function isValuable(item: Items): boolean {
  return VALUABLE_SELL.has(item);
}

export default function registerValuables(): void {
  for (const [item, name, icon, sell] of VALUABLES) {
    registerItem(item, {
      name,
      type: ItemTypes.Valuable,
      icon: `valuables/${icon}`,
      // Found, never stocked: a vendor buys one and cannot sell one
      flags: 0,
      buy: 0,
      sell,
    });
  }
}
