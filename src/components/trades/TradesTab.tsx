import { For, Show, createMemo, createResource, createSignal, from } from 'solid-js';
import type { JSX } from '@solidjs/web';
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
import { PlayerFace } from '../profile/PlayerPlate';
import NamedCatch, { fillSentence } from './NamedCatch';
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
  Segmented,
  createPager,
  useToast,
} from '../styled';
import { formatDate, formatNumber, formatRelative } from '../../i18n/format';
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

/** How a settled trade reads in its pill */
const SETTLED_TONES: Partial<Record<TradeStatus, PillTone>> = {
  [TradeStatus.Accepted]: 'leaf',
  [TradeStatus.Declined]: 'ember',
  [TradeStatus.Cancelled]: 'neutral',
};

/**
 * The other end of the trade as a face and a name, over the deal in
 * one line: pressing either opens their profile
 */
function OtherParty(props: { uid: string; line: JSX.Element }): JSX.Element {
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
    <button
      type="button"
      class="flex min-w-0 grow basis-48 cursor-pointer items-center gap-2.5 rounded-lg border-0
        bg-transparent p-0 text-left shadow-none transition-colors hover:text-tide-dark
        active:translate-y-0"
      onClick={() => {
        game.setVisiting(props.uid);
      }}
    >
      <PlayerFace sprite={profile()?.sprite} size={40} />
      <RowText name={called()} line={props.line} />
    </button>
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
    <>
      {fillSentence(say, [
        <NamedCatch id={props.trade.offered} />,
        <Show
          when={props.trade.asked !== '' && props.trade.asked}
          fallback={props.mine ? m.trade_their_pick_short() : m.trade_your_pick()}
        >
          {(asked) => <NamedCatch id={asked()} />}
        </Show>,
      ])}
    </>
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

  const [view, setView] = createSignal(TradesView.Pending);
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

  /** One trade as a row card: who, the deal, then what the row says or offers */
  const row = (
    id: string,
    mine: boolean,
    children: JSX.Element,
    tone?: 'plain' | 'quiet',
  ): JSX.Element => (
    <Show when={held().get(id)}>
      {(trade) => (
        <RowCard tone={tone}>
          <OtherParty
            uid={mine ? trade().receiver : trade().proposer}
            line={<DealLine trade={trade()} mine={mine} />}
          />
          {children}
        </RowCard>
      )}
    </Show>
  );

  return (
    <>
      <div class="flex items-center gap-2.5">
        <Segmented
          label={m.profile_section_trades()}
          value={view()}
          options={[
            // What is waiting on the player's answer, counted on the key
            {
              value: TradesView.Pending,
              label: m.trade_pending(),
              count: toAnswer().length > 0 ? toAnswer().length : undefined,
              hot: true,
            },
            { value: TradesView.Settled, label: m.trade_settled() },
          ]}
          onChange={(value) => {
            setView(value);
          }}
        />
      </div>

      <Show when={view() === TradesView.Pending}>
        <Show when={toAnswer().length > 0} fallback={<Note>{m.trade_nobody_offering()}</Note>}>
          <GroupLabel>{m.trade_offered_to_you()}</GroupLabel>
          <List>
            <For each={toAnswer()}>
              {(id) =>
                row(
                  id,
                  false,
                  <RowActions>
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
                      tone="ghost-danger"
                      disabled={busy() != null}
                      onClick={() => {
                        settle(id, declineTrade(id), m.trade_offer_declined());
                      }}
                    >
                      {m.trade_decline()}
                    </Button>
                  </RowActions>,
                )
              }
            </For>
          </List>
        </Show>

        <Show when={waiting().length > 0}>
          <GroupLabel title={m.trade_waiting_note()}>{m.trade_waiting()}</GroupLabel>
          <List>
            <For each={waiting()}>
              {(id) =>
                row(
                  id,
                  true,
                  <RowActions>
                    <Button
                      disabled={busy() != null}
                      onClick={() => {
                        withdraw(id);
                      }}
                    >
                      {sure() === id ? m.trade_sure() : m.trade_take_back()}
                    </Button>
                  </RowActions>,
                )
              }
            </For>
          </List>
        </Show>
      </Show>

      <Show when={view() === TradesView.Settled}>
        <Show when={settled.shown().length > 0} fallback={<Note>{m.trade_none_settled()}</Note>}>
          <List>
            <For each={settled.shown()}>
              {(id) =>
                row(
                  id,
                  held().get(id)?.proposer === props.player,
                  <>
                    <Pill tone={SETTLED_TONES[held().get(id)?.status ?? TradeStatus.Open]}>
                      {SETTLED_WORDS[held().get(id)?.status ?? TradeStatus.Open]?.() ?? ''}
                    </Pill>
                    <Meta title={formatDate(held().get(id)?.resolvedAt ?? 0)}>
                      {formatRelative(held().get(id)?.resolvedAt ?? 0)}
                    </Meta>
                  </>,
                  'quiet',
                )
              }
            </For>
          </List>
          {settled.controls()}
        </Show>
      </Show>

      {/* Answering an open ask: the box opens in the panel's place,
          and the pick is the agreement */}
      <CatchPicker
        fill
        open={answering() != null}
        onClose={() => {
          setAnswering(null);
        }}
        width="rail"
        dock
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
