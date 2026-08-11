import { For, type JSX, Show, createEffect, createResource, createSignal } from 'solid-js';
import type { User } from 'firebase/auth';
import { getInventory } from '../auth/inventory';
import type { EncounterRecord } from '../auth/encounter-record';
import { feedEncounter, throwBall } from '../auth/safari';
import { BALL_ITEMS, type Balls, type Items } from '../data/ids/items';
import { getItemData } from '../data/items';
import { isShiny } from '../auth/caught-record';
import { getSpeciesData } from '../data/species';
import type SafariSession from '../overworld/safari';
import { FEED_CATCH_BONUS, SafariState, ThrowResult } from '../overworld/safari';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogSection,
  List,
  ListRow,
  Note,
  Row,
  RowButton,
  Status,
} from './styled';

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
  session: SafariSession<EncounterRecord> | null;
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

  const session = (): SafariSession<EncounterRecord> | null => {
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

  /**
   * What is standing there, as the dialog is named after it. A shiny
   * is marked here the way it is marked everywhere else — and there is
   * a name to give even before an encounter has been met, since the
   * dialog is named whether or not one has
   */
  const met = (): string => {
    const active = props.session;

    if (active == null) {
      return 'Encounter';
    }
    const { encounter } = active;

    return `${isShiny(encounter) ? '✦ ' : ''}${getSpeciesData(encounter.species).name} · Lv. ${
      encounter.level
    }`;
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
    <Dialog
      isOpen={props.session != null}
      onClose={leave}
      title={met()}
      description="One encounter, one ball at a time. Feeding it makes it easier to catch and
        every turn gives it another chance to bolt."
    >
      <Show when={session()}>
        {(active) => (
          <>
            {/* The four numbers the next throw turns on, close enough
                together to be weighed against each other */}
            <dl class="rounded-lg border border-line-soft bg-parchment px-3 py-2 text-sm">
              <dt>Catch chance</dt>
              <dd>
                {Math.round(active().getCatchChance() * 100)}%
                {active().isFeatured() ? " · it's their family's day" : ''}
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
              <DialogSection title="Balls">
                <Show when={balls().length} fallback={<Note>No balls to throw.</Note>}>
                  <List>
                    <For each={balls()}>
                      {([ball, amount]) => (
                        <ListRow selected={active().ball === ball}>
                          <RowButton
                            pressed={active().ball === ball}
                            onClick={() => {
                              choose(ball);
                            }}
                          >
                            {describeItem(BALL_ITEMS[ball])}
                          </RowButton>
                          <Badge tone={active().ball === ball ? 'leaf' : 'neutral'}>
                            × {amount}
                          </Badge>
                        </ListRow>
                      )}
                    </For>
                  </List>
                </Show>
              </DialogSection>

              <DialogSection title="Treats">
                <Show when={treats().length} fallback={<Note>Nothing to feed.</Note>}>
                  <List>
                    <For each={treats()}>
                      {([item, amount]) => (
                        <ListRow>
                          <RowButton
                            onClick={() => {
                              feed(item);
                            }}
                          >
                            Feed {describeItem(item)}
                          </RowButton>
                          <Badge>× {amount}</Badge>
                        </ListRow>
                      )}
                    </For>
                  </List>
                </Show>
              </DialogSection>

              <Row>
                <Button tone="primary" onClick={attempt}>
                  Throw {describeItem(BALL_ITEMS[active().ball])}
                </Button>
              </Row>
            </Show>

            <Status message={status()} />
          </>
        )}
      </Show>
      <DialogActions>
        <Button tone={session()?.state === SafariState.Active ? 'danger' : 'ghost'} onClick={leave}>
          {session()?.state === SafariState.Active ? 'Run away' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
