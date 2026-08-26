import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
  from,
} from 'solid-js';
import {
  type AuctionRecord,
  type BidHistoryEntry,
  BidState,
  canClaim,
  canRebid,
  claimAuction,
  getBidState,
  listBidHistory,
  placeBid,
} from '../../auth/auctions';
import { type Profile, watchProfile } from '../../auth/profile';
import { BidControls } from './auction-tab/bidding';
import { AuctionLotLabel } from './auction-tab/lots';
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
 * Where the player stands, said the way they would say it
 */
const BID_STATE_LABELS: Record<BidState, string> = {
  [BidState.Leading]: 'leading',
  [BidState.Outbid]: 'outbid',
  [BidState.Won]: 'won — waiting to be collected',
  [BidState.Lost]: 'lost',
  [BidState.Collected]: 'won and collected',
};

/**
 * The same five states, said in colour. Standing to win a lot and
 * having lost it are the two things a player scans this list for, so
 * they are the two the eye can tell apart without reading
 */
const BID_STATE_TONES: Record<BidState, BadgeTone> = {
  [BidState.Leading]: 'leaf',
  [BidState.Outbid]: 'ember',
  [BidState.Won]: 'gold',
  [BidState.Lost]: 'neutral',
  [BidState.Collected]: 'neutral',
};

/**
 * What the lot stands at now, next to what this player put in. The two
 * are the same number only while they are the ones winning it
 */
function describeStanding(auction: AuctionRecord, mine: number, state: BidState): string {
  return state === BidState.Leading || state === BidState.Won || state === BidState.Collected
    ? `${mine} gold`
    : `you bid ${mine} · standing at ${auction.bid}`;
}

export interface BidsListProps {
  player: string;
}

/**
 * Everything the player has bid on, newest first.
 *
 * The lot itself only keeps the bid that is standing — that is all it
 * needs to settle — so this is read from the player's own bid records
 * and the lots looked up from them. A player outbid an hour ago still
 * finds the lot here, which is the point: being outbid is something
 * you learn by looking, so the answer to it is here too. A lot that is
 * still open takes another bid without going back to the board.
 *
 * Nothing is polled. Whether bidding has closed is this reader's own
 * clock against the closing time the listing was written with, and the
 * server checks it again for real when a bid or a claim arrives
 */
function BidRows(
  props: BidsListProps & { history: Resource<BidHistoryEntry[]>; onChanged: () => void },
): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);

  // Bidding again spends gold, so the balance the bid box is bounded
  // by is followed rather than read once
  const profile = from<Profile | null>((set) =>
    watchProfile(props.player, (record) => {
      set(record);
    }),
  );

  const gold = (): number => profile()?.gold ?? 0;

  const paged = createPager(() => props.history() ?? [], LIST_PAGE);

  const bid = (id: string, amount: number): void => {
    setStatus(null);
    placeBid(id, amount)
      .then((placed) => {
        setStatus(
          placed == null
            ? 'That bid could not be placed.'
            : `Bid ${placed} gold — it is yours unless somebody raises it.`,
        );
        props.onChanged();
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
        props.onChanged();
      })
      .catch((thrown: unknown) => {
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  return (
    <>
      <Show when={props.history()?.length} fallback={<Note>You have not bid on anything.</Note>}>
        <List>
          <For each={paged.shown()}>
            {(entry) => {
              const state = (): BidState => getBidState(entry.lot, props.player, Date.now());

              return (
                <ListRow class="flex-col items-stretch sm:flex-row sm:items-center">
                  <div class="flex grow flex-col gap-0.5">
                    <span class="font-medium">
                      <AuctionLotLabel auction={entry.lot} />
                    </span>
                    <Meta>{describeStanding(entry.lot, entry.bid.amount, state())}</Meta>
                  </div>
                  <Badge tone={BID_STATE_TONES[state()]}>{BID_STATE_LABELS[state()]}</Badge>
                  {/* Outbid, and the lot is still open: the raise is
                        made here rather than by finding it again on
                        the board */}
                  <Show when={canRebid(entry.lot, props.player, Date.now())}>
                    <BidControls
                      auction={entry.lot}
                      player={props.player}
                      gold={gold()}
                      onBid={(amount) => {
                        bid(entry.auction, amount);
                      }}
                    />
                  </Show>
                  {/* Nothing is handed over when bidding closes, so a
                        won lot is collected here too */}
                  <Show when={canClaim(entry.lot, props.player, Date.now())}>
                    <Button
                      tone="primary"
                      onClick={() => {
                        collect(entry.auction);
                      }}
                    >
                      Collect
                    </Button>
                  </Show>
                </ListRow>
              );
            }}
          </For>
        </List>
        {paged.controls()}
      </Show>

      <Status message={status()} />
    </>
  );
}

/**
 * Everything the player has bid on, newest first.
 *
 * The history is read one component down, under this boundary: read in
 * the body that declared it, a loading history would throw past every
 * `Suspense` written here and blank the page instead of this panel
 */
export default function BidsList(props: BidsListProps): JSX.Element {
  const [history, { refetch }] = createResource(() => props.player, listBidHistory);

  return (
    <Suspense fallback={<Note>Loading bids…</Note>}>
      <BidRows
        player={props.player}
        history={history}
        onChanged={() => {
          Promise.resolve(refetch()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
