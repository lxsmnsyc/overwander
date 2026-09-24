import { type JSX, createSignal } from 'solid-js';
import type { InventoryEntry } from '../../../../auth/inventory';
import { buyFromVendor, sellToVendor } from '../../../../auth/npcs';
import type { Items } from '../../../../data/ids/items';
import { VENDOR_TRADE_LIMIT } from '../../../../data/overworld/vendor';
import { describeItem } from '../../../details';
import InventoryPicker, { type ItemAmount } from '../../../items/InventoryPicker';
import ItemSprite from '../../../items/ItemSprite';
import {
  Badge,
  Detail,
  DialogActions,
  Meta,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
  useToast,
} from '../../../styled';
import { type CounterProps, priceOf, refusal, useSaying } from '../shared';
import { readable } from '../../../app/resource-reads';

/** Which side of the counter is open */
const enum Side {
  Buy = 0,
  Sell = 1,
}

/** The vendor, and the chef who keeps the same counter */
export default function Vendor(props: CounterProps): JSX.Element {
  const said = useSaying();
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);
  const [side, setSide] = createSignal<number>(Side.Buy);

  /**
   * What he is carrying. It is derived from the window he is, so the
   * crate needs no read of its own, and the server derives it again
   * before it takes a coin
   */
  const stock = (): Items[] => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    return snapshot == null || standing == null ? [] : snapshot.getVendorStock(standing[0]);
  };

  /**
   * The crate as a list the picker can read: the same shape a bag has,
   * so buying and selling are the same list asked in two directions.
   *
   * What stands in for a stack's count is how many he will part with
   * at once. He has as many potions as anyone wants, and the limit is
   * the trade's rather than the crate's
   */
  const crate = (): InventoryEntry[] => {
    const entries: InventoryEntry[] = [];

    for (const item of stock()) {
      entries.push({ user: props.player, item, amount: VENDOR_TRADE_LIMIT });
    }
    return entries;
  };

  /**
   * How many of it the player is carrying. It is what the crate cannot
   * say, and what a player buying a third potion is deciding with
   */
  const carrying = (item: Items): number => {
    for (const entry of readable(props.bag) ?? []) {
      if (entry.item === item) {
        return entry.amount;
      }
    }
    return 0;
  };

  /**
   * One line, one transaction, however many of it: the crate takes a
   * count under the tray and the whole line lands or none of it does
   */
  const trade = (item: Items, amount: number, buyingIt: boolean): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }

    const picks: ItemAmount[] = [[item, amount]];

    setBusy(true);
    (buyingIt
      ? buyFromVendor(snapshot, standing[0], picks, standing[1])
      : sellToVendor(snapshot, standing[0], picks, standing[1])
    )
      .then((done) => {
        setBusy(false);

        if (done == null) {
          return;
        }
        // A purchase is worth a word in passing; a sale's receipt is
        // the purse badge climbing, and a refusal is the greyed square
        if (buyingIt) {
          toast.push({
            title: `${describeItem(item)}${amount > 1 ? ` ×${amount}` : ''}`,
            message: `−${priceOf(item, true) * amount} gold`,
            art: () => <ItemSprite item={item} size={24} label="" />,
            tone: 'leaf',
          });
        }
        props.onTraded();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        said(refusal(caught), 'ember');
      });
  };

  /** One side of the counter: his crate to buy from, or the bag to sell out of */
  const tray = (selling: boolean): JSX.Element => (
    <InventoryPicker
      inline
      keepOpen
      player={props.player}
      title={selling ? 'Sell' : 'Buy'}
      description={
        selling
          ? 'Press what you are selling, then say how many.'
          : 'Press what you are buying, then say how many.'
      }
      verb={selling ? 'Sell' : 'Buy'}
      entries={selling ? readable(props.bag) : crate()}
      disabled={busy()}
      value={null}
      carried={(entry) => carrying(entry.item)}
      // He has as many of anything as a player wants, so a count on his crate never moves
      counts={selling}
      empty={selling ? 'Nothing in your bag is worth anything to him.' : 'His crate is empty.'}
      filter={(entry) => !selling || priceOf(entry.item, false) > 0}
      // Greyed rather than left out: what he stocks is the same crate whatever is in the purse
      blocked={(entry) =>
        !selling && priceOf(entry.item, true) > (props.gold.latest ?? 0)
          ? 'More than you hold'
          : null
      }
      note={(entry) => `${priceOf(entry.item, !selling)}g`}
      card={(entry) => (
        <Detail label={selling ? 'He pays' : 'Costs'}>{priceOf(entry.item, !selling)} gold</Detail>
      )}
      // The purse decides a purchase and the bag a sale, both under the trade limit
      most={(entry) =>
        selling
          ? Math.min(VENDOR_TRADE_LIMIT, entry.amount)
          : Math.max(
              1,
              Math.min(
                VENDOR_TRADE_LIMIT,
                Math.floor((props.gold.latest ?? 0) / Math.max(1, priceOf(entry.item, true))),
              ),
            )
      }
      sum={(item, amount) => (
        <Meta>
          {amount} × {priceOf(item, !selling)} gold ={' '}
          <strong>{priceOf(item, !selling) * amount} gold</strong>
        </Meta>
      )}
      refuse={(item, amount) =>
        !selling && priceOf(item, true) * amount > (props.gold.latest ?? 0)
          ? 'More than you hold.'
          : null
      }
      onPick={(item, amount) => {
        if (item != null && amount > 0) {
          trade(item, amount, !selling);
        }
      }}
    />
  );

  return (
    <>
      {/* The crate stands in the dialog itself, so browsing his stock
          and switching to selling are one press each */}
      <TabGroup
        horizontal
        value={side()}
        onChange={(value) => {
          setSide(value);
        }}
        class="flex flex-col gap-3"
      >
        <div class="flex items-center gap-2">
          <TabBar>
            <TabButton value={Side.Buy}>Buy</TabButton>
            <TabButton value={Side.Sell}>Sell</TabButton>
          </TabBar>
          <Badge tone="gold" class="ml-auto">
            {(props.gold.latest ?? 0).toLocaleString()} gold
          </Badge>
        </div>
        <TabPane value={Side.Buy}>{tray(false)}</TabPane>
        <TabPane value={Side.Sell}>{tray(true)}</TabPane>
      </TabGroup>

      <DialogActions>{props.walkOn()}</DialogActions>
    </>
  );
}
