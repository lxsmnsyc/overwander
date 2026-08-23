import type { PlayerIdentity } from '../../auth/user';
import { For, type JSX, type Resource, Show, Suspense, createResource, from } from 'solid-js';
import { syncServerClock } from '../../auth/clock';
import { getLocalOffset, toLocalTime } from '../../auth/local-time';
import {
  type RaidInvite,
  type RaidRecord,
  declineRaidInvite,
  getRaid,
  getRaidTitle,
  watchLiveRaids,
  watchRaidInvites,
} from '../../auth/raids';
import { type Profile, watchProfile } from '../../auth/profile';
import { RAID_INTERVAL } from '../../overworld/chunk-snapshot';
import RaidLobby from './RaidLobby';
import watchLive from '../app/watch';
import { Button, List, ListRow, Meta, Note, Panel, RowButton } from '../styled';
import { useGame } from '../app/game-context';

export interface RaidsTabProps {
  user: PlayerIdentity;
  /**
   * What the panel should be called: the lair, while the player is
   * standing in a lobby, and nothing while they are looking at the
   * list of them
   */
  onTitle?: (title: string | null) => void;
}

/**
 * One raid a friend called the player into. The lobby is usually in
 * the live list already; one staged in another zone's window is
 * fetched by name instead, read through `latest` so a row still
 * arriving does not suspend the tab
 */
function InvitedRow(props: {
  invite: RaidInvite;
  known: RaidRecord | undefined;
  onOpen: () => void;
}): JSX.Element {
  const [fetched] = createResource(() => (props.known == null ? props.invite.raid : null), getRaid);
  const raid = (): RaidRecord | null => props.known ?? fetched.latest ?? null;
  const caller = from<Profile | null>((set) =>
    watchProfile(props.invite.sender, (record) => {
      set(record);
    }),
  );
  const named = (): string => {
    const nickname = caller()?.nickname ?? '';

    return nickname === '' ? 'A friend' : nickname;
  };

  return (
    <ListRow>
      <RowButton class="font-medium" onClick={props.onOpen}>
        {raid() == null ? 'A raid' : getRaidTitle(raid()!)}
      </RowButton>
      <Meta class="grow">called in by {named()}</Meta>
      <Button
        onClick={() => {
          declineRaidInvite(props.invite.raid).catch(() => undefined);
        }}
      >
        Dismiss
      </Button>
    </ListRow>
  );
}

/**
 * The lobbies themselves, which is where the window is read.
 *
 * A window read in the body that declared it throws past every
 * `Suspense` written there and lands on the boundary around the whole
 * page, so the read lives one component down
 */
function RaidList(props: RaidsTabProps & { window: Resource<number>; zone: number }): JSX.Element {
  const game = useGame();
  // The listing follows every lobby that opens, fills, starts or
  // clears in the window the tab was opened for
  const raids = watchLive<[string, RaidRecord][]>((set) => {
    const raidWindow = props.window();

    if (raidWindow == null) {
      return null;
    }
    return watchLiveRaids(raidWindow, props.zone, (live) => {
      set(live);
    });
  });
  // What friends have called the player into, shown above the list
  // and only while something is waiting
  const invites = from<RaidInvite[]>((set) =>
    watchRaidInvites(props.user.uid, (waiting) => {
      set(waiting);
    }),
  );
  const knownRaid = (id: string): RaidRecord | undefined =>
    (raids() ?? []).find(([held]) => held === id)?.[1];

  return (
    <Panel>
      <Show
        when={game.raid()}
        fallback={
          <Show when={raids()} fallback={<Note>Loading raids…</Note>}>
            <Show when={(invites() ?? []).length > 0}>
              <Note>Invited</Note>
              <List>
                <For each={(invites() ?? []).map((invite) => invite.raid)}>
                  {(id) => (
                    <Show when={(invites() ?? []).find((invite) => invite.raid === id)}>
                      {(invite) => (
                        <InvitedRow
                          invite={invite()}
                          known={knownRaid(id)}
                          onOpen={() => {
                            game.setRaid(id);
                          }}
                        />
                      )}
                    </Show>
                  )}
                </For>
              </List>
            </Show>
            <Show when={raids()?.length} fallback={<Note>No raids are gathering right now.</Note>}>
              <List>
                <For each={raids()}>
                  {([id, raid]) => (
                    <ListRow>
                      <RowButton
                        class="font-medium"
                        onClick={() => {
                          game.setRaid(id);
                        }}
                      >
                        {getRaidTitle(raid)}
                      </RowButton>
                      <Meta>
                        chunk {raid.chunk.x}, {raid.chunk.y} · {raid.teams.length} team
                        {raid.teams.length === 1 ? '' : 's'}
                      </Meta>
                    </ListRow>
                  )}
                </For>
              </List>
            </Show>
          </Show>
        }
      >
        {(id) => <RaidLobby user={props.user} raidId={id()} onTitle={props.onTitle} />}
      </Show>
    </Panel>
  );
}

/**
 * The lobbies still gathering this window, and the one the player is
 * standing in. A lobby fills the tab rather than opening over it, so
 * going back is a walk out of the raid and into the list again
 */
export default function RaidsTab(props: RaidsTabProps): JSX.Element {
  // The window is the player's own: the instant comes from the server,
  // read in their zone, so a lobby they see is one staged where they
  // are standing in the day
  const zone = getLocalOffset();
  const [window] = createResource(async () => {
    const now = toLocalTime(await syncServerClock(), zone);

    return Math.floor(now / RAID_INTERVAL) * RAID_INTERVAL;
  });

  return (
    <Suspense
      fallback={
        <Panel>
          <Note>Loading raids…</Note>
        </Panel>
      }
    >
      <RaidList user={props.user} onTitle={props.onTitle} window={window} zone={zone} />
    </Suspense>
  );
}
