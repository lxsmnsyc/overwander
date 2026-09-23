import type { PlayerIdentity } from '../../auth/user';
import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
  from,
  onCleanup,
  onMount,
} from 'solid-js';
import { localNow, syncServerClock } from '../../auth/clock';
import { getLocalOffset, toLocalTime } from '../../auth/local-time';
import {
  type RaidInvite,
  type RaidRecord,
  declineRaidInvite,
  getRaidBatched,
  getRaidTitle,
  watchLiveRaids,
  watchRaidInvites,
} from '../../auth/raids';
import { LobbyRole } from '../../auth/lobby-role';
import { type Profile, watchProfile } from '../../auth/profile';
import { RAID_INTERVAL } from '../../overworld/chunk-snapshot';
import RaidLobby from './RaidLobby';
import watchLive from '../app/watch';
import { Button, LIST_PAGE, List, ListRow, Meta, Note, Panel, createPager } from '../styled';
import { getSpeciesData } from '../../data/species';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import AnimatedSprite from '../sprites/AnimatedSprite';
import TypeBadge from '../sprites/TypeBadge';
import { useGame } from '../app/game-context';

export interface RaidsTabProps {
  user: PlayerIdentity;
  /**
   * What the panel should be called: the lair, while the player is
   * standing in a lobby, and nothing while they are looking at the
   * list of them
   */
  onTitle?: (title: string | null) => void;
  /**
   * Whether the lobby the player is standing in is their own, so the
   * dialog around the tab can refuse to be dismissed out from under a
   * host
   */
  onHosting?: (hosting: boolean) => void;
}

/**
 * One raid a friend called the player into. The lobby is usually in
 * the live list already; one staged in another zone's window is
 * fetched by name instead, read through `latest` so a row still
 * arriving does not suspend the tab
 */
/** The eight ways a lair can lie from the player, clockwise from north */
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** How far a lair is from the player, or its coordinates while their position is unknown */
function describeWhere(
  chunk: { x: number; y: number },
  standing: { chunkX: number; chunkY: number } | null,
): string {
  if (standing == null) {
    return `chunk ${chunk.x}, ${chunk.y}`;
  }

  const dx = chunk.x - standing.chunkX;
  const dy = chunk.y - standing.chunkY;
  const far = Math.max(Math.abs(dx), Math.abs(dy));

  if (far === 0) {
    return 'Here';
  }
  // North is up the board, which is -y
  const turn = Math.round(Math.atan2(dx, -dy) / (Math.PI / 4));

  return `${far} chunk${far === 1 ? '' : 's'} ${COMPASS[(turn + 8) % 8]}`;
}

/** A small uppercase heading over a list */
function ListHeading(props: { children: JSX.Element; aside?: JSX.Element }): JSX.Element {
  return (
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-xs font-semibold text-muted uppercase">{props.children}</span>
      {props.aside}
    </div>
  );
}

/**
 * One lair as a row: the boss asleep, its name and types, a muted line
 * under them, and what can be pressed on the right
 */
function LairRow(props: {
  raid: RaidRecord | null;
  line: JSX.Element;
  children: JSX.Element;
}): JSX.Element {
  return (
    <ListRow class="flex-nowrap">
      <span class="flex size-10 shrink-0 items-end justify-center">
        <Show when={props.raid}>
          {(raid) => (
            <AnimatedSprite
              species={raid().species}
              animation={SpriteAnim.Sleep}
              direction="DownLeft"
              scale={1}
              label={`${getSpeciesData(raid().species).name}, asleep in the lair`}
            />
          )}
        </Show>
      </span>
      <div class="flex min-w-0 grow flex-col gap-0.5">
        <div class="flex min-w-0 flex-wrap items-center gap-1.5">
          <span class="truncate font-medium">
            {props.raid == null ? 'A raid' : getRaidTitle(props.raid)}
          </span>
          <Show when={props.raid}>
            {(raid) => (
              <For each={getSpeciesData(raid().species).types}>
                {(type) => <TypeBadge type={type} />}
              </For>
            )}
          </Show>
        </div>
        <Meta class="truncate text-left">{props.line}</Meta>
      </div>
      <div class="flex shrink-0 gap-1.5">{props.children}</div>
    </ListRow>
  );
}

function InvitedRow(props: {
  invite: RaidInvite;
  known: RaidRecord | undefined;
  onOpen: () => void;
}): JSX.Element {
  // One per invite row, so the rows on screen share a read
  const [fetched] = createResource(
    () => (props.known == null ? props.invite.raid : null),
    async (id) => getRaidBatched(id),
  );
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
    <LairRow
      raid={raid()}
      line={`${named()} called you in to ${
        props.invite.role === LobbyRole.Spectator ? 'watch' : 'fight'
      }`}
    >
      <Button tone="primary" onClick={props.onOpen}>
        Open
      </Button>
      <Button
        onClick={() => {
          declineRaidInvite(props.invite.raid).catch(() => undefined);
        }}
      >
        Dismiss
      </Button>
    </LairRow>
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
  const knownRaid = (id: string): RaidRecord | undefined => {
    for (const [held, raid] of raids() ?? []) {
      if (held === id) {
        return raid;
      }
    }
    return undefined;
  };
  const invitedIds = (): string[] => {
    const ids: string[] = [];

    for (const invite of invites() ?? []) {
      ids.push(invite.raid);
    }
    return ids;
  };
  const gathering = createPager(() => raids() ?? [], LIST_PAGE);

  /** The player's clock, re-read each minute for the countdown to the next window */
  const [now, setNow] = createSignal(localNow(props.zone));
  onMount(() => {
    const beat = setInterval(() => {
      setNow(localNow(props.zone));
    }, 60_000);

    onCleanup(() => {
      clearInterval(beat);
    });
  });

  const nextWindow = (): string => {
    const minutes = Math.max(1, Math.ceil((RAID_INTERVAL - (now() % RAID_INTERVAL)) / 60_000));

    return `New raids in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  };

  const inviteTo = (id: string): RaidInvite | undefined => {
    for (const invite of invites() ?? []) {
      if (invite.raid === id) {
        return invite;
      }
    }
    return undefined;
  };

  return (
    <Panel>
      <Show
        when={game.raid()}
        fallback={
          <Show when={raids()} fallback={<Note>Loading raids…</Note>}>
            <Show when={(invites() ?? []).length > 0}>
              <ListHeading>Invited</ListHeading>
              <List>
                <For each={invitedIds()}>
                  {(id) => (
                    <Show when={inviteTo(id)}>
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
            <ListHeading aside={<Meta>{nextWindow()}</Meta>}>
              Gathering · {raids()?.length ?? 0}
            </ListHeading>
            <Show when={raids()?.length} fallback={<Note>No raids are gathering right now.</Note>}>
              <List>
                <For each={gathering.shown()}>
                  {([id, raid]) => (
                    <LairRow
                      raid={raid}
                      line={`${describeWhere(raid.chunk, game.position())} · ${raid.teams.length} team${
                        raid.teams.length === 1 ? '' : 's'
                      }`}
                    >
                      <Button
                        tone="primary"
                        onClick={() => {
                          game.setRaid(id);
                        }}
                      >
                        Open
                      </Button>
                    </LairRow>
                  )}
                </For>
              </List>
              {gathering.controls()}
            </Show>
          </Show>
        }
      >
        {(id) => (
          <RaidLobby
            user={props.user}
            raidId={id()}
            onTitle={props.onTitle}
            onHosting={props.onHosting}
          />
        )}
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
      <RaidList
        user={props.user}
        onTitle={props.onTitle}
        onHosting={props.onHosting}
        window={window}
        zone={zone}
      />
    </Suspense>
  );
}
