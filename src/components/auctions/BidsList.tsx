import { type Accessor, For, Loading, Show, createMemo, createSignal, refresh } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  AuctionLot,
  type AuctionRecord,
  type BidHistoryEntry,
  BidState,
  canClaim,
  claimAuction,
  getBidState,
  isLive,
  listBidHistory,
} from '../../auth/auctions';
import {
  Button,
  GroupLabel,
  LIST_PAGE,
  List,
  Note,
  Pill,
  type PillTone,
  RowActions,
  RowCard,
  RowText,
  Status,
  createPager,
} from '../styled';
import { AuctionLotLabel } from './auction-tab/lots';
import { describeRemaining } from './auction-tab/time';
import LotFace from './LotFace';
import { useGame } from '../app/game-context';
import playEffect, { Effect } from '../app/sound';
import describeFailure from '../../i18n/refusals';
import { formatNumber } from '../../i18n/format';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * Where the player stands, said the way they would say it
 */
const BID_STATE_LABELS: Record<BidState, () => string> = {
  [BidState.Leading]: m.auction_pill_winning,
  [BidState.Outbid]: m.auction_pill_outbid,
  [BidState.Won]: m.auction_pill_won,
  [BidState.Lost]: m.auction_pill_lost,
  [BidState.Collected]: m.auction_pill_collected,
};

/**
 * The same five states, said in colour. Standing to win a lot and
 * having lost it are the two things a player scans this list for, so
 * they are the two the eye can tell apart without reading
 */
const BID_STATE_TONES: Record<BidState, PillTone> = {
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
  const amount = formatNumber(mine);
  const standing = formatNumber(auction.bid);

  switch (state) {
    case BidState.Leading:
      return m.auction_line_leading();
    case BidState.Outbid:
      return m.auction_line_outbid({ standing });
    case BidState.Won:
      return m.auction_line_won({ amount });
    case BidState.Lost:
      return m.auction_line_lost({ standing });
    default:
      return m.auction_line_collected({ amount });
  }
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
  props: BidsListProps & { history: Accessor<BidHistoryEntry[]>; onChanged: () => void },
): JSX.Element {
  const game = useGame();
  const [status, setStatus] = createSignal<string | null>(null);

  const paged = createPager(() => props.history(), LIST_PAGE);

  const collect = (id: string): void => {
    setStatus(null);
    claimAuction(id)
      .then((claimed) => {
        if (claimed) {
          playEffect(Effect.TradeComplete);
        }
        setStatus(claimed ? m.auction_collected() : m.auction_collect_failed());
        props.onChanged();
      })
      .catch((thrown: unknown) => {
        setStatus(describeFailure(thrown));
      });
  };

  return (
    <>
      <Show when={props.history().length} fallback={<Note>{m.auction_no_bids()}</Note>}>
        <GroupLabel>{m.profile_section_bids()}</GroupLabel>
        <List>
          <For each={paged.shown()}>
            {(entry) => {
              const state = (): BidState => getBidState(entry.lot, props.player, Date.now());
              const line = (): string => {
                const standing = describeStanding(entry.lot, entry.bid.amount, state());

                return isLive(entry.lot, Date.now())
                  ? `${standing} · ${describeRemaining(entry.lot.endsAt, Date.now())}`
                  : standing;
              };

              return (
                <RowCard>
                  <LotFace auction={entry.lot} />
                  <RowText name={<AuctionLotLabel auction={entry.lot} />} line={line()} />
                  <Pill tone={BID_STATE_TONES[state()]}>{BID_STATE_LABELS[state()]()}</Pill>
                  <RowActions>
                    {/* The whole record, read-only: a pokemon on the
                        block is somebody else's */}
                    <Show when={entry.lot.lot === AuctionLot.Catch && entry.lot.caught !== ''}>
                      <Button
                        onClick={() => {
                          game.setSheet({ catchId: entry.lot.caught, readOnly: true });
                        }}
                      >
                        {m.friends_view()}
                      </Button>
                    </Show>
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
                        {m.auction_collect()}
                      </Button>
                    </Show>
                  </RowActions>
                </RowCard>
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
 * `Loading` written here and blank the page instead of this panel
 */
export default function BidsList(props: BidsListProps): JSX.Element {
  const history = createMemo(async () => listBidHistory(props.player));

  return (
    <Loading fallback={<Note>{m.auction_loading_bids()}</Note>}>
      <BidRows
        player={props.player}
        history={history}
        onChanged={() => {
          refresh(history).catch(() => undefined);
        }}
      />
    </Loading>
  );
}
