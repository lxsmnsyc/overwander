import { For, type JSX, Show, createResource, createSignal, from } from 'solid-js';
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
} from '../auth/auctions';
import { isLockLive } from '../auth/battle-lock';
import { getBuddy } from '../auth/buddy';
import { syncServerClock } from '../auth/clock';
import {
  type CaughtPokemon,
  countCaught,
  getCaught,
  isFavorite,
  listCaughtMarked,
} from '../auth/caught';
import { isShiny } from '../auth/caught-record';
import { SpawnRarity, getSpawnRarity } from '../data/biome';
import { isEgg } from '../auth/egg';
import { isPerfectIVs } from '../data/items/bottle-caps';
import { type Profile, getProfile, watchProfile } from '../auth/profile';
import { MAX_IV_STARS, getIVStars } from '../data/constants/stats';
import { NATURE_NAMES } from '../data/ids/natures';
import AuctionDialog, { type AuctionSubject } from './AuctionDialog';
import { describeAbility } from './CatchDialog';
import CatchPicker, { type CatchOption } from './CatchPicker';
import { describeCatch } from './catch-summary';
import InventoryPicker, { describeItem } from './InventoryPicker';
import matches from '../core/search';
import { useGame } from './game-context';
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
  RowButton,
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
 * What a lot that has stopped taking bids is waiting for: the player
 * to come and get it. A won lot is collected and an unsold one is
 * taken back, which are the same row with different words on it
 */
interface LotClaim {
  said: string;
  label: string;
  onClaim: () => void;
}

/**
 * One lot on the board: what it is, what it stands at, how long it has
 * left, and either the bid box or the way to collect it
 */
function LotRow(props: {
  auction: AuctionRecord;
  player: string;
  gold: number;
  name?: string;
  /**
   * What the pokemon on the block actually is — its values, nature and
   * abilities. Absent for an item lot, and for an egg
   */
  detail?: string | null;
  seller: string;
  /**
   * Open the pokemon on the block in full. Absent for an item lot,
   * which is already entirely described by its name
   */
  onInspect?: () => void;
  /**
   * Set when bidding is over and this lot is the player's to take,
   * which is what a row offers instead of a bid
   */
  claim?: LotClaim;
  onBid: (amount: number) => void;
}): JSX.Element {
  return (
    <ListRow class="flex-col items-stretch sm:flex-row sm:items-center">
      <div class="flex grow flex-col gap-0.5">
        {/* A pokemon is worth looking at before bidding on, so its
            name is the way in; an item lot has nothing further to
            show and stays plain text */}
        <Show
          when={props.onInspect}
          fallback={
            <span class="font-medium">
              <AuctionLotLabel auction={props.auction} name={props.name} />
            </span>
          }
        >
          {(inspect) => (
            <RowButton class="font-medium" onClick={inspect()}>
              <AuctionLotLabel auction={props.auction} name={props.name} />
            </RowButton>
          )}
        </Show>
        {/* What it stands at is what a bidder needs; a lot that has
            stopped taking bids says what it went for beside the
            button instead, since "40 gold to take it" reads as an
            offer on something nobody can bid on any more */}
        <Meta>
          {props.claim == null ? `${describeBid(props.auction)} · ` : ''}
          {describeRemaining(props.auction.endsAt, now())} · listed by {props.seller}
        </Meta>
        {/* What is worth paying for, on a line of its own: it is
            longer than everything above it and read differently —
            a bidder scans it once and then decides */}
        <Show when={props.detail}>{(said) => <Meta>{said()}</Meta>}</Show>
      </div>
      <Show
        when={props.claim}
        fallback={
          <BidControls
            auction={props.auction}
            player={props.player}
            gold={props.gold}
            onBid={props.onBid}
          />
        }
      >
        {(claim) => (
          <Row class="gap-1.5">
            <Meta>{claim().said}</Meta>
            <Button tone="primary" onClick={claim().onClaim}>
              {claim().label}
            </Button>
          </Row>
        )}
      </Show>
    </ListRow>
  );
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
export default function AuctionTab(props: AuctionTabProps): JSX.Element {
  const game = useGame();
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
   * What a bidder is actually buying, for a pokemon: how good its
   * values are, its nature and its abilities. None of it can be
   * changed by the seller and none of it is visible from the name, so
   * a lot without it is a bid placed on a species and a level.
   *
   * The values are a **rating** rather than the six numbers. A board
   * that prints them does the buyer's arithmetic for them and turns
   * bidding into a lookup; a row of stars says how good the pokemon is
   * without saying which stat carries it, so the bid stays a judgement
   * and the last of what is worth knowing is learned by winning it.
   *
   * An egg says nothing at all — what is inside one is hidden from
   * everybody but its owner, and the board is not the place to give it
   * away
   */
  const detailOf = (auction: AuctionRecord): string | null => {
    const caught = lots()?.get(auction.caught);

    if (caught == null || isEgg(caught)) {
      return null;
    }

    const stars = getIVStars(caught.ivs);

    return [
      `${'★'.repeat(stars)}${'☆'.repeat(MAX_IV_STARS - stars)}`,
      NATURE_NAMES[caught.nature],
      caught.abilities.map(describeAbility).join(', '),
    ]
      .filter(Boolean)
      .join(' · ');
  };

  /**
   * What was typed. A board is somebody else's shelf — a player comes
   * to it looking for one thing, so it is searched by what the lot is
   * rather than scrolled
   */
  const [query, setQuery] = createSignal('');

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
   * The pokemon that could go on the block, asked of the **store**
   * rather than read out of the whole box and sifted here.
   *
   * That is what the record's `auctionable` field is for: a player with
   * three hundred catches has perhaps three that qualify, and the
   * question "which of mine are worth a listing" is otherwise three
   * hundred document reads to answer.
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
   * Why this one is worth a listing, in a word. It is the same three
   * answers `isAuctionableCatch` accepts, said back to the player so
   * the list reads as a reason rather than as an arbitrary shortlist
   */
  const sellingWorth = (option: CatchOption): string | null => {
    const worth: string[] = [];

    if (isShiny(option.caught)) {
      worth.push('shiny');
    }
    if (isPerfectIVs(option.caught.ivs)) {
      worth.push('perfect');
    }
    if (getSpawnRarity(option.caught.species) === SpawnRarity.Special) {
      worth.push('legendary');
    }
    return worth.length === 0 ? null : worth.join(' · ');
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

        return name == null || matches(name, query());
      });

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

  /**
   * The board, split by what is actually on it. An item and a pokemon
   * are not the same purchase — one is a stack somebody needs and the
   * other is an individual with its own numbers — and a single column
   * mixing them means scrolling past everything you are not shopping
   * for
   */
  const lotsOf = (kind: AuctionLot): [string, AuctionRecord][] =>
    board().filter(([, auction]) => auction.lot === kind);

  const column = (kind: AuctionLot, empty: string): JSX.Element => (
    <Show
      when={lotsOf(kind).length}
      fallback={<Note>{query().length === 0 ? empty : 'Nothing here matches.'}</Note>}
    >
      <List>
        <For each={lotsOf(kind)}>
          {([id, auction]) => (
            <LotRow
              auction={auction}
              player={props.player}
              gold={gold()}
              name={nameOf(auction)}
              detail={detailOf(auction)}
              seller={describeSeller(auction)}
              claim={claimOf(id, auction)}
              onInspect={
                auction.lot === AuctionLot.Catch
                  ? () => {
                      // A pokemon on the block is somebody else's, so
                      // it opens read-only: the whole record, and
                      // nothing to press
                      game.setSheet({ catchId: auction.caught, readOnly: true });
                    }
                  : undefined
              }
              onBid={(amount) => {
                bid(id, amount);
              }}
            />
          )}
        </For>
      </List>
    </Show>
  );

  return (
    <Panel>
      <Row class="justify-center">
        <Badge tone="gold">{gold()} gold</Badge>
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

      {/* Putting something up, opened from the Add button in the top
          bar. It stands in front of the board rather than under it:
          somebody selling is not shopping at the same moment */}
      <Show when={props.adding === true}>
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
              note={sellingWorth}
              onPick={(picked) => {
                if (picked != null) {
                  setOffered({ lot: AuctionLot.Catch, catchId: picked });
                }
              }}
            />
          </Show>
          <Row class="justify-center">
            <Button
              onClick={() => {
                props.onAdding?.(false);
              }}
            >
              Done
            </Button>
          </Row>
        </Card>
      </Show>

      <Show when={auctions()} fallback={<Note>Loading auctions…</Note>}>
        {/* Items on the left, pokemon on the right — side by side
            where there is room, stacked where there is not */}
        <div class="grid gap-4 md:grid-cols-2">
          <Card title="Items">{column(AuctionLot.Item, 'No items are up right now.')}</Card>
          <Card title="Pokemon">{column(AuctionLot.Catch, 'No pokemon are up right now.')}</Card>
        </div>
      </Show>

      <Status message={status()} />

      {/* Putting something up: what it is, the terms, and a second
          dialog that says what listing actually means */}
      <AuctionDialog
        subject={offered()}
        onClose={() => {
          setOffered(null);
        }}
        onListed={() => {
          setStatus('It is on the block until the day is up.');
          props.onAdding?.(false);
          // The board and the seller's one-a-day standing both move
          // with it; a failed re-read leaves the last good board up
          Promise.resolve(refetchStanding())
            .then(refresh)
            .catch(() => undefined);
        }}
      />
    </Panel>
  );
}
