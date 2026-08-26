import { For, type JSX, Show, createSignal } from 'solid-js';
import {
  type AuctionRecord,
  canReclaim,
  isBidOn,
  isLive,
  reclaimAuction,
} from '../../auth/auctions';
import { AuctionLotLabel } from './auction-tab/lots';
import { describeRemaining, describeStanding } from './auction-tab/time';
import {
  Badge,
  type BadgeTone,
  Button,
  LIST_PAGE,
  List,
  ListRow,
  Meta,
  Note,
  Status,
  createPager,
} from '../styled';

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

const LOT_STATE_LABELS: Record<LotState, string> = {
  [LotState.Running]: 'on the block',
  [LotState.Sold]: 'sold',
  [LotState.Unsold]: 'nobody bid',
  [LotState.Done]: 'settled',
};

/**
 * The four states in colour. The one worth spotting without reading is
 * the lot waiting to be taken back, since it is the only one that
 * asks the player for anything
 */
const LOT_STATE_TONES: Record<LotState, BadgeTone> = {
  [LotState.Running]: 'leaf',
  [LotState.Sold]: 'gold',
  [LotState.Unsold]: 'ember',
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
    return `${describeStanding(auction)} · ${describeRemaining(auction.endsAt, at)}`;
  }
  if (state === LotState.Unsold) {
    return 'It comes back to you.';
  }
  return `${auction.bid} gold`;
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
   * How many are sitting in escrow waiting to be taken back. It is
   * said above the list as well as on the rows, because it is the one
   * thing here a player is being asked to act on
   */
  const stranded = (): number =>
    listed().filter(([, lot]) => canReclaim(lot, props.player, Date.now())).length;

  const takeBack = (id: string): void => {
    setStatus(null);
    reclaimAuction(id)
      .then((reclaimed) => {
        setStatus(reclaimed ? 'Back in your hands.' : 'That lot could not be taken back.');
        props.onChanged();
      })
      .catch((thrown: unknown) => {
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  return (
    <>
      <Show when={stranded() > 0}>
        <Note>
          {stranded() === 1
            ? 'One lot came back unsold and is waiting for you to take it.'
            : `${stranded()} lots came back unsold and are waiting for you to take them.`}
        </Note>
      </Show>

      <Show when={listed().length} fallback={<Note>You have not put anything on the block.</Note>}>
        <List>
          <For each={paged.shown()}>
            {([id, lot]) => {
              const state = (): LotState => getLotState(lot, Date.now());

              return (
                <ListRow class="flex-col items-stretch sm:flex-row sm:items-center">
                  <div class="flex grow flex-col gap-0.5">
                    <span class="font-medium">
                      <AuctionLotLabel auction={lot} />
                    </span>
                    <Meta>{describeLot(lot, state(), Date.now())}</Meta>
                  </div>
                  <Badge tone={LOT_STATE_TONES[state()]}>{LOT_STATE_LABELS[state()]}</Badge>
                  {/* Nothing hands an unsold lot back on its own, so
                      this is the only way it ever returns */}
                  <Show when={canReclaim(lot, props.player, Date.now())}>
                    <Button
                      tone="primary"
                      onClick={() => {
                        takeBack(id);
                      }}
                    >
                      Take back
                    </Button>
                  </Show>
                </ListRow>
              );
            }}
          </For>
        </List>
        {paged.controls()}
      </Show>

      <Meta class="block">
        One lot at a time, and it runs for a day. New listings are made at an auction board.
      </Meta>

      <Status message={status()} />
    </>
  );
}
