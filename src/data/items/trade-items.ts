import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { registerItem } from './__create';

/**
 * The trade items: what the mainline hands a pokemon before passing it
 * to somebody else, and what this game will ask for alongside a trade.
 *
 * Every one of them is **held**, not used. The mainline reads them at
 * the moment of the trade, which is a moment with nowhere to live in a
 * game where an evolution is something a player asks for from the
 * catch sheet; what this game has instead is a catch that remembers
 * having changed hands. So a Kingdra is a Seadra that has been traded
 * *and* is holding a Dragon Scale, and both halves are conditions the
 * record can answer for itself. That is why they carry Holdable rather
 * than Usable: the evolution asks what the pokemon is holding, and a
 * pokemon can only be handed a holdable item.
 *
 * Sixteen of the mainline's twenty-seven trade evolutions want an item
 * this way, so this is the shape of most of the family rather than a
 * corner of it.
 *
 * Four of them are asked for today: a King's Rock by Slowking and
 * Politoed, a Dragon Scale by Kingdra, an Up-Grade by Porygon2, and a
 * Metal Coat (registered elsewhere, see below) by Steelix and Scizor.
 * Each is worn off a wild pokemon of the line that wants it. The rest
 * wait on the generations that ask for them.
 *
 * None of them carries a price or a market listing, for the same
 * reason the latent stones do not: a price is what the market charges,
 * and the market does not stock them.
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
const EVOLVES = 'Evolves the pokemon holding it through a trade, where a line asks for it.';

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
  [Items.PrismScale, 'Prism Scale', 'prism-scale', EVOLVES],
  [Items.DeepSeaTooth, 'Deep Sea Tooth', 'deep-sea-tooth', EVOLVES],
  [Items.DeepSeaScale, 'Deep Sea Scale', 'deep-sea-scale', EVOLVES],
  [Items.Sachet, 'Sachet', 'sachet', EVOLVES],
  [Items.WhippedDream, 'Whipped Dream', 'whipped-dream', EVOLVES],
];

/**
 * The two that were filed here and are not trade items at all.
 *
 * A Razor Claw and a Razor Fang are **held** through a level, at
 * night: that is how a Sneasel becomes a Weavile and a Gligar a
 * Gliscor. Neither is handed over before a trade and neither is ever
 * spent, so neither is Usable, and their lines are a later
 * generation's anyway. They keep their pictures with the evolution
 * items because that is where the sheet packs them.
 *
 * Their lines say nothing yet, so the description is the fight and
 * only the fight, the way every other held item's is
 */
const HELD_EVOLUTION_ITEMS: [item: Items, name: string, icon: string, description: string][] = [
  [Items.RazorClaw, 'Razor Claw', 'razor-claw', '2x its holder’s odds of a critical.'],
  [
    Items.RazorFang,
    'Razor Fang',
    'razor-fang',
    '1/10 of its holder’s blows leave the target flinching.',
  ],
];

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
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: 0,
    });
  }

  for (const [item, name, icon, description] of HELD_EVOLUTION_ITEMS) {
    registerItem(item, {
      name,
      description,
      type: ItemTypes.Held,
      icon: `evolutions/${icon}`,
      flags: ItemFlags.Holdable,
      buy: 0,
      sell: 0,
    });
  }
}
