import type { PlayerIdentity } from '../../auth/user';
import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createResource,
  createSignal,
  from,
  onCleanup,
} from 'solid-js';
import {
  RAID_PLAYER_LIMIT,
  RaidKind,
  type RaidRecord,
  canJoinRaids,
  getRaidTitle,
  inviteToRaid,
  joinRaid,
  leaveRaid,
  startRaid,
  unwatchRaidLobby,
  watchRaid,
  watchRaidLobby,
  watchRaidWatchers,
} from '../../auth/raids';
import { type Profile, getProfiles } from '../../auth/profile';
import PlayerPlate from '../profile/PlayerPlate';
import { type TeamRecord, getTeam } from '../../auth/teams';
import { getSpeciesData } from '../../data/species';
import { RAID_BOSS_LEVEL } from '../../overworld/raid';
import AnimatedSprite from '../sprites/AnimatedSprite';
import LobbyInviteDialog from '../battle/LobbyInviteDialog';
import LobbyParty from '../battle/LobbyParty';
import SpectatorList from '../battle/SpectatorList';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import TypeBadge from '../sprites/TypeBadge';
import matchesTeam, { TEAM_VOCABULARY, type TeamContext, orderTeams } from '../../auth/team-search';
import {
  Badge,
  Button,
  DialogActions,
  DialogSection,
  List,
  ListRow,
  Note,
  Row,
  SEARCH_FROM,
  Search,
  Status,
} from '../styled';
import watchLive from '../app/watch';
import { useGame } from '../app/game-context';
import { SpriteAnim } from '../../data/ids/sprite-anims';

export interface RaidLobbyProps {
  user: PlayerIdentity;
  raidId: string;
  /**
   * What the lobby is called, reported upwards as soon as it is known.
   * The name belongs at the top of the panel the lobby fills, which is
   * the dialog's own heading rather than anything this can draw
   */
  onTitle?: (title: string | null) => void;
}

/**
 * What is in the lobby, which is where the teams, the names and the
 * player's own standing are all read.
 *
 * Any of them read in the body that declared it would throw past
 * every `Suspense` written there and land on the boundary around the
 * whole page, taking the tab down with it
 */
function LobbyRows(
  props: RaidLobbyProps & {
    raid: () => RaidRecord | null;
    teams: Resource<TeamRecord[]>;
    names: Resource<Map<string, Profile>>;
    canJoin: Resource<boolean>;
    watching: () => string[];
  },
): JSX.Element {
  const game = useGame();
  const [picking, setPicking] = createSignal(false);
  const [calling, setCalling] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);

  const raid = (): RaidRecord | null => props.raid();

  const teams = (): TeamRecord[] | undefined => props.teams();

  const canJoin = (): boolean | undefined => props.canJoin();

  const named = (uid: string): string => props.names()?.get(uid)?.nickname ?? uid;
  const faceOf = (uid: string): string | null => props.names()?.get(uid)?.sprite ?? null;

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

  /**
   * Whether this player may call friends in: the host, or anybody
   * with a team. A spectator has no standing to fill somebody else's
   * lobby
   */
  const mayInvite = (): boolean =>
    isHost() || (teams() ?? []).some((team) => team.player === props.user.uid);

  /**
   * Whether the lobby has no place left for this player. Places are
   * distinct players, so somebody already in may still bring another
   * team while everyone outside is turned away
   */
  const full = (): boolean => {
    const players = new Set((teams() ?? []).map((team) => team.player));

    return players.size >= RAID_PLAYER_LIMIT && !players.has(props.user.uid);
  };

  /**
   * Who is in the room with no party in it. A player who forms a team
   * keeps their presence row — they never left — so the fighters are
   * subtracted here rather than by the read
   */
  const onlookers = (): string[] => {
    const fighting = new Set((teams() ?? []).map((team) => team.player));

    return props.watching().filter((uid) => !fighting.has(uid));
  };

  /**
   * What the search knows about a row besides the party in it: what
   * the lobby calls them, and the two rows a player picks out of a
   * crowd, their own and the host's
   */
  const contextOf = (team: TeamRecord): TeamContext => ({
    name: team.player === props.user.uid ? 'You' : named(team.player),
    mine: team.player === props.user.uid,
    host: raid()?.host === team.player,
  });

  const joined = (): TeamRecord[] =>
    orderTeams(
      (teams() ?? []).filter((team) => matchesTeam(team, query(), contextOf(team))),
      query(),
      (team) => ({ team, context: contextOf(team) }),
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
              {/* Wide enough for a wingspan: the row is the width of
                  the panel and the picture is as wide as it happens to
                  be */}
              <div class="-mb-2 flex min-h-28 w-full items-end justify-center pt-2">
                <AnimatedSprite
                  species={record().species}
                  animation={SpriteAnim.Sleep}
                  direction="DownLeft"
                  scale={4}
                  shadow
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
                  vocabulary={TEAM_VOCABULARY}
                  example="is:host"
                  placeholder="Name, or size:6 is:host"
                  value={query()}
                  onChange={(typed) => {
                    setQuery(typed);
                  }}
                />
              </Show>
            </Row>

            {/* A lobby holds up to twenty players' parties, so the
                list scrolls rather than growing the panel. The
                player's own row is stuck to the top of it: it is the
                one row they came to look at, and it is the one that
                scrolls away first */}
            <Show when={teams()?.length} fallback={<Note>No teams have joined yet.</Note>}>
              <Show when={joined().length} fallback={<Note>Nobody here matches.</Note>}>
                <div class="max-h-56 overflow-y-auto">
                  <List>
                    <For each={joined()}>
                      {(team) => (
                        <ListRow
                          selected={team.player === props.user.uid}
                          class={`flex-wrap justify-between ${
                            team.player === props.user.uid ? 'sticky top-0 z-10 bg-leaf-soft' : ''
                          }`}
                        >
                          {/* Anybody but the reader is somebody worth
                              knowing about before the fight starts:
                              what they walk with, what they have
                              fought, what is in their box. Their own
                              row is not a button — a player pressing
                              their own name in a lobby would be
                              opening a read-only copy of the profile
                              the menu already gives them */}
                          <PlayerPlate
                            name={team.player === props.user.uid ? 'You' : named(team.player)}
                            sprite={faceOf(team.player)}
                            onOpen={
                              team.player === props.user.uid
                                ? undefined
                                : () => {
                                    game.setVisiting(team.player);
                                  }
                            }
                          />
                          {/* The party itself, square for square, with
                              the same card the box would put over each */}
                          <LobbyParty catches={team.catches} />
                        </ListRow>
                      )}
                    </For>
                  </List>
                </div>
              </Show>
            </Show>

            {/* Everybody in the room without a party. A player with
                no pokemon of their own can only ever be one of these,
                and a host may stage a raid for other people the same
                way a battle lobby is staged */}
            <DialogSection title="Spectators">
              <SpectatorList player={props.user.uid} watching={onlookers()} />
            </DialogSection>

            <Show when={canJoin() === false}>
              <Note class="text-center">
                You need a pokemon of your own to fight — you can only watch this one.
              </Note>
            </Show>

            <Show when={full()}>
              <Note class="text-center">
                The lobby is full: {RAID_PLAYER_LIMIT} trainers are already in.
              </Note>
            </Show>

            <Status message={status()} />

            {/* Bring a party, start the fight, or walk out of it */}
            <DialogActions>
              <Show when={canJoin() !== false && !full()}>
                <Button
                  onClick={() => {
                    setPicking(true);
                  }}
                >
                  Form a team
                </Button>
              </Show>
              <Show when={mayInvite()}>
                <Button
                  onClick={() => {
                    setCalling(true);
                  }}
                >
                  Invite
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

      <LobbyInviteDialog
        player={props.user.uid}
        isOpen={calling()}
        onClose={() => {
          setCalling(false);
        }}
        title="Invite to the raid"
        description="They see the call above their list of raids, and joining answers it."
        present={(teams() ?? []).map((team) => team.player)}
        onInvite={async (uid, role) => inviteToRaid(props.raidId, uid, role)}
      />

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

/**
 * The lobby with its teams read, which is where the names are asked
 * for: who is in it decides whose profiles have to be looked up, so
 * that read has to be a body below the one holding the teams
 */
function LobbyTeams(
  props: RaidLobbyProps & {
    raid: () => RaidRecord | null;
    teams: Resource<TeamRecord[]>;
    canJoin: Resource<boolean>;
    watching: () => string[];
  },
): JSX.Element {
  /**
   * Who everybody in the lobby is. A party is named by its player's
   * uid in the record, and a uid is not a person: the row is the way
   * into their profile, so it wears the name and the face that
   * profile opens under. Read once for the whole lobby, keyed on who
   * is in it
   */
  const [names] = createResource(
    () => [...new Set((props.teams() ?? []).map((team) => team.player))].sort().join(','),
    async (key): Promise<Map<string, Profile>> => getProfiles(key.split(',').filter(Boolean)),
  );

  return (
    <Suspense fallback={<Note>Loading raid…</Note>}>
      <LobbyRows {...props} names={names} />
    </Suspense>
  );
}

/**
 * One raid lobby, filling the Raids tab: who has joined, a way to
 * bring a party, and — for the host — the button that starts the
 * fight. Going back leaves the lobby, taking the player's teams with
 * them
 */
export default function RaidLobby(props: RaidLobbyProps): JSX.Element {
  // The lobby is shared: parties join and leave it while the player
  // is looking at it, and the host's start lands here too
  const raid = from<RaidRecord | null>((set) =>
    watchRaid(props.raidId, (record) => {
      set(record);
    }),
  );

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

  // Standing here is written down, so the lobby can say who is in the
  // room. It is dropped again on the way out, and the way out is not
  // only the Cancel button: shutting the panel unmounts this, and a
  // row left behind would show them watching a raid they walked away
  // from until the window turned over
  createEffect(() => {
    const lobby = props.raidId;

    watchRaidLobby(lobby).catch(() => {
      // A presence that did not land is a name missing from a list;
      // nothing about the raid turns on it
    });

    onCleanup(() => {
      unwatchRaidLobby(lobby).catch(() => undefined);
    });
  });

  const watching = watchLive<string[]>((set) =>
    watchRaidWatchers(props.raidId, (players) => {
      set(players);
    }),
  );

  return (
    <Suspense fallback={<Note>Loading raid…</Note>}>
      <LobbyTeams
        {...props}
        raid={() => raid() ?? null}
        teams={teams}
        canJoin={canJoin}
        watching={() => watching() ?? []}
      />
    </Suspense>
  );
}
