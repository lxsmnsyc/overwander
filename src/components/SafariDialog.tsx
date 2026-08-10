import { For, type JSX, Show, createEffect, createResource, createSignal } from 'solid-js';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from 'terracotta';
import type { User } from 'firebase/auth';
import { getInventory } from '../auth/inventory';
import { feedEncounter, throwBall } from '../auth/safari';
import { BALL_ITEMS, type Balls, type Items } from '../data/ids/items';
import { getItemData } from '../data/items';
import { getSpeciesData } from '../data/species';
import type SafariSession from '../overworld/safari';
import { FEED_CATCH_BONUS, SafariState, ThrowResult } from '../overworld/safari';

/**
 * The ball a carried item stands for, so the bag can be filtered
 * down to what is throwable
 */
const BALLS_BY_ITEM = new Map<Items, Balls>(
  Object.entries(BALL_ITEMS).map(([ball, item]) => [item, Number(ball)]),
);

function describeItem(item: Items): string {
  try {
    return getItemData(item).name;
  } catch {
    return `Item #${item}`;
  }
}

const THROW_MESSAGES: Record<ThrowResult, string> = {
  [ThrowResult.Caught]: 'Caught!',
  [ThrowResult.BrokeFree]: 'It broke free.',
  [ThrowResult.Fled]: 'It fled.',
};

const STATE_MESSAGES: Record<SafariState, string> = {
  [SafariState.Active]: '',
  [SafariState.Caught]: 'Caught — it is yours.',
  [SafariState.Fled]: 'It fled; this one will not show up again.',
  [SafariState.Exited]: 'You walked away.',
};

export interface SafariDialogProps {
  user: User;
  /**
   * The open session, or null when no encounter is being met
   */
  session: SafariSession | null;
  onClose: () => void;
}

/**
 * One safari encounter: choose a ball, feed it, throw. Every action
 * goes through the persistence layer, so the bag and the catch
 * records move with the session
 */
export default function SafariDialog(props: SafariDialogProps): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  // Read once per opened session: throwing and feeding both spend
  // from the bag, so it is refetched after each action
  const [bag, { refetch }] = createResource(
    () => (props.session == null ? null : props.user.uid),
    getInventory,
  );
  // The session mutates in place, so the view needs a nudge after
  // every action to re-read its state, turn count and bonus
  const [revision, setRevision] = createSignal(0);

  const session = (): SafariSession | null => {
    revision();
    return props.session;
  };

  // The session tracks the bag only through the persistence layer,
  // so the view keeps its count in step — that is what makes the
  // last-ball pity visible before the throw
  createEffect(() => {
    const active = props.session;
    const carried = bag();

    if (active != null && carried != null) {
      active.ballsLeft = carried
        .filter((entry) => BALLS_BY_ITEM.has(entry.item))
        .reduce((total, entry) => total + entry.amount, 0);
      setRevision((value) => value + 1);
    }
  });

  const balls = (): [Balls, number][] =>
    (bag() ?? [])
      .map((entry): [Balls | undefined, number] => [BALLS_BY_ITEM.get(entry.item), entry.amount])
      .filter((pair): pair is [Balls, number] => pair[0] != null);

  const treats = (): [Items, number][] =>
    (bag() ?? [])
      .filter((entry) => FEED_CATCH_BONUS[entry.item] != null)
      .map((entry) => [entry.item, entry.amount]);

  const settle = async (message: string | null): Promise<void> => {
    setStatus(message);
    setRevision((value) => value + 1);
    await refetch();
  };

  const act = (action: () => Promise<string | null>): void => {
    action()
      .then(settle)
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const choose = (ball: Balls): void => {
    props.session?.chooseBall(ball);
    setRevision((value) => value + 1);
  };

  const feed = (item: Items): void => {
    act(async () => {
      const active = props.session;

      if (active == null) {
        return null;
      }
      return (await feedEncounter(props.user, active, item))
        ? `Fed ${describeItem(item)}.`
        : `Could not feed ${describeItem(item)}.`;
    });
  };

  const attempt = (): void => {
    act(async () => {
      const active = props.session;

      if (active == null) {
        return null;
      }

      const result = await throwBall(props.user, active);

      return result == null ? 'No ball of that kind to throw.' : THROW_MESSAGES[result];
    });
  };

  const leave = (): void => {
    const active = props.session;

    if (active != null && active.state === SafariState.Active) {
      active.runAway();
    }
    setStatus(null);
    props.onClose();
  };

  return (
    <Dialog isOpen={props.session != null} onClose={leave}>
      <DialogOverlay style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.4)' }} />
      <DialogPanel
        style={{
          position: 'fixed',
          inset: '10% 50% auto auto',
          transform: 'translateX(50%)',
          'max-height': '80vh',
          'overflow-y': 'auto',
          background: '#fff',
          padding: '1rem 2rem',
          'border-radius': '0.5rem',
          'text-align': 'left',
        }}
      >
        <Show when={session()}>
          {(active) => (
            <>
              <DialogTitle>
                {active().encounter.shiny ? '✦ ' : ''}
                {getSpeciesData(active().encounter.species).name} · Lv. {active().encounter.level}
              </DialogTitle>
              <dl>
                <dt>Catch chance</dt>
                <dd>
                  {Math.round(active().getCatchChance() * 100)}%
                  {active().isPityThrow() ? ' · last ball, it cannot miss' : ''}
                </dd>
                <dt>Flee chance</dt>
                <dd>{Math.round(active().getFleeChance() * 100)}%</dd>
                <dt>Feeding bonus</dt>
                <dd>×{active().catchBonus.toFixed(2)}</dd>
                <dt>Turn</dt>
                <dd>{active().turn}</dd>
              </dl>

              <Show
                when={active().state === SafariState.Active}
                fallback={<p role="status">{STATE_MESSAGES[active().state]}</p>}
              >
                <h3>Balls</h3>
                <Show when={balls().length} fallback={<p>No balls to throw.</p>}>
                  <ul>
                    <For each={balls()}>
                      {([ball, amount]) => (
                        <li>
                          <button
                            type="button"
                            aria-pressed={active().ball === ball}
                            onClick={() => {
                              choose(ball);
                            }}
                          >
                            {describeItem(BALL_ITEMS[ball])} × {amount}
                            {active().ball === ball ? ' (selected)' : ''}
                          </button>
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>

                <h3>Treats</h3>
                <Show when={treats().length} fallback={<p>Nothing to feed.</p>}>
                  <ul>
                    <For each={treats()}>
                      {([item, amount]) => (
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              feed(item);
                            }}
                          >
                            Feed {describeItem(item)} × {amount}
                          </button>
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>

                <p>
                  <button type="button" onClick={attempt}>
                    Throw {describeItem(BALL_ITEMS[active().ball])}
                  </button>
                </p>
              </Show>

              <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
            </>
          )}
        </Show>
        <button type="button" onClick={leave}>
          {session()?.state === SafariState.Active ? 'Run away' : 'Close'}
        </button>
      </DialogPanel>
    </Dialog>
  );
}
