import type { User } from 'firebase/auth';
import { For, type JSX, Show, createEffect, createResource, createSignal, from } from 'solid-js';
import {
  RaidKind,
  type RaidRecord,
  canJoinRaids,
  getRaidTitle,
  joinRaid,
  leaveRaid,
  startRaid,
  watchRaid,
} from '../auth/raids';
import { type TeamRecord, getTeam } from '../auth/teams';
import TeamPickerDialog from './TeamPickerDialog';
import { Badge, Button, Card, List, ListRow, Note, Row, Status } from './styled';
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
  // The lobby is shared: parties join and leave it while the player
  // is looking at it, and the host's start lands here too
  const raid = from<RaidRecord | null>((set) =>
    watchRaid(props.raidId, (record) => {
      set(record);
    }),
  );
  const [picking, setPicking] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);

  const [teams] = createResource(
    () => raid()?.teams ?? null,
    async (ids) =>
      (await Promise.all(ids.map(getTeam))).filter((team): team is TeamRecord => team != null),
  );

  // A player with no pokemon of their own can stand in the lobby and
  // watch, but has nothing to field
  const [canJoin] = createResource(
    () => props.user.uid,
    async (uid) => canJoinRaids(uid),
  );

  const isHost = (): boolean => raid()?.host === props.user.uid;

  const act = (action: () => Promise<string | null>, failure: string): void => {
    setStatus(null);
    action()
      // The lobby subscription carries the result back on its own
      .then((result) => {
        setStatus(result == null ? failure : null);
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
    leaveRaid(props.raidId).catch(() => undefined);
    game.setRaid(null);
  };

  return (
    <>
      <Show when={raid()} fallback={<Note>Loading raid…</Note>}>
        {(record) => (
          <Card>
            {/* A lobby is named after the place, not the pokemon:
                the lair is what a player travels to, and what is at
                home in it follows from that */}
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="grow">{getRaidTitle(record())}</h3>
              <Badge tone={isHost() ? 'leaf' : 'neutral'}>
                {isHost() ? 'You are hosting' : 'Waiting for the host'}
              </Badge>
            </div>
            {/* The relic that opened it is already spent, so there is
                no second attempt to fall back on */}
            <Show when={record().kind === RaidKind.Mythical}>
              <Note>The relic is spent. Whatever this raid comes to, it comes to it once.</Note>
            </Show>

            <h4>Teams</h4>
            <Show when={teams()?.length} fallback={<Note>No teams have joined yet.</Note>}>
              <List>
                <For each={teams()}>
                  {(team) => (
                    <ListRow selected={team.player === props.user.uid}>
                      <span class="grow">
                        {team.player === props.user.uid ? 'You' : team.player}
                      </span>
                      <Badge>{team.catches.length} pokemon</Badge>
                    </ListRow>
                  )}
                </For>
              </List>
            </Show>

            <Show when={canJoin() === false}>
              <Note>You need a pokemon of your own to fight — you can only watch this one.</Note>
            </Show>

            <Row>
              <Show when={canJoin() !== false}>
                <Button
                  tone="primary"
                  onClick={() => {
                    setPicking(true);
                  }}
                >
                  Form a team
                </Button>
              </Show>
              <Show when={isHost()}>
                <Button
                  tone="primary"
                  disabled={record().teams.length === 0}
                  onClick={() => {
                    act(async () => startRaid(props.raidId), 'The raid could not be started.');
                  }}
                >
                  Start
                </Button>
              </Show>
              <Button onClick={back}>Go back</Button>
            </Row>

            <Status message={status()} />
          </Card>
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
          act(
            async () => joinRaid(props.raidId, catches),
            // The usual cause is a pokemon that is already fighting
            // or already waiting in another lobby
            'That team could not join — one of them may already be in another raid.',
          );
        }}
      />
    </>
  );
}
