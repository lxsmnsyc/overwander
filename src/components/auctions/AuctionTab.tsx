import {
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createResource,
  createSignal,
  from,
  on,
} from 'solid-js';
import {
  AuctionLot,
  type AuctionRecord,
  canClaim,
  canReclaim,
  claimAuction,
  getSellerStanding,
  isAuctionableCatch,
  isAuctionableItem,
  isBidOn,
  isLive,
  nextBid,
  placeBid,
  reclaimAuction,
  watchOpenAuctions,
} from '../../auth/auctions';
import { isLockLive } from '../../auth/battle-lock';
import { getBuddy } from '../../auth/buddy';
import { syncServerClock } from '../../auth/clock';
import {
  type CaughtPokemon,
  countCaught,
  getCaught,
  isFavorite,
  listCaughtMarked,
} from '../../auth/caught';
import { isEgg } from '../../auth/egg';
import { type Profile, getProfile, watchProfile } from '../../auth/profile';
import AuctionDialog, { type AuctionSubject } from './AuctionDialog';
import CatchGrid, { type CatchGridEntry } from '../catches/CatchGrid';
import CatchCard from '../catches/CatchCard';
import CatchPicker, { type CatchOption } from '../catches/CatchPicker';
import { asBoxEntry, describeCatch } from '../catches/catch-summary';
import ItemGrid, { type ItemCell } from '../items/ItemGrid';
import InventoryPicker, { describeItem } from '../items/InventoryPicker';
import matches from '../../core/search';
import { useGame } from '../app/game-context';
import {
  Badge,
  Button,
  Card,
  Detail,
  Dialog,
  DialogActions,
  Field,
  HoverCard,
  Meta,
  Note,
  Panel,
  Row,
  RowButton,
  SEARCH_FROM,
  Search,
  Status,
} from '../styled';

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/**
 * The reader's own clock. Nothing about an auction happens at a
 * particular instant — a lot that closed is only a lot nobody may bid
 * on any more, and the winner collects it whenever they come back — so
 * the board asks the time when it draws rather than following it. The
 * server decides both questions again when a bid or a claim actually
 * arrives
 */
function now(): number {
  return Date.now();
}

/**
 * How long there is left, in the units a seller would say it in
 */
function describeRemaining(endsAt: number, at: number): string {
  const left = endsAt - at;

  if (left <= 0) {
    return 'bidding closed';
  }

  const hours = Math.floor(left / HOUR);

  if (hours > 0) {
    return `${hours}h left`;
  }
  return `${Math.max(1, Math.floor(left / MINUTE))}m left`;
}

/**
 * What the lot stands at: what it has been bid up to, or what it is
 * asking for where nobody has bid yet.
 *
 * One number rather than two. The row used to carry what it stood at
 * *and* what the next bid would have to be, which is the same figure
 * said twice over for a reader who is about to be shown it again in
 * the dialog the Bid button opens — and it made the busiest column on
 * the board the one nobody reads
 */
function describeStanding(auction: AuctionRecord): string {
  return `${isBidOn(auction) ? auction.bid : auction.startingBid} gold`;
}

/**
 * The pokemon on the block. A catch on offer is held in escrow rather
 * than copied into the auction, so it is read the way any other catch
 * is — and it stays readable, which is what lets a bidder see what
 * they are bidding on
 */
function CatchLotName(props: { caught: Resource<CaughtPokemon | null> }): JSX.Element {
  return (
    <Show when={props.caught()} fallback={<span>A pokemon</span>}>
      {(loaded) => <span>{describeCatch(loaded())}</span>}
    </Show>
  );
}

function CatchLot(props: { catchId: string }): JSX.Element {
  const [caught] = createResource(() => props.catchId, getCaught);

  return (
    <Suspense fallback={<span>A pokemon</span>}>
      <CatchLotName caught={caught} />
    </Suspense>
  );
}

/**
 * What an item lot is called. Item id 0 is a real item, so absence is
 * tested rather than falsiness — and a catch lot is named by the
 * record it is holding, which has to be read before it can be said
 */
export function nameItemLot(auction: AuctionRecord): string | null {
  return auction.lot === AuctionLot.Item && auction.item != null
    ? describeItem(auction.item)
    : null;
}

/**
 * What is on the block, whichever kind of lot it is.
 *
 * A caller that has already read the catch — the board does, since it
 * searches by name — passes what it found rather than making the row
 * read the same record a second time
 */
export function AuctionLotLabel(props: { auction: AuctionRecord; name?: string }): JSX.Element {
  const named = (): string | null => props.name ?? nameItemLot(props.auction);

  return (
    <Show when={named()} fallback={<CatchLot catchId={props.auction.caught} />}>
      {(name) => <span>{name()}</span>}
    </Show>
  );
}

/**
 * Why this player may not bid on a lot, or null where they may.
 *
 * All three answers used to be a thing standing where the button would
 * be — a badge reading "yours", a badge reading "winning", a line about
 * not holding enough — so the eye had to find the button again on every
 * lot. The button is always the button now; the reason rides on it, for
 * whoever stops on the one that is dead
 */
export function bidRefusal(auction: AuctionRecord, player: string, gold: number): string | null {
  // A seller may not bid on their own lot, and no purse or outbidding
  // will ever change that
  if (auction.seller === player) {
    return 'Your own lot';
  }
  // The standing bidder is already winning it: bidding against
  // themselves could only cost them gold
  if (auction.bidder === player) {
    return 'You are winning this one';
  }
  return gold >= nextBid(auction) ? null : `${nextBid(auction)} gold is more than you hold`;
}

/**
 * Naming an amount for a lot.
 *
 * A dialog rather than a number box beside every lot: a board is read at
 * a glance, and a form the length of it is one more thing to press by
 * accident and tab through on the way to anywhere else.
 *
 * It is **its own component**, opened by whoever holds the board rather
 * than by the button that asks for it. A hover card is where the button
 * lives now, and a card goes away the moment the pointer does — taking
 * anything mounted inside it, this dialog included, with it
 */
export function BidDialog(props: {
  /** The lot being bid on, or null while nobody is bidding */
  lot: AuctionRecord | null;
  gold: number;
  /**
   * What the lot is called: a player naming an amount should be able to
   * see what they are naming it for
   */
  name?: string;
  onClose: () => void;
  onBid: (amount: number) => void;
}): JSX.Element {
  const [named, setNamed] = createSignal(0);

  /**
   * The floor, for whichever lot is being bid on. Nothing is a lot that
   * cannot be bid on, and its floor is one — the dialog is shut
   */
  const floor = (): number => (props.lot == null ? 1 : nextBid(props.lot));

  /**
   * What the bid would be: what the player typed, never below the floor.
   * The floor moves whenever somebody else bids, and this moves with it
   * rather than leaving a stale number in the box
   */
  const amount = (): number => Math.max(named(), floor());

  // Opened on a fresh lot, so the box starts at what that lot actually
  // costs rather than at what the last one did — and on opening alone,
  // since a raise landing while somebody is typing should move the floor
  // under them rather than retype their bid
  createEffect(
    on(
      () => props.lot != null,
      (open) => {
        if (open) {
          setNamed(floor());
        }
      },
    ),
  );

  return (
    <Dialog
      isOpen={props.lot != null}
      onClose={props.onClose}
      title={props.name == null ? 'Bid' : `Bid on ${props.name}`}
      description="The floor is the seller's least raise. Anything from there to what you are
            holding is a legal bid, so a lot can be put out of reach in one press."
    >
      <Row class="justify-center">
        <Field label="Bid">
          <input
            type="number"
            min={floor()}
            max={props.gold}
            value={amount()}
            onInput={(event) => {
              setNamed(Number(event.currentTarget.value));
            }}
          />
        </Field>
      </Row>
      <Row class="justify-center">
        <Meta>
          {floor()} gold to take it · you hold {props.gold}
        </Meta>
      </Row>

      <DialogActions>
        <Button onClick={props.onClose}>Never mind</Button>
        <Button
          tone="primary"
          disabled={amount() > props.gold}
          onClick={() => {
            props.onBid(amount());
            props.onClose();
          }}
        >
          Bid {amount()} gold
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * What this player may do about a lot: nothing, if it is their own, and
 * otherwise a bid.
 *
 * It is the button and the dialog together, for a caller drawing rows —
 * the player's own bidding history, where the lot they were outbid on is
 * answered without going looking for it again. The board keeps the two
 * apart, since its buttons live in cards
 */
export function BidControls(props: {
  auction: AuctionRecord;
  player: string;
  gold: number;
  name?: string;
  onBid: (amount: number) => void;
}): JSX.Element {
  const [bidding, setBidding] = createSignal(false);

  const refused = (): string | null => bidRefusal(props.auction, props.player, props.gold);

  // A seller sees no button at all on their own lot: a dead button on it
  // is a control offered to the one person it will never work for
  if (props.auction.seller === props.player) {
    return null;
  }

  return (
    <>
      <Button
        tone="primary"
        disabled={refused() != null}
        title={refused() ?? undefined}
        onClick={() => {
          setBidding(true);
        }}
      >
        Bid
      </Button>
      <BidDialog
        lot={bidding() ? props.auction : null}
        gold={props.gold}
        name={props.name}
        onClose={() => {
          setBidding(false);
        }}
        onBid={props.onBid}
      />
    </>
  );
}

/**
 * What a lot that has stopped taking bids is waiting for: the player to
 * come and get it. A won lot is collected and an unsold one is taken
 * back, which are the same button with different words on it
 */
interface LotClaim {
  said: string;
  label: string;
  onClaim: () => void;
}

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
 * A read in the body that declared it throws past every `Suspense`
 * written there and lands on the boundary around the whole page, so
 * the reading half is a component of its own
 */
function AuctionBoard(
  props: AuctionTabProps & {
    auctions: () => [string, AuctionRecord][] | undefined;
    lots: Resource<Map<string, CaughtPokemon>>;
    sellers: Resource<Map<string, string>>;
    buddy: Resource<string | null>;
    onlyOne: Resource<boolean>;
    sellable: Resource<CatchOption[]>;
    standing: Resource<{ auction: string; endsAt: number } | null>;
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

  const sellable = (): CatchOption[] | undefined => props.sellable();

  const standing = (): { auction: string; endsAt: number } | null | undefined => props.standing();

  const revision = (): number => props.revision;

  const refresh = (): void => {
    props.onChanged();
  };

  // The balance moves with every bid placed and every one handed back,
  // so it is followed rather than read once
  const profile = from<Profile | null>((set) =>
    watchProfile(props.player, (record) => {
      set(record);
    }),
  );

  const gold = (): number => profile()?.gold ?? 0;

  const auctions = (): [string, AuctionRecord][] | undefined => props.auctions();

  /**
   * Who listed it. The reader is "you" rather than their own nickname,
   * and a seller whose profile has gone is still a seller
   */
  const describeSeller = (auction: AuctionRecord): string =>
    auction.seller === props.player ? 'you' : (sellers()?.get(auction.seller) ?? 'a trainer');

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

  const sellingReason = (option: CatchOption): string | null => {
    // A lot leaves its owner's hands as it is listed, so the last one
    // may not be listed at all — the same rule that stops it being
    // released
    if (onlyOne() === true) {
      return 'your only pokemon';
    }
    if (option.fighting) {
      return 'in a raid';
    }
    if (isEgg(option.caught)) {
      return 'still an egg';
    }
    if (isFavorite(option.caught)) {
      return 'a favorite';
    }
    return buddy() === option.id ? 'your buddy' : null;
  };

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
            ? 'That bid could not be placed.'
            : `Bid ${placed} gold — it is yours unless somebody raises it.`,
        );
      })
      .catch((thrown: unknown) => {
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  const collect = (id: string): void => {
    setStatus(null);
    claimAuction(id)
      .then((claimed) => {
        setStatus(claimed ? 'Collected.' : 'That lot could not be collected.');
        refresh();
      })
      .catch((thrown: unknown) => {
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  const reclaim = (id: string): void => {
    setStatus(null);
    reclaimAuction(id)
      .then((taken) => {
        setStatus(taken ? 'Taken back.' : 'That lot could not be taken back.');
        refresh();
      })
      .catch((thrown: unknown) => {
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
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
        said: `won for ${auction.bid} gold`,
        label: 'Collect',
        onClaim: () => {
          collect(id);
        },
      };
    }
    if (canReclaim(auction, props.player, now())) {
      return {
        said: 'nobody bid',
        label: 'Take it back',
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
  const board = (): [string, AuctionRecord][] =>
    (auctions() ?? [])
      .filter(([id, auction]) => isLive(auction, now()) || claimOf(id, auction) !== undefined)
      .filter(([, auction]) => {
        const name = nameOf(auction);

        // Searched with the seller alongside, so a board can be
        // narrowed to one trainer's lots as well as to one thing
        return name == null || matches(`${name} by ${describeSeller(auction)}`, query());
      });

  const running = (): number | null => {
    const mine = standing();

    return mine != null && now() < mine.endsAt ? mine.endsAt : null;
  };

  /**
   * Whose lot it is and what it stands at, for the card that comes up
   * over a square.
   *
   * A tray of squares has nowhere to write either — a picture is what a
   * lot is recognised by, which is the whole reason the board is drawn
   * this way — so both are in the window over one, and the seller is the
   * way to their profile: what somebody else has caught and fought is
   * most of what says whether their lot is worth bidding on
   */
  const lotDetails = (auction: AuctionRecord): JSX.Element => (
    <>
      <Detail label="Owned by">
        <Show when={auction.seller !== props.player} fallback={<span>you</span>}>
          <RowButton
            class="inline underline decoration-dotted underline-offset-2"
            onClick={() => {
              game.setVisiting(auction.seller);
            }}
          >
            {describeSeller(auction)}
          </RowButton>
        </Show>
      </Detail>
      <Detail label="Bidding">
        {describeStanding(auction)} · {describeRemaining(auction.endsAt, now())}
      </Detail>
    </>
  );

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

  const bidLot = (): AuctionRecord | null =>
    (auctions() ?? []).find(([id]) => id === bidding())?.[1] ?? null;

  const biddingName = (): string | undefined => {
    const lot = bidLot();

    return lot == null ? undefined : nameOf(lot);
  };

  const lotActions = (id: string, auction: AuctionRecord): JSX.Element => (
    <Show when={props.viewOnly !== true}>
      <Show
        when={claimOf(id, auction)}
        fallback={
          // The button asks; the dialog it asks for stands with the panel
          // rather than inside this card. A card is put away the moment
          // the pointer leaves it, and it takes whatever is mounted inside
          // it — which was this dialog, gone before it could be typed in
          <Show when={auction.seller !== props.player}>
            <Button
              tone="primary"
              disabled={bidRefusal(auction, props.player, gold()) != null}
              title={bidRefusal(auction, props.player, gold()) ?? undefined}
              onClick={() => {
                setBidding(id);
              }}
            >
              Bid
            </Button>
          </Show>
        }
      >
        {(taking) => (
          <Button tone="primary" onClick={taking().onClaim}>
            {taking().label}
          </Button>
        )}
      </Show>
    </Show>
  );

  /**
   * The items on the block, as the bag's own tray reads them: the icon
   * says what it is, the badge says what it stands at, and the card over
   * it says whose it is and carries the bid
   */
  const itemLots = (): ItemCell[] =>
    board().flatMap(([id, auction]): ItemCell[] =>
      auction.lot === AuctionLot.Item && auction.item != null
        ? [
            {
              item: auction.item,
              note: claimOf(id, auction)?.said ?? describeStanding(auction),
              said: `${describeItem(auction.item)} — ${describeStanding(
                auction,
              )}, by ${describeSeller(auction)}`,
              card: () => lotDetails(auction),
              footer: () => lotActions(id, auction),
            },
          ]
        : [],
    );

  /**
   * And the pokemon, as a box of squares. A lot whose record has not
   * arrived yet has no square: there is nothing to draw in one
   */
  const catchLots = (): [string, AuctionRecord][] =>
    board().filter(([, auction]) => auction.lot === AuctionLot.Catch);

  const boxed = (): CatchGridEntry[] =>
    catchLots().flatMap(([, auction]): CatchGridEntry[] => {
      const caught = lots()?.get(auction.caught);

      if (caught == null) {
        return [];
      }

      const square = asBoxEntry([auction.caught, caught]);

      // Whose it is, in what the square is announced as. Two sellers
      // with the same pokemon up are otherwise two identical squares
      return [
        { square: { ...square, label: `${square.label} — by ${describeSeller(auction)}` }, caught },
      ];
    });

  /**
   * Which lot a square belongs to. The squares are named by the catch id
   * the lot is holding, since that is what a box draws
   */
  const lotOf = (catchId: string): [string, AuctionRecord] | undefined =>
    catchLots().find(([, auction]) => auction.caught === catchId);

  /**
   * The board: the items on one tray and the pokemon on another.
   *
   * Both are the trays the rest of the game keeps the same things in —
   * the bag's squares and the box's — because a lot is recognised by its
   * picture rather than read: a board of names all set the same way is
   * read word by word. What a row used to carry beside the name is in
   * the card that comes up over a square
   */
  const onTheBlock = (): JSX.Element => (
    <Show
      when={board().length}
      fallback={
        <Note>{query().length === 0 ? 'Nothing is up right now.' : 'Nothing here matches.'}</Note>
      }
    >
      <Show when={itemLots().length}>
        <h4>Items</h4>
        {/* Narrowed by the board's own search, so the tray draws none of
            its own — and card-only, since a press on a picture is not a
            bid */}
        <ItemGrid bare cardOnly entries={itemLots()} />
      </Show>

      <Show when={boxed().length}>
        <h4>Pokemon</h4>
        {/* Narrowed by the board's own search too, so the grid draws
            none of its own */}
        <CatchGrid
          bare
          cardOnly
          entries={boxed()}
          cell={(entry) => (
            <Show when={lotOf(entry().id)}>
              {(lot) => (
                <HoverCard
                  class="block size-full"
                  trigger={<span class="block size-full" />}
                  title="Info"
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
                        View
                      </Button>
                      {lotActions(lot()[0], lot()[1])}
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
   * The board itself: what there is to bid on, and what the player is
   * holding to bid with
   */
  const shopping = (): JSX.Element => (
    <>
      <Row class="justify-center">
        <Show when={props.viewOnly !== true}>
          <Badge tone="gold">{gold()} gold</Badge>
        </Show>
        <Show when={board().length > SEARCH_FROM}>
          <Search
            placeholder="Search the lots"
            value={query()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Show>
      </Row>

      {/* One list, newest first, whatever is standing on each lot.
          It is the panel rather than a card in it: the board *is* this
          dialog, and a titled box around the only thing on the screen
          is a label on a room somebody is already standing in */}
      <Show when={auctions()} fallback={<Note>Loading auctions…</Note>}>
        {onTheBlock()}
      </Show>
    </>
  );

  return (
    <Panel>
      {/* Selling **replaces** the board rather than standing on top of
          it. Somebody putting something up is not shopping at the same
          moment, and a sell card pushed in above the lots left a player
          scrolling past their own bag to get back to what they came
          for */}
      <Show when={props.adding === true} fallback={shopping()}>
        <Card title="Sell">
          <Show
            when={running() == null}
            fallback={
              <Note>
                You have an auction running — {describeRemaining(running() ?? 0, now())}. One at a
                time, which is one a day.
              </Note>
            }
          >
            <h4>From the bag</h4>
            <InventoryPicker
              inline
              revision={revision()}
              value={null}
              verb="Sell"
              empty="Nothing in the bag is rare enough for the block."
              filter={(entry) => isAuctionableItem(entry.item)}
              onPick={(picked) => {
                if (picked != null) {
                  setOffered({ lot: AuctionLot.Item, item: picked });
                }
              }}
            />

            <h4>From the records</h4>
            {/* Two different lists in one. What does not qualify for
                the block at all is **left out** — it would be most of a
                box, and a hundred greyed rows say nothing. The three
                that would otherwise qualify are **refused and told**,
                since a player looking for one of them wants the reason:
                a raid is fighting on a frozen copy of a record that has
                to still be there when it ends, an egg is a sealed box
                only its owner can see into, and the buddy is not
                something to sell by misreading a list */}
            <CatchPicker
              inline
              options={sellable()}
              value={null}
              verb="Sell"
              empty="Nothing of yours is rare enough for the block."
              filter={(option) => isAuctionableCatch(option.caught)}
              reason={sellingReason}
              onPick={(picked) => {
                if (picked != null) {
                  setOffered({ lot: AuctionLot.Catch, catchId: picked });
                }
              }}
            />
          </Show>
          {/* Back to the board. It says where it goes rather than
              "Done", since nothing has been finished by pressing it —
              the listing itself happens in the dialog */}
          <Row class="justify-center">
            <Button
              onClick={() => {
                props.onAdding?.(false);
              }}
            >
              Back to the board
            </Button>
          </Row>
        </Card>
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

/**
 * The auction board and the seller's side of it.
 *
 * Everything it is drawn from — the lots on it, who listed them, the
 * player's buddy, what they may sell and what they already have
 * running — is read one component down, under this boundary
 */
export default function AuctionTab(props: AuctionTabProps): JSX.Element {
  // Everything nobody has collected yet: a bid raises a listing under
  // whoever is looking at it, so the board is followed rather than
  // read once
  const auctions = from<[string, AuctionRecord][]>((set) =>
    watchOpenAuctions((open) => {
      // Newest first. Every lot runs exactly a day, so when it closes
      // is when it was listed — the most recently put up is the one
      // nobody has seen yet, and the one worth opening the board for
      set(open.sort(([, one], [, other]) => other.endsAt - one.endsAt));
    }),
  );

  /**
   * The pokemon on the block, read once for the whole board.
   *
   * It is keyed on which catches are up rather than on the listings
   * themselves, so a bid landing somewhere on the board — which
   * rewrites a listing every time — does not send the board back to
   * read every pokemon on it again
   */
  const [lots] = createResource(
    () =>
      [
        ...new Set(
          (auctions() ?? [])
            .filter(([, auction]) => auction.lot === AuctionLot.Catch)
            .map(([, auction]) => auction.caught),
        ),
      ]
        .sort()
        .join(','),
    async (key): Promise<Map<string, CaughtPokemon>> => {
      const found = new Map<string, CaughtPokemon>();

      await Promise.all(
        key
          .split(',')
          .filter(Boolean)
          .map(async (id) => {
            const caught = await getCaught(id);

            if (caught != null) {
              found.set(id, caught);
            }
          }),
      );
      return found;
    },
  );

  /**
   * Everyone who has a lot on the board, by what they are called.
   * Profiles are readable by every signed-in player, and a board of
   * lots with no sellers on it is a shop with the labels torn off
   */
  const [sellers] = createResource(
    () => [...new Set((auctions() ?? []).map(([, auction]) => auction.seller))].sort().join(','),
    async (key): Promise<Map<string, string>> => {
      const named = new Map<string, string>();

      await Promise.all(
        key
          .split(',')
          .filter(Boolean)
          .map(async (uid) => {
            const seller = await getProfile(uid);

            if (seller != null) {
              named.set(uid, seller.nickname);
            }
          }),
      );
      return named;
    },
  );

  // Bumped whenever something leaves the player's hands or lands in
  // them, so the two pickers below re-read what there is to sell
  const [revision, setRevision] = createSignal(0);

  const refresh = (): void => {
    setRevision(revision() + 1);
  };

  /**
   * The pokemon at the player's side, which is not for sale. It is
   * re-read on the same revision the pickers are, since sending the
   * buddy home is how a player makes that one sellable
   */
  const [buddy] = createResource(
    () => [props.player, revision()] as const,
    async ([player]) => getBuddy(player),
  );

  /**
   * Why a pokemon in the list cannot be put up. The server decides all
   * three again when the listing actually arrives; this is so a player
   * is told before they press rather than after
   */
  /**
   * Whether this is the only pokemon they have, which is the one that
   * may not be sold
   */
  const [onlyOne] = createResource(
    () => props.player,
    async (uid) => (await countCaught(uid)) <= 1,
  );

  /**
   * The pokemon that could go on the block, asked of the **database**
   * rather than read out of the whole box and sifted here.
   *
   * That is what the record's `auctionable` column is for: a player
   * with three hundred catches has perhaps three that qualify.
   *
   * `filter` below still asks `isAuctionableCatch` of every row that
   * comes back. The field is an index, not an authority — a record
   * written before it existed, or by something that forgot to keep it,
   * is caught here rather than shown as sellable and refused by the
   * server
   */
  const [sellable] = createResource(
    () => [props.player, revision()] as const,
    async ([player]): Promise<CatchOption[]> => {
      const [records, clock] = await Promise.all([
        listCaughtMarked(player, 'auctionable'),
        syncServerClock(),
      ]);

      return records.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, clock) }));
    },
  );

  /**
   * The auction the player has running, if any. A seller runs one at a
   * time, so this is what the sell form asks before it offers anything
   */
  const [standing, { refetch: refetchStanding }] = createResource(
    () => props.player,
    getSellerStanding,
  );

  return (
    <Suspense fallback={<Note>Reading the board…</Note>}>
      <AuctionBoard
        {...props}
        auctions={() => auctions() ?? undefined}
        lots={lots}
        sellers={sellers}
        buddy={buddy}
        onlyOne={onlyOne}
        sellable={sellable}
        standing={standing}
        revision={revision()}
        onChanged={() => {
          Promise.resolve(refetchStanding()).catch(() => undefined);
          refresh();
        }}
      />
    </Suspense>
  );
}
