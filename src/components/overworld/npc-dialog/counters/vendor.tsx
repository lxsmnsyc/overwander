import { type JSX, createSignal } from 'solid-js';
import type { InventoryEntry } from '../../../../auth/inventory';
import { buyFromVendor, sellToVendor } from '../../../../auth/npcs';
import type { Items } from '../../../../data/ids/items';
import { VENDOR_TRADE_LIMIT } from '../../../../data/overworld/vendor';
import { describeItem } from '../../../details';
import InventoryPicker, { type ItemAmount } from '../../../items/InventoryPicker';
import ItemSprite from '../../../items/ItemSprite';
import { Badge, Button, Detail, DialogActions, Meta, Status, useToast } from '../../../styled';
import { type CounterProps, priceOf, refusal } from '../shared';
import { VendorCounter } from './goods';

/**
 * The vendor, and the chef who keeps the same counter.
 *
 * The crate and the bag are windows of their own: a tray of thirty
 * squares unfolded into the dialog pushes the total and the buttons
 * off the screen
 */
export default function Vendor(props: CounterProps): JSX.Element {
  const toast = useToast();
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  // Which side of the counter is being looked at, or null while the
  // player has only been offered the two words
  const [counter, setCounter] = createSignal<'buy' | 'sell' | null>(null);

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
  const crate = (): InventoryEntry[] =>
    stock().map((item) => ({
      user: props.player,
      item,
      amount: VENDOR_TRADE_LIMIT,
    }));

  /**
   * How many of it the player is carrying. It is what the crate cannot
   * say, and what a player buying a third potion is deciding with
   */
  const carrying = (item: Items): number =>
    (props.bag.latest ?? []).find((entry) => entry.item === item)?.amount ?? 0;

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

    setStatus(null);
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
        setStatus(refusal(caught));
      });
  };

  return (
    <>
      <VendorCounter gold={props.gold.latest ?? 0} />
      <Status message={status()} />
      {/* Both windows are opened from here and what is picked in one
          is agreed to in another, so the bar itself only ever offers
          the two words */}
      <DialogActions>
        <Button
          tone="primary"
          disabled={busy()}
          onClick={() => {
            setStatus(null);
            setCounter('buy');
          }}
        >
          Buy
        </Button>
        <Button
          disabled={busy()}
          onClick={() => {
            setStatus(null);
            setCounter('sell');
          }}
        >
          Sell
        </Button>
        {props.walkOn()}
      </DialogActions>

      <InventoryPicker
        open={counter() != null}
        keepOpen
        onClose={() => {
          setCounter(null);
        }}
        player={props.player}
        title={counter() === 'sell' ? 'Sell' : 'Buy'}
        // The squares say what he has and what it costs, so the
        // sentence is kept for the screen reader and off the screen
        terse
        // What is in the purse, under the crate it is spent on: it is
        // the number every press on this window changes, and it was
        // one screen behind on the counter
        below={<Badge tone="gold">{props.gold.latest ?? 0} gold</Badge>}
        description={
          counter() === 'sell'
            ? 'Press what you are selling, then say how many.'
            : 'Press what you are buying, then say how many.'
        }
        verb={counter() === 'sell' ? 'Sell' : 'Buy'}
        entries={counter() === 'sell' ? props.bag.latest : crate()}
        disabled={busy()}
        value={null}
        carried={(entry) => carrying(entry.item)}
        // He has as many of anything as a player wants, so a count on
        // his crate is a number that never moves
        counts={counter() === 'sell'}
        empty={
          counter() === 'sell'
            ? 'Nothing in your bag is worth anything to him.'
            : 'His crate is empty.'
        }
        filter={(entry) => counter() !== 'sell' || priceOf(entry.item, false) > 0}
        // What the purse will not stretch to is greyed where it stands,
        // rather than left out: what he stocks is the same crate
        // whatever a player is carrying
        blocked={(entry) =>
          counter() !== 'sell' && priceOf(entry.item, true) > (props.gold.latest ?? 0)
            ? 'More than you hold'
            : null
        }
        // Short enough to sit in the corner of a square: the tray has no
        // room for a sentence, and the number is the news
        note={(entry) => `${priceOf(entry.item, counter() !== 'sell')}g`}
        // The same number again, in words, over the button that spends
        // it. The corner badge is four characters read at a glance
        // across thirty squares; the card is where one square is being
        // decided on, and "200g" there is a number without a currency
        card={(entry) => (
          <Detail label={counter() === 'sell' ? 'He pays' : 'Costs'}>
            {priceOf(entry.item, counter() !== 'sell')} gold
          </Detail>
        )}
        // How many of one line he will part with, or take: the purse
        // decides a purchase and the bag decides a sale, and the
        // trade limit is over both so a slip of the keyboard cannot
        // ask for a hundred thousand potions
        most={(entry) =>
          counter() === 'sell'
            ? Math.min(VENDOR_TRADE_LIMIT, entry.amount)
            : Math.max(
                1,
                Math.min(
                  VENDOR_TRADE_LIMIT,
                  Math.floor((props.gold.latest ?? 0) / Math.max(1, priceOf(entry.item, true))),
                ),
              )
        }
        // What the count comes to, which is the number the decision is
        // actually about: the price on the square is one of them
        sum={(item, amount) => (
          <Meta>
            {amount} × {priceOf(item, counter() !== 'sell')} gold ={' '}
            <strong>{priceOf(item, counter() !== 'sell') * amount} gold</strong>
          </Meta>
        )}
        refuse={(item, amount) =>
          counter() !== 'sell' && priceOf(item, true) * amount > (props.gold.latest ?? 0)
            ? 'More than you hold.'
            : null
        }
        onPick={(item, amount) => {
          if (item != null && amount > 0) {
            trade(item, amount, counter() !== 'sell');
          }
        }}
      />
    </>
  );
}
