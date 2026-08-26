import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
} from 'solid-js';
import {
  type AuctionRecord,
  type BidHistoryEntry,
  BidState,
  canClaim,
  claimAuction,
  getBidState,
  listBidHistory,
} from '../../auth/auctions';
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
 * you learn by looking.
 *
 * What they cannot do here is answer it. **Bidding happens at an
 * auction board and nowhere else**, so a raise costs the walk the
 * first bid cost; this list says where a player stands and hands over
 * what they have already won, which is theirs rather than the
 * market's.
 *
 * Nothing is polled. Whether bidding has closed is this reader's own
 * clock against the closing time the listing was written with, and the
 * server checks it again for real when a claim arrives
 */
function BidRows(
  props: BidsListProps & { history: Resource<BidHistoryEntry[]>; onChanged: () => void },
): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);

  const paged = createPager(() => props.history() ?? [], LIST_PAGE);

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
                  {/* Nothing is handed over when bidding closes, so a
                        won lot is collected here. Answering a raise is
                        not offered: that is the board's */}
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
