import { BidDialog } from './bidding';
import { nameItemLot } from './lots';
import { describeStanding, describeStandingShort, now } from './time';
import {
  AuctionLot,
  type AuctionRecord,
  canClaim,
  canReclaim,
  claimAuction,
  isAuctionableCatch,
  isLive,
  placeBid,
  reclaimAuction,
} from '../../../auth/auctions';
import { type CaughtPokemon, isFavorite } from '../../../auth/caught';
import { isEgg } from '../../../model/egg';
import { type Profile, watchProfile } from '../../../auth/profile';
import matchesAuction, {
  AUCTION_VOCABULARY,
  type AuctionContext,
  orderAuctions,
} from '../../../model/search/auction';
import { useGame } from '../../app/game-context';
import CatchCard from '../../catches/CatchCard';
import CatchGrid, { type CatchGridEntry } from '../../catches/CatchGrid';
import type { CatchOption } from '../../catches/catch-picker';
import { asBoxEntry, describeCatch } from '../../catches/catch-summary';
import { describeItem, titleCatch } from '../../details';
import ItemGrid, { type ItemCell } from '../../items/ItemGrid';
import {
  Button,
  HoverCard,
  Note,
  Panel,
  SEARCH_FROM,
  Search,
  Status,
  TabGroup,
  TabPane,
} from '../../styled';
import createLotActions, { type LotClaim } from './lot-actions';
import LotRail, { LotKind, readKind } from './rail';
import SellPane from './sell';
import AuctionDialog, { type AuctionSubject } from '../AuctionDialog';
import { type Accessor, For, Show, createMemo, createSignal, from } from 'solid-js';
import type { JSX } from '@solidjs/web';
import playEffect, { Effect } from '../../app/sound';
import describeFailure from '../../../i18n/refusals';
import { formatNumber } from '../../../i18n/format';
import { m } from '../../../i18n/paraglide/messages.js';

export interface AuctionTabProps {
  /**
   * Whether the seller's side is open. It is a prop rather than a
   * signal of its own because the button that opens it lives in the
   * dialog's own top bar, beside the heading, where a player looks for
   * "the thing that adds one"
   */
  adding?: boolean;
  onAdding?: (open: boolean) => void;
  player: string;
  /**
   * Whether the board is only being looked at. The dashboard reads it
   * this way: every lot is still drawn and still opens its record, and
   * nothing on it bids, collects or takes anything back
   */
  viewOnly?: boolean;
}

/**
 * The auction house: one board, newest lot first, and the one lot the
 * player may put up themselves.
 *
 * **One list.** What is taking bids, what this player won and has not
 * come back for, and what of theirs went unsold are all the same
 * thing — a lot on the board — and each row already says which it is
 * by what it offers to do. Three lists meant three places to look for
 * one thing, and two of them stood empty nearly always: what a player
 * wins is a handful of rows a year on a board they read every day.
 *
 * Putting something up cannot be undone while the lot runs — the item
 * leaves the bag and the pokemon leaves the player's records there and
 * then — so it takes a second press, the way letting a pokemon go does.
 * Only a lot the day ended on without a bid comes back, and it comes
 * back to the same row it was listed in
 */
/**
 * The board itself, which is where every one of these is read.
 *
 * A read in the body that declared it throws past every `Loading`
 * written there and lands on the boundary around the whole page, so
 * the reading half is a component of its own
 */
export function AuctionBoard(
  props: AuctionTabProps & {
    auctions: Accessor<[string, AuctionRecord][]>;
    lots: Accessor<Map<string, CaughtPokemon>>;
    sellers: Accessor<Map<string, string>>;
    buddy: Accessor<string | null>;
    onlyOne: Accessor<boolean>;
    sellable: Accessor<CatchOption[]>;
    standing: Accessor<{ auction: string; endsAt: number } | null>;
    revision: number;
    onChanged: () => void;
  },
): JSX.Element {
  const game = useGame();
  const [status, setStatus] = createSignal<string | null>(null);

  const lots = (): Map<string, CaughtPokemon> | undefined => props.lots();

  const sellers = (): Map<string, string> | undefined => props.sellers();

  const buddy = (): string | null | undefined => props.buddy();

  const onlyOne = (): boolean | undefined => props.onlyOne();

  const standing = (): { auction: string; endsAt: number } | null | undefined => props.standing();

  const revision = (): number => props.revision;

  const refresh = (): void => {
    props.onChanged();
  };

  // The balance moves with every bid placed and every one handed back,
  // so it is followed rather than read once. The first answer joins
  // the wait the boundary above already holds for the board
  const profile = createMemo(() =>
    from<Profile | null>((set) =>
      watchProfile(props.player, (record) => {
        set(record);
      }),
    ),
  );

  const gold = (): number => profile()?.gold ?? 0;

  const auctions = (): [string, AuctionRecord][] | undefined => props.auctions();

  /**
   * Who listed it. The reader is "you" rather than their own nickname,
   * and a seller whose profile has gone is still a seller
   */
  const describeSeller = (auction: AuctionRecord): string =>
    auction.seller === props.player
      ? m.auction_you()
      : (sellers()?.get(auction.seller) ?? m.auction_a_trainer());

  /**
   * What a lot is called, for searching and for the row itself
   */
  const nameOf = (auction: AuctionRecord): string | undefined => {
    const caught = lots()?.get(auction.caught);

    return nameItemLot(auction) ?? (caught == null ? undefined : describeCatch(caught));
  };

  /**
   * What was typed. A board is somebody else's shelf — a player comes
   * to it looking for one thing, so it is searched by what the lot is
   * rather than scrolled
   */
  const [query, setQuery] = createSignal('');

  /** Which kind of lot the rail has the board narrowed to */
  const [kind, setKind] = createSignal<LotKind>(LotKind.Everything);

  /**
   * Whether the block would take it at all.
   *
   * Everything that would be refused is left out of the box rather
   * than drawn and greyed: the sell card is a shelf of what can go up,
   * and a square that can never be pressed is only a question about
   * why. The reasons themselves are said where the mark was put on —
   * the sheet says a favorite cannot be sold
   */
  const mayGoUp = (option: CatchOption): boolean =>
    // A lot leaves its owner's hands as it is listed, so the last one
    // may not be listed at all — the same rule that stops it being
    // released
    onlyOne() !== true &&
    !option.fighting &&
    !isEgg(option.caught) &&
    !isFavorite(option.caught) &&
    buddy() !== option.id &&
    isAuctionableCatch(option.caught);

  /**
   * What the player has picked to put up, if anything. Picking is the
   * whole of the sell card's business: the price, the confirmation and
   * the listing itself all belong to the dialog it opens
   */
  const [offered, setOffered] = createSignal<AuctionSubject | null>(null);

  const bid = (id: string, amount: number): void => {
    setStatus(null);
    placeBid(id, amount)
      .then((placed) => {
        setStatus(
          placed == null
            ? m.auction_bid_failed()
            : m.auction_bid_placed({ amount: formatNumber(placed) }),
        );
      })
      .catch((thrown: unknown) => {
        setStatus(describeFailure(thrown));
      });
  };

  const collect = (id: string): void => {
    setStatus(null);
    claimAuction(id)
      .then((claimed) => {
        if (claimed) {
          playEffect(Effect.TradeComplete);
        }
        setStatus(claimed ? m.auction_collected() : m.auction_collect_failed());
        refresh();
      })
      .catch((thrown: unknown) => {
        setStatus(describeFailure(thrown));
      });
  };

  const reclaim = (id: string): void => {
    setStatus(null);
    reclaimAuction(id)
      .then((taken) => {
        setStatus(taken ? m.auction_taken_back() : m.auction_take_back_failed());
        refresh();
      })
      .catch((thrown: unknown) => {
        setStatus(describeFailure(thrown));
      });
  };

  /**
   * What a row offers on a lot that has stopped taking bids: nothing
   * for somebody else's, collecting one this player won, and taking
   * back one of their own the day ran out on without a single bid.
   *
   * A lot in either state is still on the board rather than filed
   * under a heading of its own. Three lists meant three places to
   * look for one thing, and two of them were empty nearly always —
   * what a player has won is a handful of rows a year on a board
   * they read every day
   */
  const claimOf = (id: string, auction: AuctionRecord): LotClaim | undefined => {
    if (canClaim(auction, props.player, now())) {
      return {
        said: m.auction_won_for({ amount: formatNumber(auction.bid) }),
        label: m.auction_collect(),
        onClaim: () => {
          collect(id);
        },
      };
    }
    if (canReclaim(auction, props.player, now())) {
      return {
        said: m.auction_nobody_bid(),
        label: m.auction_take_back(),
        onClaim: () => {
          reclaim(id);
        },
      };
    }
    return undefined;
  };

  /**
   * The board: everything still taking bids, and whatever of the
   * player's own is waiting to be picked up, newest first.
   *
   * A lot whose name has not arrived yet is left in: it is on the
   * board, and hiding it until its pokemon loads would be a board
   * that shrinks while it is being read
   */
  /**
   * What the search knows about a lot besides the record: the two
   * words the board writes for itself, the pokemon it has read, and
   * where the reader stands on it
   */
  const contextOf = (auction: AuctionRecord): AuctionContext => ({
    name: nameOf(auction),
    seller: describeSeller(auction),
    caught: lots()?.get(auction.caught) ?? null,
    mine: auction.seller === props.player,
    bidding: auction.bidder === props.player,
    now: now(),
  });

  const board = (): [string, AuctionRecord][] => {
    const shown: [string, AuctionRecord][] = [];

    for (const entry of auctions() ?? []) {
      const [id, auction] = entry;

      if (!isLive(auction, now()) && claimOf(id, auction) === undefined) {
        continue;
      }
      // A lot whose name has not arrived is still on the board, but
      // only a search with nothing to say about it can keep it
      if (nameOf(auction) == null || matchesAuction(auction, query(), contextOf(auction))) {
        shown.push(entry);
      }
    }
    return orderAuctions(shown, query(), ([, auction]) => ({
      auction,
      context: contextOf(auction),
    }));
  };

  const running = (): number | null => {
    const mine = standing();

    return mine != null && now() < mine.endsAt ? mine.endsAt : null;
  };

  /**
   * The one thing to do about a lot: bid on it, or come and get it once
   * bidding is over. A seller's own lot offers neither, which is
   * `BidControls` answering with nothing
   */
  /**
   * Which lot is being bid on, by id rather than by record: a bid landing
   * anywhere rewrites the listing, and the dialog should be naming an
   * amount against what the lot stands at now
   */
  const [bidding, setBidding] = createSignal<string | null>(null);

  const bidLot = (): AuctionRecord | null => {
    for (const [id, auction] of auctions() ?? []) {
      if (id === bidding()) {
        return auction;
      }
    }
    return null;
  };

  const biddingName = (): string | undefined => {
    const lot = bidLot();

    return lot == null ? undefined : nameOf(lot);
  };

  const { lotDetails, lotActions, lotChoices } = createLotActions({
    player: props.player,
    viewOnly: props.viewOnly,
    gold,
    describeSeller,
    claimOf,
    onBid: (id) => {
      setBidding(id);
    },
  });

  const biddingSeller = (): string | undefined => {
    const lot = bidLot();

    return lot == null ? undefined : describeSeller(lot);
  };

  /**
   * The items on the block, as the bag's own tray reads them: the icon
   * says what it is, the badge says what it stands at, and the card
   * over it says whose it is and carries the bid
   */
  const itemLots = (): ItemCell[] => {
    const cells: ItemCell[] = [];

    for (const [id, auction] of board()) {
      if (auction.lot !== AuctionLot.Item || auction.item == null) {
        continue;
      }
      cells.push({
        item: auction.item,
        note: claimOf(id, auction)?.said ?? describeStandingShort(auction),
        said: m.auction_item_said({
          item: describeItem(auction.item),
          standing: describeStanding(auction),
          seller: describeSeller(auction),
        }),
        card: () => lotDetails(auction),
        actions: lotChoices(id, auction),
      });
    }
    return cells;
  };

  /**
   * And the pokemon, as a box of squares. A lot whose record has not
   * arrived yet has no square: there is nothing to draw in one
   */
  const catchLots = (): [string, AuctionRecord][] => {
    const kept: [string, AuctionRecord][] = [];

    for (const entry of board()) {
      if (entry[1].lot === AuctionLot.Catch) {
        kept.push(entry);
      }
    }
    return kept;
  };

  const boxed = (): CatchGridEntry[] => {
    const squares: CatchGridEntry[] = [];

    for (const [, auction] of catchLots()) {
      const caught = lots()?.get(auction.caught);

      if (caught == null) {
        continue;
      }

      const square = asBoxEntry([auction.caught, caught]);

      // Whose it is, in what the square is announced as. Two sellers
      // with the same pokemon up are otherwise two identical squares
      squares.push({
        square: {
          ...square,
          label: m.auction_catch_said({ label: square.label, seller: describeSeller(auction) }),
        },
        caught,
      });
    }
    return squares;
  };

  /**
   * Which lot a square belongs to. The squares are named by the catch id
   * the lot is holding, since that is what a box draws
   */
  const lotOf = (catchId: string): [string, AuctionRecord] | undefined => {
    for (const entry of catchLots()) {
      if (entry[1].caught === catchId) {
        return entry;
      }
    }
    return undefined;
  };

  /**
   * The board: the items on one tray and the pokemon on another.
   *
   * Both are the trays the rest of the game keeps the same things in —
   * the bag's squares and the box's — because a lot is recognised by its
   * picture rather than read: a board of names all set the same way is
   * read word by word. What a row used to carry beside the name is in
   * the card that comes up over a square. The rail narrows what is
   * drawn to the items or to the pokemon
   */
  /** What an empty board says: nothing up, nothing of this kind, or nothing matching */
  const emptyNote = (): string => {
    if (query().length > 0) {
      return m.auction_no_match();
    }
    return board().length === 0 ? m.auction_empty() : m.auction_no_lots_kind();
  };

  const onTheBlock = (): JSX.Element => (
    <Show
      when={
        (kind() !== LotKind.Pokemon && itemLots().length > 0) ||
        (kind() !== LotKind.Items && boxed().length > 0)
      }
      fallback={<Note>{emptyNote()}</Note>}
    >
      <Show when={kind() !== LotKind.Pokemon && itemLots().length}>
        <h4>{m.auction_items()}</h4>
        {/* Narrowed by the board's own search, so the tray draws none
            of its own */}
        <ItemGrid bare sheet fill columns={8} entries={itemLots()} />
      </Show>

      <Show when={kind() !== LotKind.Items && boxed().length}>
        <h4>{m.auction_pokemon()}</h4>
        {/* Narrowed by the board's own search too, so the grid draws
            none of its own */}
        <CatchGrid
          bare
          cardOnly
          fill
          columns={8}
          // Only the rows the lots fill, as the board draws it
          capacity={Math.max(1, Math.ceil(boxed().length / 8)) * 8}
          entries={boxed()}
          cell={(entry) => (
            <Show when={lotOf(entry().id)}>
              {(lot) => (
                <HoverCard
                  class="block size-full"
                  sheet
                  trigger={<span class="block size-full" />}
                  title={titleCatch(lots()?.get(entry().id))}
                  quietTitle
                  kind={m.auction_kind_lot()}
                  footer={(close) => (
                    <>
                      {/* The whole record, read-only: a pokemon on the
                          block is somebody else's */}
                      <Button
                        onClick={() => {
                          close();
                          game.setSheet({ catchId: lot()[1].caught, readOnly: true });
                        }}
                      >
                        {m.friends_view()}
                      </Button>
                      {lotActions(lot()[0], lot()[1], close)}
                    </>
                  )}
                >
                  <Show when={lots()?.get(entry().id)}>
                    {(caught) => <CatchCard caught={caught()} />}
                  </Show>
                  {lotDetails(lot()[1])}
                </HoverCard>
              )}
            </Show>
          )}
        />
      </Show>
    </Show>
  );

  /**
   * The board itself: a rail of what the player holds and the kinds of
   * lot, and beside it the search and the lots
   */
  const shopping = (): JSX.Element => (
    <TabGroup
      horizontal
      value={kind()}
      onChange={(value) => {
        setKind(readKind(value));
      }}
      class="flex flex-col gap-3 md:flex-row md:gap-5"
    >
      <LotRail
        gold={props.viewOnly === true ? undefined : gold()}
        everything={board().length}
        items={itemLots().length}
        pokemon={boxed().length}
      />

      <div class="flex min-w-0 grow flex-col gap-2.5">
        <Show when={board().length > SEARCH_FROM || query() !== ''}>
          <Search
            vocabulary={AUCTION_VOCABULARY}
            example="price:<500"
            placeholder={m.auction_search_placeholder()}
            value={query()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Show>

        {/* One list, newest first, whatever is standing on each lot.
            It is the panel rather than a card in it: the board *is* this
            dialog, and a titled box around the only thing on the screen
            is a label on a room somebody is already standing in */}
        <Show when={auctions()} fallback={<Note>{m.auction_loading()}</Note>}>
          <For each={[LotKind.Everything, LotKind.Items, LotKind.Pokemon]}>
            {(value) => <TabPane value={value}>{onTheBlock()}</TabPane>}
          </For>
        </Show>
      </div>
    </TabGroup>
  );

  return (
    <Panel>
      {/* Selling **replaces** the board rather than standing on top of
          it. Somebody putting something up is not shopping at the same
          moment, and a sell card pushed in above the lots left a player
          scrolling past their own bag to get back to what they came
          for */}
      <Show when={props.adding === true} fallback={shopping()}>
        <SellPane
          running={running()}
          revision={revision()}
          sellable={props.sellable}
          mayGoUp={mayGoUp}
          onPick={(subject) => {
            setOffered(subject);
          }}
        />
      </Show>

      <Status message={status()} />

      {/* Naming an amount. It stands with the panel rather than in the
          card the Bid button was pressed in: a card is put away as soon
          as the pointer leaves it, and it would have taken this with it.
          The lot is looked up rather than held, so a raise that lands
          while the dialog is open moves the floor under it */}
      <BidDialog
        lot={bidLot()}
        gold={gold()}
        name={biddingName()}
        seller={biddingSeller()}
        onClose={() => {
          setBidding(null);
        }}
        onBid={(amount) => {
          const id = bidding();

          if (id != null) {
            bid(id, amount);
          }
        }}
      />

      {/* Putting something up: what it is, the terms, and a second
          dialog that says what listing actually means */}
      <AuctionDialog
        subject={offered()}
        onClose={() => {
          setOffered(null);
        }}
        onListed={() => {
          // Nothing said back: the lot is on the board a line below,
          // under the seller's own name, which says it better than a
          // sentence about it does
          props.onAdding?.(false);
          // The board and the seller's one-a-day standing both move
          // with it; a failed re-read leaves the last good board up
          props.onChanged();
        }}
      />
    </Panel>
  );
}
