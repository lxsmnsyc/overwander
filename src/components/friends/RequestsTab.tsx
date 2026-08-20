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
  return rows.map((row) => row.uid);
}

export default function RequestsTab(props: RequestsTabProps): JSX.Element {
  const game = useGame();
  const [busy, setBusy] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const asked = createMemo(
    () =>
      new Map(
        [...props.waiting.incoming, ...props.waiting.outgoing].map((row) => [row.uid, row.since]),
      ),
  );
  const received = createPager(() => uidsOf(props.waiting.incoming), LIST_PAGE);
  const sent = createPager(() => uidsOf(props.waiting.outgoing), LIST_PAGE);

  const answer = (uid: string, said: Promise<unknown>): void => {
    setError(null);
    setBusy(uid);
    said
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy('');
      });
  };

  const view = (uid: string): JSX.Element => (
    <Button
      onClick={() => {
        game.setVisiting(uid);
      }}
    >
      View
    </Button>
  );

  return (
    <>
      <Show
        when={props.waiting.incoming.length > 0}
        fallback={<Note>Nobody has asked to be your friend.</Note>}
      >
        <List>
          <For each={received.shown()}>
            {(uid) => (
              <FriendEntry uid={uid} since={asked().get(uid)} when="Asked">
                {view(uid)}
                <Button
                  tone="primary"
                  disabled={busy() === uid}
                  onClick={() => {
                    answer(uid, acceptFriendRequest(uid));
                  }}
                >
                  Accept
                </Button>
                <Button
                  disabled={busy() === uid}
                  onClick={() => {
                    answer(uid, dropFriendRequest(uid));
                  }}
                >
                  Decline
                </Button>
              </FriendEntry>
            )}
          </For>
        </List>
        {received.controls()}
      </Show>

      <Show when={props.waiting.outgoing.length > 0}>
        <Divider />
        <Note>Waiting on an answer</Note>
        <List>
          <For each={sent.shown()}>
            {(uid) => (
              <FriendEntry uid={uid} since={asked().get(uid)} when="Asked">
                {view(uid)}
                <Button
                  disabled={busy() === uid}
                  onClick={() => {
                    answer(uid, dropFriendRequest(uid));
                  }}
                >
                  Cancel
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
