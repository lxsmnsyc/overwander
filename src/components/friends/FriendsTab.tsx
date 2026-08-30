import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createMemo,
  createResource,
  createSignal,
  from,
} from 'solid-js';
import {
  FRIEND_LIMIT,
  type FriendLink,
  removeFriend,
  unblockPlayer,
  watchBlocked,
  watchFriends,
} from '../../auth/friends';
import matchesFriend, { FRIEND_VOCABULARY, orderFriends } from '../../auth/friend-search';
import { type Profile, getProfiles } from '../../auth/profile';
import {
  Button,
  Divider,
  LIST_PAGE,
  List,
  Note,
  Row,
  SEARCH_FROM,
  Search,
  Status,
  createPager,
} from '../styled';
import AddFriendDialog from './AddFriendDialog';
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
  names: Resource<Map<string, Profile>>;
  query: string;
  busy: string;
  onAct: (uid: string, done: Promise<unknown>) => void;
}): JSX.Element {
  const game = useGame();
  const called = (uid: string): string => props.names()?.get(uid)?.nickname ?? '';

  const asked = (): string[] => {
    const rows = props.uids.map((uid) => ({
      uid,
      name: called(uid),
      since: props.made.get(uid) ?? 0,
    }));

    return orderFriends(
      rows.filter((row) => matchesFriend(row, props.query)),
      props.query,
      (row) => row,
    ).map((row) => row.uid);
  };

  // Paged because every row follows the profile behind it: a hundred
  // friends drawn at once would be a hundred live subscriptions
  const roster = createPager(asked, LIST_PAGE);

  return (
    <Show when={asked().length > 0} fallback={<Note>Nobody here matches.</Note>}>
      <List>
        <For each={roster.shown()}>
          {(uid) => (
            <FriendEntry uid={uid} since={props.made.get(uid)} when="Friends since">
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
                disabled={props.busy === uid}
                onClick={() => {
                  props.onAct(uid, removeFriend(uid));
                }}
              >
                Remove
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
  const [query, setQuery] = createSignal('');
  const [adding, setAdding] = createSignal(false);
  const made = createMemo(() => new Map((friends() ?? []).map((row) => [row.uid, row.since])));
  const roll = createMemo(() => uidsOf(friends() ?? []));
  // What everybody is called, in one read rather than a row at a time:
  // the list is searched by name, and a name a row has not fetched yet
  // is a row the search would drop
  const [names] = createResource(roll, getProfiles);
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
      {/* Finding one of a hundred, and asking for one more. The two
          belong together: both are how a list of friends changes */}
      <Row class="flex-nowrap items-center gap-2">
        <Show when={roll().length > SEARCH_FROM}>
          <Search
            vocabulary={FRIEND_VOCABULARY}
            example="sort:since"
            placeholder="Name, or sort:since"
            value={query()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Show>
        <Button
          tone="primary"
          class="shrink-0"
          onClick={() => {
            setAdding(true);
          }}
        >
          Add friend
        </Button>
      </Row>

      <Show
        when={roll().length > 0}
        fallback={<Note>Nobody yet. Add a friend by their code.</Note>}
      >
        <Suspense fallback={<Note>Reading names…</Note>}>
          <Roster
            uids={roll()}
            made={made()}
            names={names}
            query={query()}
            busy={busy()}
            onAct={act}
          />
        </Suspense>
        <Note>
          {roll().length} of {FRIEND_LIMIT}
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
      {/* Somebody to ask, out of everybody playing */}
      <AddFriendDialog
        isOpen={adding()}
        onClose={() => {
          setAdding(false);
        }}
      />
    </>
  );
}
