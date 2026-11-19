import { type Accessor, For, Loading, Show, createMemo, createSignal, from } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  FRIEND_LIMIT,
  type FriendLink,
  removeFriend,
  unblockPlayer,
  watchBlocked,
  watchFriends,
} from '../../auth/friends';
import matchesFriend, {
  FRIEND_VOCABULARY,
  type FriendRow,
  orderFriends,
} from '../../model/search/friend';
import { type Profile, getProfiles } from '../../auth/profile';
import {
  Button,
  GroupLabel,
  LIST_PAGE,
  List,
  Note,
  SEARCH_FROM,
  Search,
  Status,
  createPager,
} from '../styled';
import FriendEntry from './FriendEntry';
import { useGame } from '../app/game-context';
import describeFailure from '../../i18n/refusals';
import { m } from '../../i18n/paraglide/messages.js';

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
  /** Open the add-a-friend dialog; the button stands at the pane's top right */
  onAdd: () => void;
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
  const uids: string[] = [];

  for (const row of rows) {
    uids.push(row.uid);
  }
  return uids;
}

/**
 * The friends themselves, searched and paged.
 *
 * The names are read here rather than in the tab that asked for them:
 * a list searched by what people are called cannot be narrowed until
 * it knows, and the row that draws one still follows its own profile,
 * since a rename is what that follow is for
 */
function Roster(props: {
  uids: string[];
  made: Map<string, number>;
  names: Accessor<Map<string, Profile>>;
  query: string;
  busy: string;
  onAct: (uid: string, done: Promise<unknown>) => void;
}): JSX.Element {
  const game = useGame();
  const called = (uid: string): string => props.names().get(uid)?.nickname ?? '';

  const asked = (): string[] => {
    const rows: FriendRow[] = [];

    for (const uid of props.uids) {
      const row = { uid, name: called(uid), since: props.made.get(uid) ?? 0 };

      if (matchesFriend(row, props.query)) {
        rows.push(row);
      }
    }
    return uidsOf(orderFriends(rows, props.query, (row) => row));
  };

  // Paged because every row follows the profile behind it: a hundred
  // friends drawn at once would be a hundred live subscriptions
  const roster = createPager(asked, LIST_PAGE);

  return (
    <Show when={asked().length > 0} fallback={<Note>{m.friends_no_match()}</Note>}>
      <GroupLabel>{m.friends_group()}</GroupLabel>
      <List>
        <For each={roster.shown()}>
          {(uid) => (
            <FriendEntry
              uid={uid}
              since={props.made.get(uid)}
              when={(date) => m.friends_since({ date })}
              onOpen={() => {
                game.setVisiting(uid);
              }}
            >
              <Button
                onClick={() => {
                  game.setTrading(uid);
                }}
              >
                {m.friends_trade()}
              </Button>
              <Button
                tone="ghost-danger"
                disabled={props.busy === uid}
                onClick={() => {
                  props.onAct(uid, removeFriend(uid));
                }}
              >
                {m.ui_remove_action()}
              </Button>
            </FriendEntry>
          )}
        </For>
      </List>
      {roster.controls()}
    </Show>
  );
}

export default function FriendsTab(props: FriendsTabProps): JSX.Element {
  // Both seeded with nothing: the tab draws its empty lists until the
  // first answer rather than waiting on a boundary above it
  const friends = createMemo(() =>
    from<FriendLink[] | undefined>((set) => {
      set(undefined);
      return watchFriends(props.player, (rows) => {
        set(rows);
      });
    }),
  );
  const blocked = createMemo(() =>
    from<FriendLink[] | undefined>((set) => {
      set(undefined);
      return watchBlocked(props.player, (rows) => {
        set(rows);
      });
    }),
  );
  const [busy, setBusy] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [query, setQuery] = createSignal('');
  const made = createMemo(() => {
    const since = new Map<string, number>();

    for (const row of friends() ?? []) {
      since.set(row.uid, row.since);
    }
    return since;
  });
  const blockedAt = createMemo(() => {
    const since = new Map<string, number>();

    for (const row of blocked() ?? []) {
      since.set(row.uid, row.since);
    }
    return since;
  });
  const roll = createMemo(() => uidsOf(friends() ?? []));
  // What everybody is called, in one read rather than a row at a time:
  // the list is searched by name, and a name a row has not fetched yet
  // is a row the search would drop
  const names = createMemo(async () => getProfiles(roll()));
  const shunned = createPager(() => uidsOf(blocked() ?? []), LIST_PAGE);

  const act = (uid: string, done: Promise<unknown>): void => {
    setError(null);
    setBusy(uid);
    done
      .catch((caught: unknown) => {
        setError(describeFailure(caught));
      })
      .finally(() => {
        setBusy('');
      });
  };

  return (
    <>
      {/* The pane's head: finding one of a hundred and how many there
          are on the left, asking for one more on the right */}
      <div class="flex flex-wrap items-center gap-2.5">
        <Show when={roll().length > SEARCH_FROM}>
          <Search
            vocabulary={FRIEND_VOCABULARY}
            example="sort:since"
            placeholder={m.friends_search()}
            value={query()}
            class="w-full sm:w-[300px]"
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Show>
        <Show when={roll().length > 0}>
          <span class="text-xs text-muted">
            {m.friends_count({ count: roll().length, limit: FRIEND_LIMIT })}
          </span>
        </Show>
        <span class="grow" />
        <Button tone="primary" onClick={props.onAdd}>
          {m.friends_tie_add()}
        </Button>
      </div>

      <Show when={roll().length > 0} fallback={<Note>{m.friends_empty()}</Note>}>
        <Loading fallback={<Note>{m.friends_loading()}</Note>}>
          <Roster
            uids={roll()}
            made={made()}
            names={names}
            query={query()}
            busy={busy()}
            onAct={act}
          />
        </Loading>
      </Show>

      <Show when={(blocked() ?? []).length > 0}>
        <GroupLabel title={m.friends_blocked()}>
          {m.friends_blocked_group({ count: (blocked() ?? []).length })}
        </GroupLabel>
        <List>
          <For each={shunned.shown()}>
            {(uid) => (
              <FriendEntry
                uid={uid}
                since={blockedAt().get(uid)}
                when={(date) => m.friends_blocked_on({ date })}
              >
                <Button
                  disabled={busy() === uid}
                  onClick={() => {
                    act(uid, unblockPlayer(uid));
                  }}
                >
                  {m.friends_tie_unblock()}
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
