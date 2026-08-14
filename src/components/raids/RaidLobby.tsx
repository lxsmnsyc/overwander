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
} from '../../auth/raids';
import { getProfile } from '../../auth/profile';
import { type TeamRecord, getTeam } from '../../auth/teams';
import { getSpeciesData } from '../../data/species';
import { RAID_BOSS_LEVEL } from '../../overworld/raid';
import SpriteDisplay from '../sprites/SpriteDisplay';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import TypeBadge from '../sprites/TypeBadge';
import matches from '../../core/search';
import {
  Badge,
  Button,
  DialogActions,
  List,
  ListRow,
  Note,
  Row,
  RowButton,
  SEARCH_FROM,
  Search,
  Status,
} from '../styled';
import { useGame } from '../app/game-context';

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

  /**
   * What everybody in the lobby is called. A party is named by its
   * player's uid in the record, and a uid is not a person: the row is
   * the way into their profile, so it should say the name that profile
   * opens under. Read once for the whole lobby, keyed on who is in it,
   * and falling back to the uid — a lobby of thirty rows all reading
   * "a trainer" tells nobody which is which
   */
  const [names] = createResource(
    () => [...new Set((teams() ?? []).map((team) => team.player))].sort().join(','),
    async (key): Promise<Map<string, string>> => {
      const found = new Map<string, string>();

      await Promise.all(
        key
          .split(',')
          .filter(Boolean)
          .map(async (uid) => {
            const profile = await getProfile(uid);

            if (profile != null) {
              found.set(uid, profile.nickname);
            }
          }),
      );
      return found;
    },
  );

  const named = (uid: string): string => names()?.get(uid) ?? uid;

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

  /**
   * Whether this lobby has ever been seen. It is not a signal: nothing
   * renders from it, and it is only here to tell "not loaded yet" from
   * "gone"
   */
  let arrived = false;

  // A lobby the last party walked out of is deleted, and it can be
  // deleted while this player is standing in it — watching, or waiting
  // for a host who has just left. What is left to look at is nothing,
  // so the panel goes back to the list of lobbies rather than sitting
  // on "Loading raid…" for a raid that no longer exists
  createEffect(() => {
    const record = raid();

    if (record != null) {
      arrived = true;
      return;
    }
    if (arrived) {
      game.setRaid(null);
    }
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
      matches(
        team.player === props.user.uid
          ? `You ${team.player}`
          : `${named(team.player)} ${team.player}`,
        query(),
      ),
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
            {/* What is waiting in there, asleep. The lair's name is
                the panel's own heading, so the picture says the one
                thing the name cannot */}
            <div class="flex flex-col items-center gap-1 text-center">
              {/* Feet on the floor of the box rather than in the
                  middle of one: a tall boss and a short one put their
                  name on the same line that way */}
              {/* Wide enough for a wingspan: the canvas is the width
                  of the panel rather than the width of the sprite, so
                  nothing is clipped off the side of a picture that
                  happens to be wider than it is tall */}
              <div class="-mb-2 flex min-h-28 w-full items-end justify-center pt-2">
                <SpriteDisplay
                  stretch
                  species={record().species}
                  animation="Sleep"
                  direction="DownLeft"
                  scale={4}
                  label={`${getSpeciesData(record().species).name}, waiting in the lair`}
                />
              </div>
              {/* Named the way the lair named it — the level first,
                  because a raid boss is fought at the cap whoever it
                  is, and that is the number a player is sizing their
                  party against */}
              <span class="font-medium">
                Lv. {RAID_BOSS_LEVEL} {getSpeciesData(record().species).name}
              </span>
              {/* And what it fights as, for the same reason the lair
                  says it: the party is picked against these */}
              <div class="flex flex-wrap justify-center gap-1">
                <For each={getSpeciesData(record().species).types}>
                  {(type) => <TypeBadge type={type} />}
                </For>
              </div>
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
                          {/* Anybody but the reader is somebody worth
                              knowing about before the fight starts:
                              what they walk with, what they have
                              fought, what is in their box. Their own
                              row is not a button — a player pressing
                              their own name in a lobby would be
                              opening a read-only copy of the profile
                              the menu already gives them */}
                          <Show
                            when={team.player !== props.user.uid}
                            fallback={<span class="grow">You</span>}
                          >
                            <RowButton
                              onClick={() => {
                                game.setVisiting(team.player);
                              }}
                            >
                              {named(team.player)}
                            </RowButton>
                          </Show>
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
