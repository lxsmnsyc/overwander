import type { User } from 'firebase/auth';
import { For, type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
import { syncServerClock } from '../../auth/clock';
import { getLocalOffset, toLocalTime } from '../../auth/local-time';
import { type RaidRecord, getRaidTitle, watchLiveRaids } from '../../auth/raids';
import { RAID_INTERVAL } from '../../overworld/chunk-snapshot';
import RaidLobby from './RaidLobby';
import watchLive from '../app/watch';
import { List, ListRow, Meta, Note, Panel, RowButton } from '../styled';
import { useGame } from '../app/game-context';

export interface RaidsTabProps {
  user: User;
  /**
   * What the panel should be called: the lair, while the player is
   * standing in a lobby, and nothing while they are looking at the
   * list of them
   */
  onTitle?: (title: string | null) => void;
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

  return (
    <Panel>
      <Show
        when={game.raid()}
        fallback={
          <Show when={raids()} fallback={<Note>Loading raids…</Note>}>
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
