import type { User } from 'firebase/auth';
import { For, type JSX, Show, createEffect, createResource, createSignal } from 'solid-js';
import { RaidKind, getRaid, joinRaid, leaveRaid, startRaid } from '../auth/raids';
import { getTeam } from '../auth/teams';
import { getSpeciesData } from '../data/species';
import TeamPickerDialog from './TeamPickerDialog';
import { useGame } from './game-context';

export interface RaidLobbyProps {
  user: User;
  raidId: string;
}

/**
 * One raid lobby, filling the Raids tab: who has joined, a way to
 * bring a party, and — for the host — the button that starts the
 * fight. Going back leaves the lobby, taking the player's teams with
 * them
 */
export default function RaidLobby(props: RaidLobbyProps): JSX.Element {
  const game = useGame();
  const [raid, { refetch }] = createResource(() => props.raidId, getRaid);
  const [picking, setPicking] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);

  const [teams] = createResource(
    () => raid()?.teams ?? null,
    async (ids) => (await Promise.all(ids.map(getTeam))).filter((team) => team != null),
  );

  const isHost = (): boolean => raid()?.host === props.user.uid;

  const act = (action: () => Promise<string | null>, failure: string): void => {
    setStatus(null);
    action()
      .then(async (result) => {
        setStatus(result == null ? failure : null);
        await refetch();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  // Once the host starts, the battle takes over the whole page for
  // everyone still in the lobby
  createEffect(() => {
    const battle = raid()?.battle;

    if (battle != null) {
      game.setBattle({ id: battle, replay: false, raid: props.raidId });
    }
  });

  const back = (): void => {
    // Leaving takes the player's teams out of the lobby, so a raid
    // they walked away from does not start with their party in it
    leaveRaid(props.user, props.raidId).catch(() => undefined);
    game.setRaid(null);
  };

  return (
    <>
      <Show when={raid()} fallback={<p>Loading raid…</p>}>
        {(record) => (
          <>
            <h3>
              {record().kind === RaidKind.Shadow ? 'Shadow ' : ''}
              {getSpeciesData(record().species).name} Raid
            </h3>
            <p>{isHost() ? 'You are hosting this raid.' : 'Waiting for the host.'}</p>

            <h4>Teams</h4>
            <Show when={teams()?.length} fallback={<p>No teams have joined yet.</p>}>
              <ul>
                <For each={teams()}>
                  {(team) => (
                    <li>
                      {team.player === props.user.uid ? 'You' : team.player} · {team.catches.length}{' '}
                      pokemon
                    </li>
                  )}
                </For>
              </ul>
            </Show>

            <p>
              <button
                type="button"
                onClick={() => {
                  setPicking(true);
                }}
              >
                Form a team
              </button>
              <Show when={isHost()}>
                <button
                  type="button"
                  disabled={record().teams.length === 0}
                  onClick={() => {
                    act(
                      async () => startRaid(props.user, props.raidId),
                      'The raid could not be started.',
                    );
                  }}
                >
                  Start
                </button>
              </Show>
              <button type="button" onClick={back}>
                Go back
              </button>
            </p>

            <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
          </>
        )}
      </Show>

      <TeamPickerDialog
        player={props.user.uid}
        isOpen={picking()}
        onClose={() => {
          setPicking(false);
        }}
        onSubmit={(catches) => {
          setPicking(false);
          act(async () => joinRaid(props.user, props.raidId, catches), 'That team could not join.');
        }}
      />
    </>
  );
}
