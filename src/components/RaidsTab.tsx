import type { User } from 'firebase/auth';
import { For, type JSX, Show, createResource, from } from 'solid-js';
import { syncServerClock } from '../auth/clock';
import { RaidKind, type RaidRecord, watchLiveRaids } from '../auth/raids';
import { getSpeciesData } from '../data/species';
import { RAID_INTERVAL } from '../overworld/chunk-snapshot';
import RaidLobby from './RaidLobby';
import { useGame } from './game-context';

export interface RaidsTabProps {
  user: User;
}

/**
 * The lobbies still gathering this hour, and the one the player is
 * standing in. A lobby fills the tab rather than opening over it, so
 * going back is a walk out of the raid and into the list again
 */
export default function RaidsTab(props: RaidsTabProps): JSX.Element {
  const game = useGame();
  // The raid hour comes from the server's clock; the listing then
  // follows every lobby that opens, fills, starts or clears
  const [hour] = createResource(async () => {
    const now = await syncServerClock();

    return Math.floor(now / RAID_INTERVAL) * RAID_INTERVAL;
  });

  const raids = from<[string, RaidRecord][]>((set) => {
    const raidHour = hour();

    if (raidHour == null) {
      return () => undefined;
    }
    return watchLiveRaids(raidHour, (live) => {
      set(live);
    });
  });

  return (
    <section>
      <h2>Raids</h2>
      <Show
        when={game.raid()}
        fallback={
          <>
            <p>Every lobby still gathering in the current hour.</p>

            <Show when={raids()} fallback={<p>Loading raids…</p>}>
              <Show when={raids()?.length} fallback={<p>No raids are gathering right now.</p>}>
                <ul>
                  <For each={raids()}>
                    {([id, raid]) => (
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            game.setRaid(id);
                          }}
                        >
                          {raid.kind === RaidKind.Shadow ? 'Shadow ' : ''}
                          {getSpeciesData(raid.species).name} · chunk {raid.chunk.x}, {raid.chunk.y}{' '}
                          · {raid.teams.length} team
                          {raid.teams.length === 1 ? '' : 's'}
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </Show>
          </>
        }
      >
        {(id) => <RaidLobby user={props.user} raidId={id()} />}
      </Show>
    </section>
  );
}
