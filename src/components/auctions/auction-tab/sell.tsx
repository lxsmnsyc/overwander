import type { JSX } from '@solidjs/web';
import { type Accessor, Show } from 'solid-js';
import { AuctionLot, isAuctionableItem } from '../../../auth/auctions';
import CatchPicker, { type CatchOption } from '../../catches/catch-picker';
import InventoryPicker from '../../items/InventoryPicker';
import { Hint, HintList, Meta, Note } from '../../styled';
import { AUCTION_DURATION } from '../../../model/auction-record';
import type { AuctionSubject } from '../AuctionDialog';
import { describeRemaining, now } from './time';
import { m } from '../../../i18n/paraglide/messages.js';

/** What selling means, for the dialog's top right corner while the sell pane is open */
export function SellHint(): JSX.Element {
  return (
    <Hint title={m.auction_about_selling()}>
      <HintList>
        <li>{m.auction_hint_duration({ hours: AUCTION_DURATION / 3_600_000 })}</li>
        <li>{m.auction_hint_catches()}</li>
        <li>{m.auction_hint_items()}</li>
        <li>{m.auction_hint_unsold()}</li>
      </HintList>
    </Hint>
  );
}

/**
 * Selling, which **replaces** the board rather than standing on top of
 * it. Somebody putting something up is not shopping at the same
 * moment, and a sell card pushed in above the lots left a player
 * scrolling past their own bag to get back to what they came for.
 *
 * Picking is the whole of its business: the price, the confirmation and
 * the listing itself all belong to the dialog the pick opens. The way
 * back to the board is the dock's, where the key that opened this is
 */
export default function SellPane(props: {
  /** When the player's running auction closes, or null when none is running */
  running: number | null;
  revision: number;
  sellable: Accessor<CatchOption[]>;
  /** Whether a pokemon may go on the block at all */
  mayGoUp: (option: CatchOption) => boolean;
  onPick: (subject: AuctionSubject) => void;
}): JSX.Element {
  return (
    <div class="flex min-w-0 flex-col gap-3">
      <div class="flex flex-wrap items-baseline gap-2.5">
        <h3 class="m-0 font-display text-[22px] font-semibold">{m.auction_sell()}</h3>
        <Meta>{m.auction_sell_lede({ hours: AUCTION_DURATION / 3_600_000 })}</Meta>
      </div>
      <Show
        when={props.running == null}
        fallback={
          <Note>
            {m.auction_running({ remaining: describeRemaining(props.running ?? 0, now()) })}
          </Note>
        }
      >
        <h4>{m.auction_from_bag()}</h4>
        <InventoryPicker
          inline
          fill
          columns={10}
          revision={props.revision}
          value={null}
          verb={m.auction_sell()}
          empty={m.auction_bag_empty()}
          filter={(entry) => isAuctionableItem(entry.item)}
          onPick={(picked) => {
            if (picked != null) {
              props.onPick({ lot: AuctionLot.Item, item: picked });
            }
          }}
        />

        <h4>{m.auction_from_records()}</h4>
        {/* Two different lists in one. What does not qualify for the
            block at all is **left out**: it would be most of a box,
            and a hundred greyed rows say nothing. The three that would
            otherwise qualify are **refused and told**, since a player
            looking for one of them wants the reason: a raid is fighting
            on a frozen copy of a record that has to still be there when
            it ends, an egg is a sealed box only its owner can see into,
            and the buddy is not something to sell by misreading a list */}
        <CatchPicker
          fill
          inline
          columns={10}
          options={props.sellable()}
          value={null}
          verb={m.auction_sell()}
          empty={m.auction_records_empty()}
          filter={props.mayGoUp}
          onPick={(picked) => {
            if (picked != null) {
              props.onPick({ lot: AuctionLot.Catch, catchId: picked });
            }
          }}
        />
      </Show>
    </div>
  );
}
