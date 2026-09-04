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
 * Sixteen of the mainline's twenty-seven trade evolutions want an item
 * this way, so this is the shape of most of the family rather than a
 * corner of it.
 *
 * Most of them cannot be spent yet: the line that asks for one, a
 * Slowking or a Steelix or a Porygon2, belongs to a generation that
 * is not registered. Those carry no price and no market listing, for
 * the same reason the latent stones do not: a price is what the
 * market charges, and the market does not stock them.
 *
 * The **Deep Sea Tooth** and the **Deep Sea Scale** are the exception
 * now that Clamperl is registered. A shell opens into one of two
 * pokemon and the item is which, so both are priced and listed the
 * way the Linking Cord is: the branch is a choice a player makes,
 * not a thing they wait for.
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
  [Items.PrismScale, 'Prism Scale', 'prism-scale', EVOLVES],
  [Items.Sachet, 'Sachet', 'sachet', EVOLVES],
  [Items.WhippedDream, 'Whipped Dream', 'whipped-dream', EVOLVES],
];

/**
 * The trade items that are also held items.
 *
 * A King's Rock leaves the target flinching, and that is true whether
 * or not the evolution it also gates is reachable yet. So it carries
 * the Holdable flag alongside the rest of the family's, the way Metal
 * Coat is one id doing two jobs. The battle half is in
 * [`src/battle/items/gear.ts`](../../battle/items/gear.ts)
 */
const HELD_TRADE_ITEMS = new Set<Items>([Items.KingsRock]);

/**
 * The two Clamperl asks for. They are trade items like the rest, and
 * the only ones a player can spend today, so they are stocked and
 * priced where the others are not
 */
const CLAMPERL_ITEMS: [item: Items, name: string, icon: string, description: string][] = [
  [
    Items.DeepSeaTooth,
    'Deep Sea Tooth',
    'deep-sea-tooth',
    'Opens a Clamperl into the one with the teeth.',
  ],
  [
    Items.DeepSeaScale,
    'Deep Sea Scale',
    'deep-sea-scale',
    'Opens a Clamperl into the one with the scales.',
  ],
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
      flags: HELD_TRADE_ITEMS.has(item) ? ItemFlags.Usable | ItemFlags.Holdable : ItemFlags.Usable,
      buy: 0,
      sell: 0,
    });
  }

  for (const [item, name, icon, description] of CLAMPERL_ITEMS) {
    registerItem(item, {
      name,
      description,
      type: ItemTypes.Evolution,
      icon: `evolutions/${icon}`,
      flags: ItemFlags.Usable | ItemFlags.Marketable,
      buy: 3000,
      sell: 1500,
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
