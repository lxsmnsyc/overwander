import { For, type JSX, Show, createMemo, createSignal, from } from 'solid-js';
import {
  FRIEND_LIMIT,
  type FriendLink,
  removeFriend,
  unblockPlayer,
  watchBlocked,
  watchFriends,
} from '../../auth/friends';
import { Button, Divider, LIST_PAGE, List, Note, Status, createPager } from '../styled';
import FriendEntry from './FriendEntry';
import { useGame } from '../app/game-context';

/**
 * Everybody the player has agreed with, and everybody they have shut
 * out.
 *
 * The blocked are here rather than on a page of their own because
 * there is nowhere else to reach them: a blocked trainer's profile is
 * not something a player is likely to open again, and a block that
 * cannot be found cannot be lifted
 */
export interface FriendsTabProps {
  player: string;
}

/**
 * Rows are drawn by uid rather than by the record holding it.
 *
 * A snapshot hands back new objects every time anything in the list
 * changes, and `For` tells its items apart by identity — so a list of
 * records would tear down and rebuild every row, and each row's own
 * follow of the profile behind it, whenever one row moved
 */
function uidsOf(rows: FriendLink[]): string[] {
  return rows.map((row) => row.uid);
}

export default function FriendsTab(props: FriendsTabProps): JSX.Element {
  const game = useGame();
  const friends = from<FriendLink[]>((set) =>
    watchFriends(props.player, (rows) => {
      set(rows);
    }),
  );
  const blocked = from<FriendLink[]>((set) =>
    watchBlocked(props.player, (rows) => {
      set(rows);
    }),
  );
  const [busy, setBusy] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const made = createMemo(() => new Map((friends() ?? []).map((row) => [row.uid, row.since])));
  // Paged because every row follows the profile behind it: a hundred
  // friends drawn at once would be a hundred live subscriptions
  const roster = createPager(() => uidsOf(friends() ?? []), LIST_PAGE);
  const shunned = createPager(() => uidsOf(blocked() ?? []), LIST_PAGE);

  const act = (uid: string, done: Promise<unknown>): void => {
    setError(null);
    setBusy(uid);
    done
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy('');
      });
  };

  return (
    <>
      <Show
        when={(friends() ?? []).length > 0}
        fallback={<Note>Nobody yet. Add a friend from the menu above.</Note>}
      >
        <List>
          <For each={roster.shown()}>
            {(uid) => (
              <FriendEntry uid={uid} since={made().get(uid)} when="Friends since">
                <Button
                  onClick={() => {
                    game.setVisiting(uid);
                  }}
                >
                  View
                </Button>
                <Button
                  onClick={() => {
                    game.setTrading(uid);
                  }}
                >
                  Trade
                </Button>
                <Button
                  tone="danger"
                  disabled={busy() === uid}
                  onClick={() => {
                    act(uid, removeFriend(uid));
                  }}
                >
                  Remove
                </Button>
              </FriendEntry>
            )}
          </For>
        </List>
        {roster.controls()}
        <Note>
          {(friends() ?? []).length} of {FRIEND_LIMIT}
        </Note>
      </Show>

      <Show when={(blocked() ?? []).length > 0}>
        <Divider />
        <Note>Blocked. They cannot ask you, and you cannot ask them.</Note>
        <List>
          <For each={shunned.shown()}>
            {(uid) => (
              <FriendEntry uid={uid}>
                <Button
                  disabled={busy() === uid}
                  onClick={() => {
                    act(uid, unblockPlayer(uid));
                  }}
                >
                  Unblock
                </Button>
              </FriendEntry>
            )}
          </For>
        </List>
        {shunned.controls()}
      </Show>
      <Status message={error()} tone="alert" />
    </>
  );
}
