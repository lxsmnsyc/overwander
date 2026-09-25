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
  onMount,
} from 'solid-js';
import { Disclosure, DisclosureButton, DisclosurePanel } from 'terracotta';
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
import { settled } from '../app/resource-reads';
import PlayerPlate from '../profile/PlayerPlate';
import { type TeamRecord, getTeamBatched } from '../../auth/teams';
import { getSpeciesData } from '../../data/species';
import { TYPE_EFFECTIVENESS, type Types, getTypeFactor } from '../../data/constants/types';
import { ChevronRightIcon } from '../icons';
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
  List,
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
  /**
   * Whether the player is hosting what they are standing in, reported
   * upwards for the panel around it: a host's lobby is not dismissed
   * by a stray press on the overlay
   */
  onHosting?: (hosting: boolean) => void;
}

/** The combined multipliers the boss card lists, strongest first */
const FACTORS: [factor: number, said: string][] = [
  [4, '×4'],
  [2, '×2'],
  [0.5, '×½'],
  [0.25, '×¼'],
  [0, '×0'],
];

/** Every attacking type that does not hit these types for plain damage, by multiplier */
function defenceChart(defending: readonly Types[]): Map<number, Types[]> {
  const chart = new Map<number, Types[]>();

  for (const key of Object.keys(TYPE_EFFECTIVENESS)) {
    const attacking: Types = Number(key);
    const factor = getTypeFactor(attacking, defending);

    if (factor !== 1) {
      const listed = chart.get(factor) ?? [];

      listed.push(attacking);
      chart.set(factor, listed);
    }
  }
  return chart;
}

/** One labelled block of the chart, a line per multiplier */
function ChartRows(props: {
  label: string;
  chart: Map<number, Types[]>;
  factors: number[];
}): JSX.Element {
  const rows = (): [said: string, types: Types[]][] => {
    const found: [string, Types[]][] = [];

    for (const [factor, said] of FACTORS) {
      const types = props.chart.get(factor);

      if (props.factors.includes(factor) && types != null) {
        found.push([said, types]);
      }
    }
    return found;
  };

  return (
    <Show when={rows().length > 0}>
      <div class="grid grid-cols-[4.5rem_2rem_minmax(0,1fr)] items-start gap-x-1 gap-y-1 text-xs">
        <For each={rows()}>
          {([said, types], at) => (
            <>
              <span class="pt-0.5 font-semibold text-muted uppercase">
                {at() === 0 ? props.label : ''}
              </span>
              <span class="pt-0.5 font-bold tabular-nums">{said}</span>
              <span class="flex flex-wrap gap-1">
                <For each={types}>{(type) => <TypeBadge type={type} />}</For>
              </span>
            </>
          )}
        </For>
      </div>
    </Show>
  );
}

/**
 * What is waiting in the lair, asleep, and what to bring against it.
 * The lair's name is the panel's own heading. A row on a phone, a
 * column beside the trainers from `md` up
 */
function BossCard(props: { species: number; mythical: boolean; hosting: boolean }): JSX.Element {
  const [wide, setWide] = createSignal(false);

  onMount(() => {
    const query = globalThis.matchMedia('(min-width: 48rem)');
    const read = (): void => {
      setWide(query.matches);
    };

    read();
    query.addEventListener('change', read);
    onCleanup(() => {
      query.removeEventListener('change', read);
    });
  });

  const data = (): ReturnType<typeof getSpeciesData> => getSpeciesData(props.species);
  const chart = (): Map<number, Types[]> => defenceChart(data().types);

  return (
    <div
      class="flex flex-col gap-3 rounded-panel border-2 border-line-soft p-3 md:min-h-0
        md:overflow-y-auto md:rounded-none md:border-0 md:border-r-2 md:p-0 md:pr-4"
    >
      <div class="flex items-end gap-3 md:flex-col md:items-center md:text-center">
        {/* Feet on the floor of the box, so a tall boss and a short one
            put their name on the same line */}
        <div class="flex min-h-14 shrink-0 items-end justify-center md:-mb-2 md:min-h-28 md:w-full md:pt-2">
          <AnimatedSprite
            species={props.species}
            animation={SpriteAnim.Sleep}
            direction="DownLeft"
            scale={wide() ? 4 : 2}
            shadow
            label={`${data().name}, waiting in the lair`}
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1 md:items-center">
          {/* The level first: a raid boss is fought at the cap whoever
              it is, and that is what a party is sized against */}
          <span class="font-medium">
            Lv. {RAID_BOSS_LEVEL} {data().name}
          </span>
          <div class="flex flex-wrap gap-1 md:justify-center">
            <For each={data().types}>{(type) => <TypeBadge type={type} />}</For>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2 border-t-2 border-line-soft pt-3">
        <ChartRows label="Weak to" chart={chart()} factors={[4, 2]} />
        <ChartRows label="Resists" chart={chart()} factors={[0.5, 0.25]} />
        <ChartRows label="Immune" chart={chart()} factors={[0]} />
      </div>

      <div class="flex flex-col items-center gap-2 border-t-2 border-line-soft pt-3 text-center md:mt-auto">
        {/* The relic that opened it is spent, so there is no second attempt */}
        <Show when={props.mythical}>
          <Note>The relic is spent. Whatever this raid comes to, it comes to it once.</Note>
        </Show>
        <Badge tone={props.hosting ? 'leaf' : 'neutral'}>
          {props.hosting ? 'You are hosting' : 'Waiting for the host'}
        </Badge>
      </div>
    </div>
  );
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

  // Settled rather than read: a team joining re-reads all three, and a
  // plain read put the whole lobby back to "Loading raid…" meanwhile
  const teams = (): TeamRecord[] | undefined => settled(props.teams);

  const canJoin = (): boolean | undefined => settled(props.canJoin);

  const named = (uid: string): string => settled(props.names)?.get(uid)?.nickname ?? uid;
  const faceOf = (uid: string): string | null => settled(props.names)?.get(uid)?.sprite ?? null;

  const isHost = (): boolean => raid()?.host === props.user.uid;

  // The lair names the panel it is in. It is cleared on the way out so
  // the list of lobbies gets its own name back
  createEffect(() => {
    const record = raid();

    props.onTitle?.(record == null ? null : getRaidTitle(record));
  });

  // And whether it is theirs, for the same reason: the panel around
  // this is what the overlay closes. Cleared only on the way out, since
  // clearing it per lobby update flickered the panel's hold on every join
  createEffect(() => {
    props.onHosting?.(isHost());
  });
  onCleanup(() => {
    props.onHosting?.(false);
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
  const mayInvite = (): boolean => {
    if (isHost()) {
      return true;
    }
    for (const team of teams() ?? []) {
      if (team.player === props.user.uid) {
        return true;
      }
    }
    return false;
  };

  /** The player behind each team, one entry per team */
  const teamPlayers = (): string[] => {
    const players: string[] = [];

    for (const team of teams() ?? []) {
      players.push(team.player);
    }
    return players;
  };

  /**
   * Whether the lobby has no place left for this player. Places are
   * distinct players, so somebody already in may still bring another
   * team while everyone outside is turned away
   */
  const full = (): boolean => {
    const players = new Set(teamPlayers());

    return players.size >= RAID_PLAYER_LIMIT && !players.has(props.user.uid);
  };

  /**
   * Who is in the room with no party in it. A player who forms a team
   * keeps their presence row — they never left — so the fighters are
   * subtracted here rather than by the read
   */
  const onlookers = (): string[] => {
    const fighting = new Set(teamPlayers());
    const watching: string[] = [];

    for (const uid of props.watching()) {
      if (!fighting.has(uid)) {
        watching.push(uid);
      }
    }
    return watching;
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

  const joined = (): TeamRecord[] => {
    const matching: TeamRecord[] = [];

    for (const team of teams() ?? []) {
      if (matchesTeam(team, query(), contextOf(team))) {
        matching.push(team);
      }
    }

    const ordered = orderTeams(matching, query(), (team) => ({ team, context: contextOf(team) }));
    // The host heads the lobby whenever they form a party, whichever
    // order the rows arrived in: a guest who was quicker about it is
    // not the person everybody is waiting on
    const host = raid()?.host;
    const first: TeamRecord[] = [];
    const rest: TeamRecord[] = [];

    for (const team of ordered) {
      if (host != null && team.player === host) {
        first.push(team);
      } else {
        rest.push(team);
      }
    }
    return [...first, ...rest];
  };

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

  const joinedPlayers = (): number => new Set(teamPlayers()).size;
  const mine = (): boolean => teamPlayers().includes(props.user.uid);

  /** The one line of advice under the lobby, most pressing first */
  const notice = (): string | null => {
    if (canJoin() === false) {
      return 'You need a pokemon of your own to fight. You can only watch this one.';
    }
    if (full()) {
      return `The lobby is full: ${RAID_PLAYER_LIMIT} trainers are already in.`;
    }
    if (isHost() && (raid()?.teams.length ?? 0) === 0) {
      return 'Start needs at least one team.';
    }
    return null;
  };

  return (
    <>
      <Show when={raid()} fallback={<Note>Loading raid…</Note>}>
        {(record) => (
          <div class="flex flex-col gap-3">
            {/* Boss on the left, trainers on the right. The columns
                share a fixed height so the list scrolls inside its own */}
            <div class="flex flex-col gap-3 md:grid md:h-[min(60vh,30rem)] md:grid-cols-[16rem_minmax(0,1fr)] md:gap-0">
              <BossCard
                species={record().species}
                mythical={record().kind === RaidKind.Mythical}
                hosting={isHost()}
              />

              <div class="flex min-h-0 flex-col gap-2 md:pl-4">
                <Row>
                  <h4 class="grow">
                    Trainers{' '}
                    <span class="text-sm font-normal text-muted tabular-nums">
                      {joinedPlayers()} / {RAID_PLAYER_LIMIT}
                    </span>
                  </h4>
                  {/* A full lobby is a list of strangers; finding one is worth typing for */}
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

                {/* The player's own row is stuck to the top: it is the one
                    they came to look at, and the first to scroll away */}
                <Show when={teams()?.length} fallback={<Note>No teams have joined yet.</Note>}>
                  <Show when={joined().length} fallback={<Note>Nobody here matches.</Note>}>
                    <div class="max-h-72 min-h-0 overflow-y-auto md:max-h-none md:flex-1">
                      <List>
                        <For each={joined()}>
                          {(team) => (
                            // The plate wears the frame so the party strip has the rest of the row
                            <li
                              class={`flex flex-col gap-2 sm:flex-row sm:items-center ${
                                team.player === props.user.uid
                                  ? 'sticky top-0 z-10 rounded-xl bg-paper'
                                  : ''
                              }`}
                            >
                              {/* Anybody but the reader opens their profile */}
                              <span
                                class={`flex w-full shrink-0 items-center gap-2 rounded-xl border-2
                                  px-2 py-2 text-sm shadow-pop-sm sm:w-44 ${
                                    team.player === props.user.uid
                                      ? 'border-leaf bg-leaf-soft'
                                      : 'border-line bg-paper'
                                  }`}
                              >
                                <span class="min-w-0 grow">
                                  <PlayerPlate
                                    name={
                                      team.player === props.user.uid ? 'You' : named(team.player)
                                    }
                                    sprite={faceOf(team.player)}
                                    onOpen={
                                      team.player === props.user.uid
                                        ? undefined
                                        : () => {
                                            game.setVisiting(team.player);
                                          }
                                    }
                                  />
                                </span>
                                <Show when={team.player === record().host}>
                                  <Badge tone="tide">Host</Badge>
                                </Show>
                              </span>
                              <LobbyParty catches={team.catches} class="min-w-0 grow" />
                            </li>
                          )}
                        </For>
                      </List>
                    </div>
                  </Show>
                </Show>

                {/* Everybody in the room without a party, closed until asked for */}
                <Disclosure
                  defaultOpen={false}
                  class="flex flex-col border-t-2 border-line-soft pt-2"
                >
                  <DisclosureButton
                    class="group flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0
                      text-left text-sm font-bold text-ink shadow-none focus-visible:outline-2
                      focus-visible:outline-offset-2 focus-visible:outline-tide"
                  >
                    <ChevronRightIcon
                      aria-hidden="true"
                      class="size-4 shrink-0 text-muted transition-transform group-aria-expanded:rotate-90"
                    />
                    Watching · {onlookers().length}
                  </DisclosureButton>
                  <DisclosurePanel class="max-h-48 overflow-y-auto pt-2">
                    <SpectatorList player={props.user.uid} watching={onlookers()} />
                  </DisclosurePanel>
                </Disclosure>
              </div>
            </div>

            <Show
              when={status()}
              fallback={
                <Show when={notice()}>{(said) => <Note class="text-center">{said()}</Note>}</Show>
              }
            >
              <Status message={status()} />
            </Show>

            <DialogActions>
              <Show when={mayInvite()}>
                <Button
                  onClick={() => {
                    setCalling(true);
                  }}
                >
                  Invite
                </Button>
              </Show>
              <Show when={canJoin() !== false && !full()}>
                <Button
                  onClick={() => {
                    setPicking(true);
                  }}
                >
                  {mine() ? 'Change team' : 'Form a team'}
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
              <Button onClick={back}>Leave</Button>
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
        present={teamPlayers()}
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

/** The uids packed into a resource key, without the empty one an empty lobby leaves */
function splitKey(key: string): string[] {
  const uids: string[] = [];

  for (const uid of key.split(',')) {
    if (uid !== '') {
      uids.push(uid);
    }
  }
  return uids;
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
    () => {
      const players = new Set<string>();

      for (const team of settled(props.teams) ?? []) {
        players.add(team.player);
      }
      return [...players].sort().join(',');
    },
    async (key): Promise<Map<string, Profile>> => getProfiles(splitKey(key)),
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

  // A team is written once and never changed, so one already read is
  // kept by its id: a join reads the team that joined and nothing else,
  // and the rows of the teams already there are not built again
  const known = new Map<string, TeamRecord>();
  const readTeam = async (id: string): Promise<TeamRecord | null> => {
    const team = known.get(id) ?? (await getTeamBatched(id));

    if (team != null) {
      known.set(id, team);
    }
    return team;
  };

  // Keyed on the ids, since every lobby ping hands over a fresh array of
  // the same ones
  const [teams] = createResource(
    () => raid()?.teams.join(',') ?? null,
    async (key): Promise<TeamRecord[]> => {
      const reads: Promise<TeamRecord | null>[] = [];

      // One read for every team not held yet, rather than one per team
      for (const id of splitKey(key)) {
        reads.push(readTeam(id));
      }

      const found: TeamRecord[] = [];

      for (const team of await Promise.all(reads)) {
        if (team != null) {
          found.push(team);
        }
      }
      return found;
    },
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
