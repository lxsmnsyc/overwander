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
 * Two items of the family are deliberately absent. **Metal Coat** is
 * already registered as the Steel type booster it also is, so the
 * evolution will read the same id the battle does rather than a second
 * copy of it. **Linking Cord** exists in the mainline to spare a
 * player the trade itself, and the trade is exactly what this game
 * asks for — an item that waived it would waive the only condition
 * these evolutions have.
 */

/**
 * What a trade item is: the item, its name and the picture it is drawn
 * with. They share a shape because they share everything else — the
 * type, the flags and the pricelessness are the same for all of them
 */
const TRADE_ITEMS: [item: Items, name: string, icon: string][] = [
  [Items.KingsRock, "King's Rock", 'kings-rock'],
  [Items.DragonScale, 'Dragon Scale', 'dragon-scale'],
  [Items.UpGrade, 'Up-Grade', 'up-grade'],
  [Items.DubiousDisc, 'Dubious Disc', 'dubious-disc'],
  [Items.Protector, 'Protector', 'protector'],
  [Items.Electirizer, 'Electirizer', 'electirizer'],
  [Items.Magmarizer, 'Magmarizer', 'magmarizer'],
  [Items.ReaperCloth, 'Reaper Cloth', 'reaper-cloth'],
  [Items.RazorClaw, 'Razor Claw', 'razor-claw'],
  [Items.RazorFang, 'Razor Fang', 'razor-fang'],
  [Items.PrismScale, 'Prism Scale', 'prism-scale'],
  [Items.DeepSeaTooth, 'Deep Sea Tooth', 'deep-sea-tooth'],
  [Items.DeepSeaScale, 'Deep Sea Scale', 'deep-sea-scale'],
  [Items.Sachet, 'Sachet', 'sachet'],
  [Items.WhippedDream, 'Whipped Dream', 'whipped-dream'],
];

/**
 * The one trade item that is also a held item.
 *
 * A King's Rock does something in a fight — it makes whatever its
 * holder throws liable to leave the target flinching — and that is
 * true whether or not the evolution it also gates is reachable yet.
 * So it carries the Holdable flag alongside the rest of the family's,
 * the way Metal Coat is one id doing two jobs. The battle half is in
 * [`src/battle/items/gear.ts`](../../battle/items/gear.ts)
 */
const HELD_TRADE_ITEMS = new Set<Items>([Items.KingsRock]);

export default function registerTradeItems(): void {
  for (const [item, name, icon] of TRADE_ITEMS) {
    registerItem(item, {
      name,
      type: ItemTypes.Evolution,
      icon: `evolutions/${icon}`,
      flags: HELD_TRADE_ITEMS.has(item) ? ItemFlags.Usable | ItemFlags.Holdable : ItemFlags.Usable,
      buy: 0,
      sell: 0,
    });
  }
}
