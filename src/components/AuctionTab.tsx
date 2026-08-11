import { For, type JSX, Show, createResource, createSignal, from } from 'solid-js';
import {
  AuctionLot,
  type AuctionRecord,
  MIN_INCREMENT,
  MIN_STARTING_BID,
  canClaim,
  canReclaim,
  claimAuction,
  getSellerStanding,
  isBidOn,
  isLive,
  nextBid,
  openCatchAuction,
  openItemAuction,
  placeBid,
  reclaimAuction,
  watchOpenAuctions,
} from '../auth/auctions';
import { getCaught } from '../auth/caught';
import { type Profile, watchProfile } from '../auth/profile';
import type { Items } from '../data/ids/items';
import CatchPicker from './CatchPicker';
import { describeCatch } from './CatchesList';
import InventoryPicker, { describeItem } from './InventoryPicker';
import matches from '../core/search';
import {
  Badge,
  Button,
  Card,
  Field,
  List,
  ListRow,
  Meta,
  Note,
  Panel,
  Row,
  SEARCH_FROM,
  Search,
  Status,
} from './styled';

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
 * What the lot has been bid up to, or what it is still asking for
 */
function describeBid(auction: AuctionRecord): string {
  return isBidOn(auction)
    ? `${auction.bid} gold bid · ${nextBid(auction)} to take it`
    : `${auction.startingBid} gold asking`;
}

/**
 * The pokemon on the block. A catch on offer is held in escrow rather
 * than copied into the auction, so it is read the way any other catch
 * is — and it stays readable, which is what lets a bidder see what
 * they are bidding on
 */
function CatchLot(props: { catchId: string }): JSX.Element {
  const [caught] = createResource(() => props.catchId, getCaught);

  return (
    <Show when={caught()} fallback={<span>A pokemon</span>}>
      {(loaded) => <span>{describeCatch(loaded())}</span>}
    </Show>
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
 * What this player may do about a lot: nothing, if it is their own or
 * they are already winning it, and otherwise a bid.
 *
 * The amount is theirs to name. The seller's increment sets the floor
 * — a lot cannot be nudged up a gold piece at a time — but anything
 * from there to what the bidder is holding is a legal bid, so somebody
 * who wants a lot can put it out of reach in one press instead of
 * fifty.
 *
 * It is used from the board and from the player's own bidding history,
 * where the lot they were outbid on is answered without going looking
 * for it again
 */
export function BidControls(props: {
  auction: AuctionRecord;
  player: string;
  gold: number;
  onBid: (amount: number) => void;
}): JSX.Element {
  const [named, setNamed] = createSignal(0);

  /**
   * What the bid would be: what the player typed, never below the
   * floor. The floor moves whenever somebody else bids, and this moves
   * with it rather than leaving a stale number in the box
   */
  const amount = (): number => Math.max(named(), nextBid(props.auction));

  const affordable = (): boolean => props.gold >= nextBid(props.auction);

  return (
    // A seller bidding on their own lot would be selling to
    // themselves, and the standing bidder is already winning it:
    // bidding against themselves could only cost them gold
    <Show when={props.auction.seller !== props.player} fallback={<Badge tone="tide">yours</Badge>}>
      <Show
        when={props.auction.bidder !== props.player}
        fallback={<Badge tone="leaf">yours unless somebody raises it</Badge>}
      >
        <Show
          when={affordable()}
          fallback={<Meta>{nextBid(props.auction)} gold is more than you hold</Meta>}
        >
          <Row class="gap-1.5">
            <Field label="Bid">
              <input
                type="number"
                min={nextBid(props.auction)}
                max={props.gold}
                value={amount()}
                onInput={(event) => {
                  setNamed(Number(event.currentTarget.value));
                }}
              />
            </Field>
            <Button
              tone="primary"
              disabled={amount() > props.gold}
              onClick={() => {
                props.onBid(amount());
              }}
            >
              Bid {amount()} gold
            </Button>
          </Row>
        </Show>
      </Show>
    </Show>
  );
}

/**
 * One lot on the board: what it is, what it stands at, how long it has
 * left, and the bid box
 */
function BidRow(props: {
  auction: AuctionRecord;
  player: string;
  gold: number;
  name?: string;
  onBid: (amount: number) => void;
}): JSX.Element {
  return (
    <ListRow class="flex-col items-stretch sm:flex-row sm:items-center">
      <div class="flex grow flex-col gap-0.5">
        <span class="font-medium">
          <AuctionLotLabel auction={props.auction} name={props.name} />
        </span>
        <Meta>
          {describeBid(props.auction)} · {describeRemaining(props.auction.endsAt, now())}
        </Meta>
      </div>
      <BidControls
        auction={props.auction}
        player={props.player}
        gold={props.gold}
        onBid={props.onBid}
      />
    </ListRow>
  );
}

export interface AuctionTabProps {
  player: string;
}

/**
 * The auction house: what is on the block, what the player has won and
 * not collected, and the one lot they may put up themselves.
 *
 * Putting something up cannot be undone while the lot runs — the item
 * leaves the bag and the pokemon leaves the player's records there and
 * then — so it takes a second press, the way letting a pokemon go does.
 * Only a lot the day ended on without a bid comes back, and it comes
 * back here
 */
export default function AuctionTab(props: AuctionTabProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);

  // The balance moves with every bid placed and every one handed back,
  // so it is followed rather than read once
  const profile = from<Profile | null>((set) =>
    watchProfile(props.player, (record) => {
      set(record);
    }),
  );

  const gold = (): number => profile()?.gold ?? 0;

  // Everything nobody has collected yet: a bid raises a listing under
  // whoever is looking at it, so the board is followed rather than
  // read once
  const auctions = from<[string, AuctionRecord][]>((set) =>
    watchOpenAuctions((open) => {
      set(open.sort(([, one], [, other]) => one.endsAt - other.endsAt));
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
    async (key): Promise<Map<string, string>> => {
      const named = new Map<string, string>();

      await Promise.all(
        key
          .split(',')
          .filter(Boolean)
          .map(async (id) => {
            const caught = await getCaught(id);

            if (caught != null) {
              named.set(id, describeCatch(caught));
            }
          }),
      );
      return named;
    },
  );

  /**
   * What a lot is called, for searching and for the row itself
   */
  const nameOf = (auction: AuctionRecord): string | undefined =>
    nameItemLot(auction) ?? lots()?.get(auction.caught);

  /**
   * What was typed. A board is somebody else's shelf — a player comes
   * to it looking for one thing, so it is searched by what the lot is
   * rather than scrolled
   */
  const [query, setQuery] = createSignal('');

  const open = (): [string, AuctionRecord][] =>
    (auctions() ?? []).filter(([, auction]) => isLive(auction, now()));

  /**
   * The lots still taking bids, soonest to close first. A lot whose
   * name has not arrived yet is left in: it is on the board, and
   * hiding it until its pokemon loads would be a board that shrinks
   * while it is being read
   */
  const live = (): [string, AuctionRecord][] =>
    open().filter(([, auction]) => {
      const name = nameOf(auction);

      return name == null || matches(name, query());
    });

  /**
   * The ones this player won and has not come back for
   */
  const won = (): [string, AuctionRecord][] =>
    (auctions() ?? []).filter(([, auction]) => canClaim(auction, props.player, now()));

  /**
   * The player's own lots that ran their day out without a single bid.
   * Nobody won them, so there is nobody to hand them to but the seller
   */
  const unsold = (): [string, AuctionRecord][] =>
    (auctions() ?? []).filter(([, auction]) => canReclaim(auction, props.player, now()));

  /**
   * The auction the player has running, if any. A seller runs one at a
   * time, so this is what the sell form asks before it offers anything
   */
  const [standing, { refetch: refetchStanding }] = createResource(
    () => props.player,
    getSellerStanding,
  );

  const running = (): number | null => {
    const mine = standing();

    return mine != null && now() < mine.endsAt ? mine.endsAt : null;
  };

  // Bumped whenever something leaves the player's hands or lands in
  // them, so the two pickers below re-read what there is to sell
  const [revision, setRevision] = createSignal(0);
  const refresh = (): void => {
    setRevision(revision() + 1);
  };

  const [item, setItem] = createSignal<Items | null>(null);
  const [caught, setCaught] = createSignal<string | null>(null);
  const [startingBid, setStartingBid] = createSignal(MIN_STARTING_BID);
  const [increment, setIncrement] = createSignal(MIN_INCREMENT);
  /**
   * Whether the sell button has been pressed once. A lot cannot be
   * taken back off the block, so it takes a second press
   */
  const [listing, setListing] = createSignal(false);

  /**
   * Picking one clears the other: one lot goes up, not two
   */
  const pickItem = (picked: Items | null): void => {
    setItem(picked);
    setCaught(null);
    setListing(false);
  };

  const pickCatch = (picked: string | null): void => {
    setCaught(picked);
    setItem(null);
    setListing(false);
  };

  const settle = (opening: Promise<string | null>): void => {
    opening
      .then(async (id) => {
        setStatus(
          id == null
            ? 'It could not be put up — you may already have an auction running.'
            : 'It is on the block until the day is up.',
        );
        setItem(null);
        setCaught(null);
        await refetchStanding();
        refresh();
      })
      .catch((thrown: unknown) => {
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  const list = (): void => {
    const offeredItem = item();
    const offeredCatch = caught();

    if (offeredItem == null && offeredCatch == null) {
      setStatus('Pick something to put up first.');
      return;
    }
    if (!listing()) {
      setListing(true);
      return;
    }

    const terms = { startingBid: startingBid(), increment: increment() };

    setStatus(null);
    setListing(false);

    if (offeredItem != null) {
      settle(openItemAuction(offeredItem, terms));
      return;
    }
    if (offeredCatch != null) {
      settle(openCatchAuction(offeredCatch, terms));
    }
  };

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

  return (
    <Panel
      title="Auctions"
      lede="Every lot runs for a day. Whatever is put up leaves its owner's hands there and then,
        and the last bidder standing collects it once bidding closes. A bid is paid as it is made
        and handed back if somebody raises it. A lot nobody bid on goes back to whoever listed it."
    >
      <Row>
        <Badge tone="gold">{gold()} gold</Badge>
      </Row>

      <Card>
        <Row>
          <h3 class="grow">On the block</h3>
          <Show when={open().length > SEARCH_FROM}>
            <Search
              placeholder="Search the lots"
              value={query()}
              onChange={(typed) => {
                setQuery(typed);
              }}
            />
          </Show>
        </Row>
        <Show when={auctions()} fallback={<Note>Loading auctions…</Note>}>
          <Show
            when={live().length}
            fallback={
              <Note>
                {query().length === 0
                  ? 'Nothing is up for auction right now.'
                  : 'No lot on the block matches.'}
              </Note>
            }
          >
            <List>
              <For each={live()}>
                {([id, auction]) => (
                  <BidRow
                    auction={auction}
                    player={props.player}
                    gold={gold()}
                    name={nameOf(auction)}
                    onBid={(amount) => {
                      bid(id, amount);
                    }}
                  />
                )}
              </For>
            </List>
          </Show>
        </Show>
      </Card>

      {/* Nothing is handed over when bidding closes; the winner comes
          back for it, and the seller is paid out of the same claim */}
      <Card title="Won">
        <Show when={won().length} fallback={<Note>Nothing waiting to be collected.</Note>}>
          <List>
            <For each={won()}>
              {([id, auction]) => (
                <ListRow>
                  <span class="grow font-medium">
                    <AuctionLotLabel auction={auction} name={nameOf(auction)} />
                  </span>
                  <Meta>won for {auction.bid} gold</Meta>
                  <Button
                    tone="primary"
                    onClick={() => {
                      collect(id);
                    }}
                  >
                    Collect
                  </Button>
                </ListRow>
              )}
            </For>
          </List>
        </Show>
      </Card>

      {/* A lot the day ran out on without a bid has no winner to go to,
          so it goes back where it came from */}
      <Card title="Unsold">
        <Show when={unsold().length} fallback={<Note>Nothing of yours went unsold.</Note>}>
          <List>
            <For each={unsold()}>
              {([id, auction]) => (
                <ListRow>
                  <span class="grow font-medium">
                    <AuctionLotLabel auction={auction} name={nameOf(auction)} />
                  </span>
                  <Meta>nobody bid</Meta>
                  <Button
                    tone="primary"
                    onClick={() => {
                      reclaim(id);
                    }}
                  >
                    Take it back
                  </Button>
                </ListRow>
              )}
            </For>
          </List>
        </Show>
      </Card>

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
          <Note>
            One item — a single one, not the stack — or one pokemon. Whichever it is leaves your
            hands the moment it goes up and cannot be taken off the block; it only comes back if the
            day ends with nobody having bid on it.
          </Note>

          <h4>From the bag</h4>
          <InventoryPicker
            inline
            revision={revision()}
            value={item()}
            verb="Sell"
            empty="Carrying nothing to sell."
            onPick={pickItem}
          />

          <h4>From the records</h4>
          {/* A pokemon in a raid is fighting on a frozen copy of a
              record that has to still be there when the battle ends, so
              it cannot be sold out from under it */}
          <CatchPicker
            inline
            revision={revision()}
            value={caught()}
            verb="Sell"
            empty="No pokemon to sell."
            reason={(option) => (option.fighting ? 'in a raid' : null)}
            onPick={pickCatch}
          />

          <Row>
            <Field label="Asking price">
              <input
                type="number"
                min={MIN_STARTING_BID}
                value={startingBid()}
                onInput={(event) => {
                  setStartingBid(Number(event.currentTarget.value));
                  setListing(false);
                }}
              />
            </Field>
            <Field label="Least raise">
              <input
                type="number"
                min={MIN_INCREMENT}
                value={increment()}
                onInput={(event) => {
                  setIncrement(Number(event.currentTarget.value));
                  setListing(false);
                }}
              />
            </Field>
          </Row>

          <Row>
            {/* Putting something up cannot be undone, so the second
                press is the one that does it — and it is the one that
                looks like it */}
            <Button tone={listing() ? 'danger' : 'primary'} onClick={list}>
              {listing() ? 'Put it out of reach for a day?' : 'Put it up for auction'}
            </Button>
            <Show when={listing()}>
              <Button
                onClick={() => {
                  setListing(false);
                }}
              >
                Keep it
              </Button>
            </Show>
          </Row>
        </Show>
      </Card>

      <Status message={status()} />
    </Panel>
  );
}
