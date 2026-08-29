import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The trade items: what the mainline hands a pokemon before passing it
 * to somebody else, and what this game will ask for alongside a trade.
 *
 * They are **evolution items** here rather than held ones. The
 * mainline reads them at the moment of the trade, which is a moment
 * with nowhere to live in a game where an evolution is something a
 * player asks for from the catch sheet; what this game has instead is
 * a catch that remembers having changed hands. So a Kingdra is a
 * Seadra that has been traded *and* is handed a Dragon Scale, and both
 * halves are conditions the record can answer for itself.
 *
 * None of them can be spent yet: every line that asks for one — a
 * Slowking, a Steelix, a Porygon2 — belongs to a generation that is
 * not registered. They carry no price and no market listing until one
 * is, for the same reason the latent stones do not: a price is what
 * the market charges, and the market does not stock them.
 *
 * One item of the family is deliberately absent: **Metal Coat** is
 * already registered as the Steel type booster it also is, so the
 * evolution will read the same id the battle does rather than a second
 * copy of it.
 *
 * **Linking Cord** is the odd one out at the other end. It is not
 * handed to a pokemon before a trade, it is used instead of one, so it
 * is registered on its own below with a price and a market listing:
 * alone in the family, the evolutions it opens are ones this game
 * already has.
 */

/**
 * What a trade item is: the item, its name and the picture it is drawn
 * with. They share a shape because they share everything else — the
 * type, the flags and the pricelessness are the same for all of them
 */
const EVOLVES = 'Evolves the pokemon it is used on, where a line asks for it.';

const TRADE_ITEMS: [item: Items, name: string, icon: string, description: string][] = [
  [
    Items.KingsRock,
    "King's Rock",
    'kings-rock',
    '1/10 of its holder’s blows leave the target flinching. Also evolves a line that asks for it.',
  ],
  [Items.DragonScale, 'Dragon Scale', 'dragon-scale', EVOLVES],
  [Items.UpGrade, 'Up-Grade', 'up-grade', EVOLVES],
  [Items.DubiousDisc, 'Dubious Disc', 'dubious-disc', EVOLVES],
  [Items.Protector, 'Protector', 'protector', EVOLVES],
  [Items.Electirizer, 'Electirizer', 'electirizer', EVOLVES],
  [Items.Magmarizer, 'Magmarizer', 'magmarizer', EVOLVES],
  [Items.ReaperCloth, 'Reaper Cloth', 'reaper-cloth', EVOLVES],
  [
    Items.RazorClaw,
    'Razor Claw',
    'razor-claw',
    '2x its holder’s odds of a critical. Also evolves a line that asks for it.',
  ],
  [
    Items.RazorFang,
    'Razor Fang',
    'razor-fang',
    '1/10 of its holder’s blows leave the target flinching. Also evolves a line that asks for it.',
  ],
  [Items.PrismScale, 'Prism Scale', 'prism-scale', EVOLVES],
  [Items.DeepSeaTooth, 'Deep Sea Tooth', 'deep-sea-tooth', EVOLVES],
  [Items.DeepSeaScale, 'Deep Sea Scale', 'deep-sea-scale', EVOLVES],
  [Items.Sachet, 'Sachet', 'sachet', EVOLVES],
  [Items.WhippedDream, 'Whipped Dream', 'whipped-dream', EVOLVES],
];

/**
 * The trade items that are also held items.
 *
 * Each does something in a fight — a King's Rock and a Razor Fang
 * leave the target flinching, a Razor Claw sharpens what its holder
 * throws — and that is true whether or not the evolution it also gates
 * is reachable yet. So they carry the Holdable flag alongside the rest
 * of the family's, the way Metal Coat is one id doing two jobs. The
 * battle half is in
 * [`src/battle/items/gear.ts`](../../battle/items/gear.ts)
 */
const HELD_TRADE_ITEMS = new Set<Items>([Items.KingsRock, Items.RazorFang, Items.RazorClaw]);

export default function registerTradeItems(): void {
  // Priced and listed like an evolution stone, because that is what it
  // is used as: the four gen 1 lines that ask for a trade are the only
  // evolutions in this family a player can reach
  registerItem(Items.LinkingCord, {
    name: 'Linking Cord',
    description: 'Evolves a pokemon that would otherwise only evolve by being traded.',
    type: ItemTypes.Evolution,
    icon: 'evolutions/linking-cord',
    flags: ItemFlags.Usable | ItemFlags.Marketable,
    buy: 3000,
    sell: 1500,
  });

  for (const [item, name, icon, description] of TRADE_ITEMS) {
    registerItem(item, {
      name,
      description,
      type: ItemTypes.Evolution,
      icon: `evolutions/${icon}`,
      flags: HELD_TRADE_ITEMS.has(item) ? ItemFlags.Usable | ItemFlags.Holdable : ItemFlags.Usable,
      buy: 0,
      sell: 0,
    });
  }
}
