import type { User } from 'firebase/auth';
import {
  For,
  type JSX,
  Show,
  createEffect,
  createResource,
  createSignal,
  from,
  onCleanup,
} from 'solid-js';
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
import { getSpeciesData } from '../data/species';
import SpriteDisplay from './SpriteDisplay';
import TeamPickerDialog from './TeamPickerDialog';
import matches from '../core/search';
import {
  Badge,
  Button,
  DialogActions,
  List,
  ListRow,
  Note,
  Row,
  SEARCH_FROM,
  Search,
  Status,
} from './styled';
import { useGame } from './game-context';

export interface RaidLobbyProps {
  user: User;
  raidId: string;
  /**
   * What the lobby is called, reported upwards as soon as it is known.
   * The name belongs at the top of the panel the lobby fills, which is
   * the dialog's own heading rather than anything this can draw
   */
  onTitle?: (title: string | null) => void;
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

  // The lair names the panel it is in. It is cleared on the way out so
  // the list of lobbies gets its own name back
  createEffect(() => {
    const record = raid();

    props.onTitle?.(record == null ? null : getRaidTitle(record));
  });

  onCleanup(() => {
    props.onTitle?.(null);
  });

  /**
   * Who is being looked for. A player is searched by the name the row
   * shows them under, which for the player themselves is "You" — they
   * are the one row somebody scrolling a full lobby wants to find
   */
  const [query, setQuery] = createSignal('');

  const joined = (): TeamRecord[] =>
    (teams() ?? []).filter((team) =>
      matches(team.player === props.user.uid ? `You ${team.player}` : team.player, query()),
    );

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
          <div class="flex flex-col gap-3">
            {/* What is waiting in there, pacing. The lair's name is the
                panel's own heading, so the picture says the one thing
                the name cannot */}
            <div class="flex flex-col items-center gap-1 text-center">
              <SpriteDisplay
                species={record().species}
                animation="Idle"
                direction="down"
                scale={4}
                label={`${getSpeciesData(record().species).name}, waiting in the lair`}
              />
              <span class="font-medium">{getSpeciesData(record().species).name}</span>
              <Badge tone={isHost() ? 'leaf' : 'neutral'}>
                {isHost() ? 'You are hosting' : 'Waiting for the host'}
              </Badge>
            </div>

            {/* The relic that opened it is already spent, so there is
                no second attempt to fall back on */}
            <Show when={record().kind === RaidKind.Mythical}>
              <Note class="text-center">
                The relic is spent. Whatever this raid comes to, it comes to it once.
              </Note>
            </Show>

            <Row>
              <h4 class="grow">Teams</h4>
              {/* A full lobby is a list of strangers' ids; finding one
                  in it is worth typing for */}
              <Show when={(teams()?.length ?? 0) > SEARCH_FROM}>
                <Search
                  placeholder="Search players"
                  value={query()}
                  onChange={(typed) => {
                    setQuery(typed);
                  }}
                />
              </Show>
            </Row>

            {/* A lobby can hold thirty parties, so the list scrolls
                rather than growing the panel. The player's own row is
                stuck to the top of it: it is the one row they came to
                look at, and it is the one that scrolls away first */}
            <Show when={teams()?.length} fallback={<Note>No teams have joined yet.</Note>}>
              <Show when={joined().length} fallback={<Note>Nobody here matches.</Note>}>
                <div class="max-h-56 overflow-y-auto">
                  <List>
                    <For each={joined()}>
                      {(team) => (
                        <ListRow
                          selected={team.player === props.user.uid}
                          class={
                            team.player === props.user.uid ? 'sticky top-0 z-10 bg-leaf-soft' : ''
                          }
                        >
                          <span class="grow">
                            {team.player === props.user.uid ? 'You' : team.player}
                          </span>
                          <Badge>{team.catches.length} pokemon</Badge>
                        </ListRow>
                      )}
                    </For>
                  </List>
                </div>
              </Show>
            </Show>

            <Show when={canJoin() === false}>
              <Note class="text-center">
                You need a pokemon of your own to fight — you can only watch this one.
              </Note>
            </Show>

            <Status message={status()} />

            {/* Bring a party, start the fight, or walk out of it */}
            <DialogActions center>
              <Show when={canJoin() !== false}>
                <Button
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
              <Button onClick={back}>Cancel</Button>
            </DialogActions>
          </div>
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
