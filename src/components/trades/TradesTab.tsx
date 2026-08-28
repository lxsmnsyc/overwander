import { For, type JSX, Show, createMemo, createResource, createSignal, from } from 'solid-js';
import { isFavorite } from '../../auth/caught';
import { getBuddy } from '../../auth/buddy';
import { isEgg } from '../../auth/egg';
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
import CatchPicker, { type CatchOption } from '../catches/catch-picker';
import PlayerPlate from '../profile/PlayerPlate';
import NamedCatch from './NamedCatch';
import {
  Button,
  Divider,
  LIST_PAGE,
  List,
  ListRow,
  Meta,
  Note,
  createPager,
  useToast,
} from '../styled';

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

/** What a settled trade came to */
const SETTLED_WORDS: Partial<Record<TradeStatus, string>> = {
  [TradeStatus.Accepted]: 'Made',
  [TradeStatus.Declined]: 'Declined',
  [TradeStatus.Cancelled]: 'Taken back',
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

    return nickname === '' ? 'Unnamed trainer' : nickname;
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
  const gold = (): string => {
    const riding = props.trade.gold;

    if (riding > 0) {
      return ` · ${riding} gold rides with it`;
    }
    return riding < 0 ? ` · asks ${-riding} gold${props.mine ? '' : ' of you'}` : '';
  };

  return (
    <Meta>
      <NamedCatch id={props.trade.offered} /> for{' '}
      <Show
        when={props.trade.asked !== '' && props.trade.asked}
        fallback={props.mine ? 'their pick' : 'your pick'}
      >
        {(asked) => <NamedCatch id={asked()} />}
      </Show>
      {gold()}
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

  const idsOf = (kept: (trade: TradeRecord) => boolean): string[] =>
    (trades() ?? []).filter(([, trade]) => kept(trade)).map(([id]) => id);

  const toAnswer = (): string[] =>
    idsOf((trade) => trade.status === TradeStatus.Open && trade.receiver === props.player);
  const waiting = (): string[] =>
    idsOf((trade) => trade.status === TradeStatus.Open && trade.proposer === props.player);
  const settled = createPager(
    () =>
      (trades() ?? [])
        .filter(([, trade]) => trade.status !== TradeStatus.Open)
        .sort(([, one], [, other]) => other.resolvedAt - one.resolvedAt)
        .map(([id]) => id),
    LIST_PAGE,
  );

  const [buddy] = createResource(
    () => (answering() == null ? null : props.player),
    async (uid) => getBuddy(uid),
  );

  /** Why one of the player's own cannot go back with the answer */
  const answerReason = (option: CatchOption): string | null => {
    if (option.fighting) {
      return 'in a battle';
    }
    if (isEgg(option.caught)) {
      return 'still an egg';
    }
    if (isFavorite(option.caught)) {
      return 'a favorite';
    }
    return buddy.latest === option.id ? 'your buddy' : null;
  };

  const settle = (id: string, done: Promise<boolean>, said: string): void => {
    setBusy(id);
    setSure(null);
    done
      .then((worked) => {
        if (!worked) {
          toast.push({ message: 'That trade is no longer open.', tone: 'ember' });
          return;
        }
        toast.push({ message: said, tone: 'leaf' });
        // Either a pokemon changed hands or one came home from
        // escrow; whatever box is open is showing the old list
        game.touchRecords();
      })
      .catch(() => {
        toast.push({ message: 'That could not be done.', tone: 'ember' });
      })
      .finally(() => {
        setBusy(null);
      });
  };

  /** What the agree button says: an open ask is answered, not taken */
  const acceptLabel = (id: string): string => {
    if (sure() === id) {
      return 'Sure?';
    }
    return held().get(id)?.asked === '' ? 'Answer' : 'Accept';
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
    settle(id, acceptTrade(id, ''), 'Trade made.');
  };

  const withdraw = (id: string): void => {
    if (busy() != null) {
      return;
    }
    if (sure() !== id) {
      setSure(id);
      return;
    }
    settle(id, cancelTrade(id), 'Offer taken back.');
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
    <div class="flex flex-col gap-3">
      <Show
        when={toAnswer().length > 0}
        fallback={<Note>Nobody is offering you anything right now.</Note>}
      >
        <Note>Offered to you.</Note>
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
                      settle(id, declineTrade(id), 'Offer declined.');
                    }}
                  >
                    Decline
                  </Button>
                </>,
              )
            }
          </For>
        </List>
      </Show>

      <Show when={waiting().length > 0}>
        <Divider />
        <Note>Waiting on an answer. The pokemon is held until they give one.</Note>
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
                  {sure() === id ? 'Sure?' : 'Take back'}
                </Button>,
              )
            }
          </For>
        </List>
      </Show>

      <Show when={settled.shown().length > 0}>
        <Divider />
        <Note>Settled.</Note>
        <List>
          <For each={settled.shown()}>
            {(id) =>
              row(
                id,
                held().get(id)?.proposer === props.player,
                <Meta>
                  {SETTLED_WORDS[held().get(id)?.status ?? TradeStatus.Open] ?? ''}
                  {' · '}
                  {new Date(held().get(id)?.resolvedAt ?? 0).toLocaleDateString()}
                </Meta>,
              )
            }
          </For>
        </List>
        {settled.controls()}
      </Show>

      {/* Answering an open ask: the box opens in the panel's place,
          and the pick is the agreement */}
      <CatchPicker
        open={answering() != null}
        onClose={() => {
          setAnswering(null);
        }}
        title="Answer with"
        description="Choose the pokemon to give back. Picking it agrees to the trade."
        verb="Give"
        confirm
        value={null}
        reason={answerReason}
        onPick={(picked) => {
          const id = answering();

          setAnswering(null);
          if (id != null && picked != null) {
            settle(id, acceptTrade(id, picked), 'Trade made.');
          }
        }}
      />
    </div>
  );
}
