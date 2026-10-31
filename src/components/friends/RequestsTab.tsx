import { For, type JSX, Show, createMemo, createSignal } from 'solid-js';
import {
  type FriendLink,
  type FriendRequests,
  acceptFriendRequest,
  dropFriendRequest,
} from '../../auth/friends';
import { Button, Divider, LIST_PAGE, List, Note, Status, createPager } from '../styled';
import FriendEntry from './FriendEntry';
import { useGame } from '../app/game-context';
import describeFailure from '../../i18n/refusals';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * What is waiting on an answer, both ways.
 *
 * Outgoing requests are listed under the incoming ones rather than
 * hidden: a player who has asked somebody wants to know they did, and
 * to be able to take it back.
 *
 * The rows are followed by the profile around this, which needs the
 * incoming count for the badge on the tab — one subscription rather
 * than the same query twice
 */
export interface RequestsTabProps {
  waiting: FriendRequests;
}

function uidsOf(rows: FriendLink[]): string[] {
  const uids: string[] = [];

  for (const row of rows) {
    uids.push(row.uid);
  }
  return uids;
}

export default function RequestsTab(props: RequestsTabProps): JSX.Element {
  const game = useGame();
  const [busy, setBusy] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const asked = createMemo(() => {
    const since = new Map<string, FriendLink['since']>();

    for (const row of props.waiting.incoming) {
      since.set(row.uid, row.since);
    }
    for (const row of props.waiting.outgoing) {
      since.set(row.uid, row.since);
    }
    return since;
  });
  const received = createPager(() => uidsOf(props.waiting.incoming), LIST_PAGE);
  const sent = createPager(() => uidsOf(props.waiting.outgoing), LIST_PAGE);

  const answer = (uid: string, said: Promise<unknown>): void => {
    setError(null);
    setBusy(uid);
    said
      .catch((caught: unknown) => {
        setError(describeFailure(caught));
      })
      .finally(() => {
        setBusy('');
      });
  };

  return (
    <>
      <Show
        when={props.waiting.incoming.length > 0}
        fallback={<Note>{m.friends_no_requests()}</Note>}
      >
        <List>
          <For each={received.shown()}>
            {(uid) => (
              <FriendEntry
                uid={uid}
                since={asked().get(uid)}
                when={(date) => m.friends_asked({ date })}
                onOpen={() => {
                  game.setVisiting(uid);
                }}
              >
                <Button
                  tone="primary"
                  disabled={busy() === uid}
                  onClick={() => {
                    answer(uid, acceptFriendRequest(uid));
                  }}
                >
                  {m.friends_accept()}
                </Button>
                <Button
                  disabled={busy() === uid}
                  onClick={() => {
                    answer(uid, dropFriendRequest(uid));
                  }}
                >
                  {m.friends_decline()}
                </Button>
              </FriendEntry>
            )}
          </For>
        </List>
        {received.controls()}
      </Show>

      <Show when={props.waiting.outgoing.length > 0}>
        <Divider />
        <Note>{m.friends_waiting()}</Note>
        <List>
          <For each={sent.shown()}>
            {(uid) => (
              <FriendEntry
                uid={uid}
                since={asked().get(uid)}
                when={(date) => m.friends_asked({ date })}
                onOpen={() => {
                  game.setVisiting(uid);
                }}
              >
                <Button
                  disabled={busy() === uid}
                  onClick={() => {
                    answer(uid, dropFriendRequest(uid));
                  }}
                >
                  {m.battle_cancel()}
                </Button>
              </FriendEntry>
            )}
          </For>
        </List>
        {sent.controls()}
      </Show>
      <Status message={error()} tone="alert" />
    </>
  );
}
