import { For, Show, createSignal, from } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  type AuctionRecord,
  canReclaim,
  isBidOn,
  isLive,
  reclaimAuction,
} from '../../auth/auctions';
import { type Profile, watchProfile } from '../../auth/profile';
import { useGame } from '../app/game-context';
import PlayerPlate from '../profile/PlayerPlate';
import { AuctionLotLabel } from './auction-tab/lots';
import { describeRemaining } from './auction-tab/time';
import {
  Button,
  GroupLabel,
  LIST_PAGE,
  List,
  Meta,
  Note,
  Pill,
  type PillTone,
  RowActions,
  RowCard,
  RowText,
  Status,
  createPager,
} from '../styled';
import LotFace from './LotFace';
import describeFailure from '../../i18n/refusals';
import { formatNumber } from '../../i18n/format';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * What the player has put on the block, and what became of it.
 *
 * The block itself is read at an auction board out in the world —
 * browsing what other people are selling is the market, and the walk
 * to it is the point. This is the other half: a lot already in escrow
 * is the player's own property, and making them walk to look at their
 * own pokemon would be inventory management by geography.
 *
 * It matters most for the lot **nobody bid on**. Nothing sweeps those
 * back: an unsold pokemon sits in escrow owning nothing until its
 * seller reclaims it by hand, and the one-a-day rule counts running
 * auctions rather than unsettled ones — so a seller can go on listing
 * for weeks with a pokemon stranded behind them and never be told.
 * This is where they find it.
 */

/**
 * Where a lot of the player's own stands
 */
const enum LotState {
  /** Still taking bids */
  Running = 0,
  /** Closed with a bidder, waiting on them to come and collect */
  Sold = 1,
  /** Closed with nobody having bid: it comes back, by hand */
  Unsold = 2,
  /** Collected by its winner, or already taken back */
  Done = 3,
}

const LOT_STATE_LABELS: Record<LotState, () => string> = {
  [LotState.Running]: m.auction_pill_running,
  [LotState.Sold]: m.auction_pill_sold,
  [LotState.Unsold]: m.auction_pill_unsold,
  [LotState.Done]: m.auction_pill_settled,
};

/**
 * The four states in colour. The one worth spotting without reading is
 * the lot waiting to be taken back, since it is the only one that
 * asks the player for anything
 */
const LOT_STATE_TONES: Record<LotState, PillTone> = {
  [LotState.Running]: 'leaf',
  [LotState.Sold]: 'gold',
  [LotState.Unsold]: 'neutral',
  [LotState.Done]: 'neutral',
};

function getLotState(auction: AuctionRecord, at: number): LotState {
  if (isLive(auction, at)) {
    return LotState.Running;
  }
  if (auction.settled) {
    return LotState.Done;
  }
  return isBidOn(auction) ? LotState.Sold : LotState.Unsold;
}

/**
 * What the row says under the lot's name: what it fetched and how long
 * it has, or what became of it
 */
function describeLot(auction: AuctionRecord, state: LotState, at: number): string {
  if (state === LotState.Running) {
    const standing = isBidOn(auction)
      ? m.auction_line_running({ amount: formatNumber(auction.bid) })
      : m.auction_line_opening({ amount: formatNumber(auction.startingBid) });

    return `${standing} · ${describeRemaining(auction.endsAt, at)}`;
  }
  if (state === LotState.Unsold) {
    return m.auction_line_unsold();
  }
  return isBidOn(auction)
    ? m.auction_line_sold({ amount: formatNumber(auction.bid) })
    : m.auction_line_back();
}

/**
 * Whoever holds the top bid, pressable into their profile: a seller
 * wants to know who is buying, and a name alone leads nowhere. The row
 * follows the profile, so the list is paged for it
 */
function BidderPlate(props: { uid: string }): JSX.Element {
  const game = useGame();
  const profile = from<Profile | null>((set) =>
    watchProfile(props.uid, (record) => {
      set(record);
    }),
  );

  return (
    <PlayerPlate
      name={profile()?.nickname ?? m.auction_a_trainer()}
      sprite={profile()?.sprite ?? null}
      onOpen={() => {
        game.setVisiting(props.uid);
      }}
    />
  );
}

export interface SellingListProps {
  player: string;
  /**
   * Every lot this player has put up, oldest first. It is the
   * profile's read rather than this component's: the count of what is
   * stranded is wanted on the tab as well as in it, and the same
   * query twice would be two round trips
   */
  lots: [string, AuctionRecord][];
  /** Fired when a lot came back, so the profile re-reads them */
  onChanged: () => void;
}

export default function SellingList(props: SellingListProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);

  // Newest first: the lot a seller came here about is the last one
  // they listed, and `listAuctionsBy` hands them back oldest first
  const listed = (): [string, AuctionRecord][] => [...props.lots].reverse();

  const paged = createPager(listed, LIST_PAGE);

  /**
   * The page cut into what is on the block, what is waiting in escrow
   * to come back, and what has closed, in that order
   */
  const groups = (): { title: string; rows: [string, AuctionRecord][] }[] => {
    const now = Date.now();
    const running: [string, AuctionRecord][] = [];
    const escrow: [string, AuctionRecord][] = [];
    const closed: [string, AuctionRecord][] = [];

    for (const entry of paged.shown()) {
      if (getLotState(entry[1], now) === LotState.Running) {
        running.push(entry);
      } else if (canReclaim(entry[1], props.player, now)) {
        escrow.push(entry);
      } else {
        closed.push(entry);
      }
    }

    const found: { title: string; rows: [string, AuctionRecord][] }[] = [];

    if (running.length > 0) {
      found.push({ title: m.auction_group_block(), rows: running });
    }
    if (escrow.length > 0) {
      found.push({ title: m.auction_group_escrow(), rows: escrow });
    }
    if (closed.length > 0) {
      found.push({ title: m.auction_group_closed(), rows: closed });
    }
    return found;
  };

  const takeBack = (id: string): void => {
    setStatus(null);
    reclaimAuction(id)
      .then((reclaimed) => {
        setStatus(reclaimed ? m.auction_back_in_hands() : m.auction_take_back_failed());
        props.onChanged();
      })
      .catch((thrown: unknown) => {
        setStatus(describeFailure(thrown));
      });
  };

  return (
    <>
      <Show when={listed().length} fallback={<Note>{m.auction_none_listed()}</Note>}>
        <For each={groups()}>
          {(group) => (
            <>
              <GroupLabel>{group.title}</GroupLabel>
              <List>
                <For each={group.rows}>
                  {([id, lot]) => {
                    const state = (): LotState => getLotState(lot, Date.now());

                    return (
                      <RowCard>
                        <LotFace auction={lot} />
                        <RowText
                          name={<AuctionLotLabel auction={lot} />}
                          line={describeLot(lot, state(), Date.now())}
                        />
                        <Show when={lot.bidder !== ''}>
                          <span class="flex min-w-0 items-center gap-2">
                            <Meta>
                              {state() === LotState.Running
                                ? m.auction_leading()
                                : m.auction_won_by()}
                            </Meta>
                            <BidderPlate uid={lot.bidder} />
                          </span>
                        </Show>
                        <Pill tone={LOT_STATE_TONES[state()]}>{LOT_STATE_LABELS[state()]()}</Pill>
                        {/* Nothing hands an unsold lot back on its own, so
                            this is the only way it ever returns */}
                        <Show when={canReclaim(lot, props.player, Date.now())}>
                          <RowActions>
                            <Button
                              tone="primary"
                              onClick={() => {
                                takeBack(id);
                              }}
                            >
                              {m.auction_collect()}
                            </Button>
                          </RowActions>
                        </Show>
                      </RowCard>
                    );
                  }}
                </For>
              </List>
            </>
          )}
        </For>
        {paged.controls()}
      </Show>

      <Meta class="block">{m.auction_selling_note()}</Meta>

      <Status message={status()} />
    </>
  );
}
