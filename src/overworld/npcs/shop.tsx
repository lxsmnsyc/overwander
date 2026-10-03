import type { InventoryEntry } from '../../auth/inventory';
import { buyFromVendor, sellToVendor } from '../../auth/npcs';
import type { Items } from '../../data/ids/items';
import { VENDOR_TRADE_LIMIT } from '../../data/overworld/vendor';
import playEffect, { Effect } from '../../components/app/sound';
import { describeItem } from '../../components/details';
import { choiceForm } from '../../components/forms/choice';
import { PickItemForm } from '../../components/forms/pick-item';
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

/**
 * One side of the counter, line after line until the player steps
 * back: his crate to buy from, or the bag to sell out of. Each line is
 * one transaction, however many of it
 */
async function trade(visit: NpcVisit, buying: boolean): Promise<void> {
  // What he stocks is derived from the window, and the server derives it again
  const stock = visit.snapshot.getVendorStock(visit.cell);

  for (;;) {
    const [gold, bag] = await Promise.all([visit.gold(), visit.bag()]);
    // The crate's count is how many he parts with at once: the limit is the trade's
    const crate: InventoryEntry[] = [];

    for (const item of stock) {
      crate.push({ user: visit.player, item, amount: VENDOR_TRADE_LIMIT });
    }

    const pick = await visit.form(
      PickItemForm,
      {
        player: visit.player,
        verb: buying ? 'Buy' : 'Sell',
        entries: buying ? crate : bag,
        step: buying ? 'His crate' : 'Your bag',
        have: goldHeld(gold),
        counts: !buying,
        empty: buying ? 'His crate is empty.' : 'Nothing in your bag is worth anything to him.',
        filter: (entry) => buying || priceOf(entry.item, false) > 0,
        // Greyed rather than left out: the crate is the same whatever the purse holds
        blocked: (entry) =>
          buying && priceOf(entry.item, true) > gold ? 'More than you hold' : null,
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
                Math.min(
                  VENDOR_TRADE_LIMIT,
                  Math.floor(gold / Math.max(1, priceOf(entry.item, true))),
                ),
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
      },
      { leave: 'Back' },
    );

    if (pick == null) {
      return;
    }

    const [item, amount] = pick;
    const done = await (buying ? buyFromVendor : sellToVendor)(
      visit.snapshot,
      visit.cell,
      [[item, amount]],
      visit.npc,
    );

    if (done == null) {
      await visit.say(
        buying
          ? 'Cannot let it go for that. Check your purse.'
          : 'I will not take that. Is it still in your bag?',
      );
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
  }
}

/** The vendor, and the chef and the geologist who keep the same counter */
const shop: NpcScript = async (visit) => {
  let line: string | undefined;

  for (;;) {
    // Buying and selling are the same list asked in two directions
    const side = await visit.form(
      choiceForm<boolean>(),
      {
        choices: [
          { label: 'Buy', value: true },
          { label: 'Sell', value: false },
        ],
      },
      { line },
    );

    if (side == null) {
      return;
    }
    await trade(visit, side);
    line = 'Anything else?';
  }
};

export default shop;
