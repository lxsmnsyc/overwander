import type { InventoryEntry } from '../../auth/inventory';
import { buyFromVendor, sellToVendor } from '../../auth/npcs';
import type { Items } from '../../data/ids/items';
import { VENDOR_TRADE_LIMIT } from '../../data/overworld/vendor';
import playEffect, { Effect } from '../../components/app/sound';
import { describeItem } from '../../components/details';
import type { PickItemInput } from '../../components/forms/pick-item';
import { ShopForm, type ShopPick } from '../../components/forms/shop';
import ItemSprite from '../../components/items/ItemSprite';
import { Detail, Meta } from '../../components/styled';
import { goldHeld, priceOf } from './shared';
import type { NpcScript, NpcVisit } from './create';

/** How many of one item the bag holds */
function countIn(bag: InventoryEntry[], item: Items): number {
  for (const entry of bag) {
    if (entry.item === item) {
      return entry.amount;
    }
  }
  return 0;
}

/** One side of the counter: his crate to buy from, or the bag to sell out of */
function tray(
  visit: NpcVisit,
  buying: boolean,
  gold: number,
  bag: InventoryEntry[],
  crate: InventoryEntry[],
  searched: { buy: string; sell: string },
): PickItemInput {
  return {
    player: visit.player,
    // Each side keeps its search through a trade, which draws the counter again
    query: buying ? searched.buy : searched.sell,
    onQuery: (typed) => {
      if (buying) {
        searched.buy = typed;
      } else {
        searched.sell = typed;
      }
    },
    verb: buying ? 'Buy' : 'Sell',
    entries: buying ? crate : bag,
    have: goldHeld(gold),
    counts: !buying,
    empty: buying ? 'His crate is empty.' : 'Nothing in your bag is worth anything to him.',
    filter: (entry) => buying || priceOf(entry.item, false) > 0,
    // Greyed rather than left out: the crate is the same whatever the purse holds
    blocked: (entry) => (buying && priceOf(entry.item, true) > gold ? 'More than you hold' : null),
    carried: (entry) => countIn(bag, entry.item),
    note: (entry) => `${priceOf(entry.item, buying)}g`,
    card: (entry) => (
      <Detail label={buying ? 'Costs' : 'He pays'}>{priceOf(entry.item, buying)} gold</Detail>
    ),
    // The purse decides a purchase and the bag a sale, both under the trade limit
    most: (entry) =>
      buying
        ? Math.max(
            1,
            Math.min(VENDOR_TRADE_LIMIT, Math.floor(gold / Math.max(1, priceOf(entry.item, true)))),
          )
        : Math.min(VENDOR_TRADE_LIMIT, entry.amount),
    sum: (item, amount) => (
      <Meta>
        {amount} × {priceOf(item, buying)} gold ={' '}
        <strong>{priceOf(item, buying) * amount} gold</strong>
      </Meta>
    ),
    refuse: (item, amount) =>
      buying && priceOf(item, true) * amount > gold ? 'More than you hold.' : null,
  };
}

/**
 * The vendor, and the chef and the geologist who keep the same counter:
 * the crate and the bag side by side, one transaction a line, until the
 * player steps back
 */
const shop: NpcScript = async (visit) => {
  // What he stocks is derived from the window, and the server derives it again
  const stock = visit.snapshot.getVendorStock(visit.cell);
  let line: string | undefined;
  let selling = false;
  const searched = { buy: '', sell: '' };

  for (;;) {
    const [gold, bag] = await Promise.all([visit.gold(), visit.bag()]);
    // The crate's count is how many he parts with at once: the limit is the trade's
    const crate: InventoryEntry[] = [];

    for (const item of stock) {
      crate.push({ user: visit.player, item, amount: VENDOR_TRADE_LIMIT });
    }

    const pick: ShopPick | null = await visit.form(
      ShopForm,
      {
        buy: tray(visit, true, gold, bag, crate, searched),
        sell: tray(visit, false, gold, bag, crate, searched),
        selling,
      },
      { line },
    );

    if (pick == null) {
      return;
    }

    const sold: boolean = pick[0];
    const [item, amount] = pick[1];
    const buying = !sold;

    selling = sold;
    const done = await (buying ? buyFromVendor : sellToVendor)(
      visit.snapshot,
      visit.cell,
      [[item, amount]],
      visit.npc,
    );

    if (done == null) {
      line = buying
        ? 'Cannot let it go for that. Check your purse.'
        : 'I will not take that. Is it still in your bag?';
      continue;
    }
    playEffect(buying ? Effect.ShopBuy : Effect.ShopSell);
    visit.notify({
      title: `${describeItem(item)}${amount > 1 ? ` ×${amount}` : ''}`,
      message: `${buying ? '−' : '+'}${priceOf(item, buying) * amount} gold`,
      art: () => <ItemSprite item={item} size={24} label="" />,
      tone: 'leaf',
    });
    visit.changed();
    line = 'Anything else?';
  }
};

export default shop;
