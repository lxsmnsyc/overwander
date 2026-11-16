import { isFemaleBoss } from '../../../model/raid-record';
import {
  For,
  type JSX,
  type Resource,
  Show,
  createEffect,
  createSignal,
  onCleanup,
} from 'solid-js';
import { Disclosure, DisclosureButton, DisclosurePanel } from 'terracotta';
import {
  RAID_PLAYER_LIMIT,
  RaidKind,
  type RaidRecord,
  getRaidTitle,
  inviteToRaid,
  joinRaid,
  leaveRaid,
  startRaid,
} from '../../../auth/raids';
import type { Profile } from '../../../auth/profile';
import { settled } from '../../app/resource-reads';
import PlayerPlate from '../../profile/PlayerPlate';
import type { TeamRecord } from '../../../auth/teams';
import { ChevronRightIcon } from '../../icons';
import { getTeraRaidType } from '../../../data/overworld/tera-raids';
import LobbyInviteDialog from '../../battle/LobbyInviteDialog';
import LobbyParty from '../../battle/LobbyParty';
import SpectatorList from '../../battle/SpectatorList';
import { openForm } from '../../forms/stack';
import { PickTeamForm } from '../../forms/pick-team';
import matchesTeam, {
  TEAM_VOCABULARY,
  type TeamContext,
  orderTeams,
} from '../../../model/search/team';
import {
  Button,
  DialogActions,
  List,
  Note,
  Pill,
  RowCard,
  SEARCH_FROM,
  Search,
  Status,
} from '../../styled';
import { useGame } from '../../app/game-context';
import describeFailure from '../../../i18n/refusals';
import { m } from '../../../i18n/paraglide/messages.js';
import BossCard from './boss-card';
import type { RaidLobbyProps } from './report';

/**
 * What is in the lobby, which is where the teams, the names and the
 * player's own standing are all read.
 *
 * Any of them read in the body that declared it would throw past
 * every `Suspense` written there and land on the boundary around the
 * whole page, taking the tab down with it
 */
export default function LobbyRows(
  props: RaidLobbyProps & {
    raid: () => RaidRecord | null;
    teams: Resource<TeamRecord[]>;
    names: Resource<Map<string, Profile>>;
    canJoin: Resource<boolean>;
    watching: () => string[];
  },
): JSX.Element {
  const game = useGame();
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

  // The lair names the panel it is in, and whether it is theirs decides
  // whether the overlay may close it. Cleared on the way out so the
  // list of lobbies gets its own name back
  createEffect(() => {
    const record = raid();

    props.onLobby?.(record == null ? null : { title: getRaidTitle(record), hosting: isHost() });
  });
  onCleanup(() => {
    props.onLobby?.(null);
  });

  /**
   * Whether this lobby has ever been seen. It is not a signal: nothing
   * renders from it, and it is only here to tell "not loaded yet" from
   * "gone"
   */
  let arrived = false;

  // A lobby the last party walked out of is deleted, and it can be
  // deleted while this player is standing in it (watching, or waiting
  // for a host who has just left). What is left to look at is nothing,
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

  /**
   * Who is being looked for. A player is searched by the name the row
   * shows them under, which for the player themselves is "You": they
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
   * keeps their presence row (they never left) so the fighters are
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
    name: team.player === props.user.uid ? m.battle_you() : named(team.player),
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
    // The reader's own row heads the lobby, then the host's: a guest
    // who was quicker about it is not the person everybody is waiting
    // on, and the row a player came to look at is the first they see
    const host = raid()?.host;
    const own: TeamRecord[] = [];
    const first: TeamRecord[] = [];
    const rest: TeamRecord[] = [];

    for (const team of ordered) {
      if (team.player === props.user.uid) {
        own.push(team);
      } else if (host != null && team.player === host) {
        first.push(team);
      } else {
        rest.push(team);
      }
    }
    return [...own, ...first, ...rest];
  };

  const act = (action: () => Promise<string | null>, failure: string): void => {
    setStatus(null);
    action()
      // The lobby subscription carries the result back on its own
      .then((result) => {
        setStatus(result == null ? failure : null);
      })
      .catch((caught: unknown) => {
        setStatus(describeFailure(caught));
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
      return m.raid_notice_watch_only();
    }
    if (full()) {
      return m.raid_notice_full({ max: RAID_PLAYER_LIMIT });
    }
    if (isHost() && (raid()?.teams.length ?? 0) === 0) {
      return m.raid_notice_start();
    }
    return null;
  };

  return (
    <>
      <Show when={raid()} fallback={<Note>{m.raid_loading_one()}</Note>}>
        {(record) => (
          <div class="flex flex-col gap-3">
            {/* Boss on the left, trainers on the right. The columns
                share a fixed height so the list scrolls inside its own */}
            <div class="flex flex-col gap-3 md:grid md:h-[min(60vh,30rem)] md:grid-cols-[270px_minmax(0,1fr)] md:gap-0">
              <BossCard
                species={record().species}
                female={isFemaleBoss(record().species, record().traitValue)}
                mythical={record().kind === RaidKind.Mythical}
                hosting={isHost()}
                tera={
                  record().kind === RaidKind.Tera
                    ? getTeraRaidType(record().species, props.raidId)
                    : null
                }
              />

              <div class="flex min-h-0 flex-col gap-2.5 md:py-3 md:pl-[18px]">
                <div class="flex flex-wrap items-center gap-2.5">
                  <h3 class="m-0 text-lg">{m.raid_trainers()}</h3>
                  <span class="font-display text-xs text-muted tabular-nums">
                    {joinedPlayers()} / {RAID_PLAYER_LIMIT}
                  </span>
                  <span class="grow" />
                  {/* A full lobby is a list of strangers; finding one is worth typing for */}
                  <Show when={(teams()?.length ?? 0) > SEARCH_FROM}>
                    <Search
                      vocabulary={TEAM_VOCABULARY}
                      example="is:host"
                      placeholder={m.raid_search_placeholder()}
                      value={query()}
                      class="w-full sm:w-[220px]"
                      onChange={(typed) => {
                        setQuery(typed);
                      }}
                    />
                  </Show>
                </div>

                {/* The player's own row heads the list and is lit */}
                <Show when={teams()?.length} fallback={<Note>{m.raid_no_teams()}</Note>}>
                  <Show when={joined().length} fallback={<Note>{m.raid_no_match()}</Note>}>
                    <div class="max-h-72 min-h-0 overflow-y-auto md:max-h-none md:flex-1">
                      <List>
                        <For each={joined()}>
                          {(team) => (
                            <RowCard
                              tone={team.player === props.user.uid ? 'leaf' : 'plain'}
                              class="min-h-[60px] gap-x-2.5 px-2.5"
                            >
                              {/* The plate wears the frame so the party strip has the rest of the row.
                                  Anybody but the reader opens their profile */}
                              <span
                                class={`flex w-full shrink-0 items-center gap-2 rounded-xl border-2
                                  px-2 py-1.5 text-sm sm:w-[190px] ${
                                    team.player === props.user.uid
                                      ? 'border-leaf bg-leaf-soft'
                                      : 'border-line bg-paper'
                                  }`}
                              >
                                <span class="min-w-0 grow">
                                  <PlayerPlate
                                    name={
                                      team.player === props.user.uid
                                        ? m.battle_you()
                                        : named(team.player)
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
                                  <Pill tone="tide">{m.duels_host_tag()}</Pill>
                                </Show>
                              </span>
                              <LobbyParty catches={team.catches} class="min-w-0 grow" />
                            </RowCard>
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
                      text-left text-[13px] font-extrabold text-ink shadow-none focus-visible:outline-2
                      focus-visible:outline-offset-2 focus-visible:outline-tide"
                  >
                    <ChevronRightIcon
                      aria-hidden="true"
                      class="size-4 shrink-0 text-muted transition-transform group-aria-expanded:rotate-90"
                    />
                    {m.duels_watching({ count: onlookers().length })}
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
                <Show when={notice()}>
                  {(said) => <Note class="text-center text-xs">{said()}</Note>}
                </Show>
              }
            >
              <Status message={status()} />
            </Show>

            <DialogActions stack>
              <Show when={mayInvite()}>
                <Button
                  onClick={() => {
                    setCalling(true);
                  }}
                >
                  {m.lobby_invite()}
                </Button>
              </Show>
              <Show when={canJoin() !== false && !full()}>
                <Button
                  onClick={() => {
                    openForm(PickTeamForm, { player: props.user.uid })
                      .then((catches) => {
                        if (catches != null) {
                          act(
                            async () => joinRaid(props.raidId, catches),
                            // The usual cause is a pokemon already fighting or waiting elsewhere
                            m.raid_join_failed(),
                          );
                        }
                      })
                      .catch(() => undefined);
                  }}
                >
                  {mine() ? m.raid_change_team() : m.raid_form_team()}
                </Button>
              </Show>
              <Show when={isHost()}>
                <Button
                  tone="primary"
                  disabled={record().teams.length === 0}
                  onClick={() => {
                    act(async () => startRaid(props.raidId), m.raid_start_failed());
                  }}
                >
                  {m.duels_start()}
                </Button>
              </Show>
              <Button onClick={back}>{m.duels_leave()}</Button>
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
        title={m.raid_invite_title()}
        description={m.raid_invite_description()}
        present={teamPlayers()}
        onInvite={async (uid, role) => inviteToRaid(props.raidId, uid, role)}
      />
    </>
  );
}
