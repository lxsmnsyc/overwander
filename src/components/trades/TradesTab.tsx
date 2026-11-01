import { For, type JSX, Show, createMemo, createResource, createSignal, from } from 'solid-js';
import { isFavorite } from '../../auth/caught';
import { getBuddy } from '../../auth/buddy';
import { isEgg } from '../../model/egg';
import { type Profile, watchProfile } from '../../auth/profile';
import {
  type TradeRecord,
  TradeStatus,
  acceptTrade,
  cancelTrade,
  declineTrade,
  watchTrades,
} from '../../auth/trades';
import { useGame } from '../app/game-context';
import playEffect, { Effect } from '../app/sound';
import CatchPicker, { type CatchOption } from '../catches/catch-picker';
import PlayerPlate from '../profile/PlayerPlate';
import NamedCatch, { fillSentence } from './NamedCatch';
import {
  Badge,
  Button,
  Divider,
  LIST_PAGE,
  List,
  ListRow,
  Meta,
  Note,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
  createPager,
  useToast,
} from '../styled';
import { formatDate, formatNumber } from '../../i18n/format';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * The player's trades: offers to answer, offers waiting on somebody
 * else, and what has already been settled.
 *
 * Rows are drawn by trade id rather than by the record holding it,
 * the way the friends list draws by uid: the watch hands back fresh
 * arrays, and rows keyed by identity would tear down their profile
 * follows on every change
 */
export interface TradesTabProps {
  player: string;
}

/** The two halves of the trades: what is still open, and what is done */
const enum TradesView {
  Pending = 0,
  Settled = 1,
}

/** What a settled trade came to */
const SETTLED_WORDS: Partial<Record<TradeStatus, () => string>> = {
  [TradeStatus.Accepted]: m.trade_made,
  [TradeStatus.Declined]: m.trade_declined,
  [TradeStatus.Cancelled]: m.trade_taken_back,
};

/** The other end of the trade, named by their profile */
function OtherParty(props: { uid: string }): JSX.Element {
  const game = useGame();
  const profile = from<Profile | null>((set) =>
    watchProfile(props.uid, (record) => {
      set(record);
    }),
  );
  const called = (): string => {
    const nickname = profile()?.nickname ?? '';

    return nickname === '' ? m.trade_unnamed_trainer() : nickname;
  };

  return (
    <PlayerPlate
      name={called()}
      sprite={profile()?.sprite}
      onOpen={() => {
        game.setVisiting(props.uid);
      }}
    />
  );
}

/**
 * The deal in one line, read from whichever end the player holds:
 * what goes out, what comes back, and the gold riding on it
 */
function DealLine(props: { trade: TradeRecord; mine: boolean }): JSX.Element {
  // The sentence, with the two catches left as marks for fillSentence
  const say = ([offered, asked]: string[]): string => {
    const riding = props.trade.gold;

    if (riding > 0) {
      return m.trade_deal_gives({ offered, asked, gold: formatNumber(riding) });
    }
    if (riding < 0) {
      return props.mine
        ? m.trade_deal_asks({ offered, asked, gold: formatNumber(-riding) })
        : m.trade_deal_asks_you({ offered, asked, gold: formatNumber(-riding) });
    }
    return m.trade_deal({ offered, asked });
  };

  return (
    <Meta>
      {fillSentence(say, [
        <NamedCatch id={props.trade.offered} />,
        <Show
          when={props.trade.asked !== '' && props.trade.asked}
          fallback={props.mine ? m.trade_their_pick_short() : m.trade_your_pick()}
        >
          {(asked) => <NamedCatch id={asked()} />}
        </Show>,
      ])}
    </Meta>
  );
}

export default function TradesTab(props: TradesTabProps): JSX.Element {
  const game = useGame();
  const toast = useToast();
  const trades = from<[string, TradeRecord][]>((set) =>
    watchTrades(props.player, (rows) => {
      set(rows);
    }),
  );
  const held = createMemo(() => new Map(trades() ?? []));

  const [busy, setBusy] = createSignal<string | null>(null);
  /** The trade one press away from being agreed to or taken back */
  const [sure, setSure] = createSignal<string | null>(null);
  /** The open ask being answered, while the box is open for it */
  const [answering, setAnswering] = createSignal<string | null>(null);

  const idsOf = (kept: (trade: TradeRecord) => boolean): string[] => {
    const ids: string[] = [];

    for (const [id, trade] of trades() ?? []) {
      if (kept(trade)) {
        ids.push(id);
      }
    }
    return ids;
  };

  const toAnswer = (): string[] =>
    idsOf((trade) => trade.status === TradeStatus.Open && trade.receiver === props.player);
  const waiting = (): string[] =>
    idsOf((trade) => trade.status === TradeStatus.Open && trade.proposer === props.player);
  const settled = createPager(() => {
    const closed: [string, TradeRecord][] = [];

    for (const entry of trades() ?? []) {
      if (entry[1].status !== TradeStatus.Open) {
        closed.push(entry);
      }
    }
    closed.sort(([, one], [, other]) => other.resolvedAt - one.resolvedAt);

    const ids: string[] = [];

    for (const [id] of closed) {
      ids.push(id);
    }
    return ids;
  }, LIST_PAGE);

  const [buddy] = createResource(
    () => (answering() == null ? null : props.player),
    async (uid) => getBuddy(uid),
  );

  /** Why one of the player's own cannot go back with the answer */
  const answerReason = (option: CatchOption): string | null => {
    if (option.fighting) {
      return m.trade_reason_battle();
    }
    if (isEgg(option.caught)) {
      return m.trade_reason_egg();
    }
    if (isFavorite(option.caught)) {
      return m.trade_reason_favorite();
    }
    return buddy.latest === option.id ? m.trade_reason_buddy() : null;
  };

  const settle = (id: string, done: Promise<boolean>, said: string, gained = false): void => {
    setBusy(id);
    setSure(null);
    done
      .then((worked) => {
        if (!worked) {
          toast.push({ message: m.trade_closed(), tone: 'ember' });
          return;
        }
        if (gained) {
          playEffect(Effect.TradeComplete);
        }
        toast.push({ message: said, tone: 'leaf' });
        // Either a pokemon changed hands or one came home from
        // escrow; whatever box is open is showing the old list
        game.touchRecords();
      })
      .catch(() => {
        toast.push({ message: m.trade_failed(), tone: 'ember' });
      })
      .finally(() => {
        setBusy(null);
      });
  };

  /** What the agree button says: an open ask is answered, not taken */
  const acceptLabel = (id: string): string => {
    if (sure() === id) {
      return m.trade_sure();
    }
    return held().get(id)?.asked === '' ? m.trade_answer() : m.trade_accept();
  };

  const accept = (id: string): void => {
    const trade = held().get(id);

    if (trade == null || busy() != null) {
      return;
    }
    // An open ask needs a pokemon named before anything is agreed to
    if (trade.asked === '') {
      setAnswering(id);
      return;
    }
    if (sure() !== id) {
      setSure(id);
      return;
    }
    settle(id, acceptTrade(id, ''), m.trade_done(), true);
  };

  const withdraw = (id: string): void => {
    if (busy() != null) {
      return;
    }
    if (sure() !== id) {
      setSure(id);
      return;
    }
    settle(id, cancelTrade(id), m.trade_withdrawn());
  };

  const row = (id: string, mine: boolean, children: JSX.Element): JSX.Element => (
    <Show when={held().get(id)}>
      {(trade) => (
        <ListRow>
          <div class="flex min-w-0 grow flex-col gap-1">
            <OtherParty uid={mine ? trade().receiver : trade().proposer} />
            <DealLine trade={trade()} mine={mine} />
          </div>
          {children}
        </ListRow>
      )}
    </Show>
  );

  return (
    <>
      <TabGroup horizontal defaultValue={TradesView.Pending} class="flex flex-col gap-3">
        <TabBar>
          <TabButton value={TradesView.Pending}>
            {m.trade_pending()}
            {/* What is waiting on the player's answer, counted on the tab */}
            <Show when={toAnswer().length > 0}>
              <Badge tone="ember" class="ml-1.5">
                {toAnswer().length}
              </Badge>
            </Show>
          </TabButton>
          <TabButton value={TradesView.Settled}>{m.trade_settled()}</TabButton>
        </TabBar>
        <TabPane value={TradesView.Pending}>
          <div class="flex flex-col gap-3">
            <Show when={toAnswer().length > 0} fallback={<Note>{m.trade_nobody_offering()}</Note>}>
              <Note>{m.trade_offered_to_you()}</Note>
              <List>
                <For each={toAnswer()}>
                  {(id) =>
                    row(
                      id,
                      false,
                      <>
                        <Button
                          tone="primary"
                          disabled={busy() != null}
                          onClick={() => {
                            accept(id);
                          }}
                        >
                          {acceptLabel(id)}
                        </Button>
                        <Button
                          tone="danger"
                          disabled={busy() != null}
                          onClick={() => {
                            settle(id, declineTrade(id), m.trade_offer_declined());
                          }}
                        >
                          {m.trade_decline()}
                        </Button>
                      </>,
                    )
                  }
                </For>
              </List>
            </Show>

            <Show when={waiting().length > 0}>
              <Divider />
              <Note>{m.trade_waiting()}</Note>
              <List>
                <For each={waiting()}>
                  {(id) =>
                    row(
                      id,
                      true,
                      <Button
                        disabled={busy() != null}
                        onClick={() => {
                          withdraw(id);
                        }}
                      >
                        {sure() === id ? m.trade_sure() : m.trade_take_back()}
                      </Button>,
                    )
                  }
                </For>
              </List>
            </Show>
          </div>
        </TabPane>
        <TabPane value={TradesView.Settled}>
          <Show when={settled.shown().length > 0} fallback={<Note>{m.trade_none_settled()}</Note>}>
            <List>
              <For each={settled.shown()}>
                {(id) =>
                  row(
                    id,
                    held().get(id)?.proposer === props.player,
                    <Meta>
                      {m.trade_settled_on({
                        word: SETTLED_WORDS[held().get(id)?.status ?? TradeStatus.Open]?.() ?? '',
                        date: formatDate(held().get(id)?.resolvedAt ?? 0),
                      })}
                    </Meta>,
                  )
                }
              </For>
            </List>
            {settled.controls()}
          </Show>
        </TabPane>
      </TabGroup>

      {/* Answering an open ask: the box opens in the panel's place,
          and the pick is the agreement */}
      <CatchPicker
        open={answering() != null}
        onClose={() => {
          setAnswering(null);
        }}
        title={m.trade_answer_with()}
        description={m.trade_answer_description()}
        verb={m.trade_give()}
        confirm
        value={null}
        reason={answerReason}
        onPick={(picked) => {
          const id = answering();

          setAnswering(null);
          if (id != null && picked != null) {
            settle(id, acceptTrade(id, picked), m.trade_done(), true);
          }
        }}
      />
    </>
  );
}
