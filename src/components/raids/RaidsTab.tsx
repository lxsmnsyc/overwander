import { isFemaleBoss } from '../../model/raid-record';
import type { PlayerIdentity } from '../../auth/user';
import {
  type Accessor,
  For,
  Loading,
  Show,
  createMemo,
  createSignal,
  from,
  onSettled,
} from 'solid-js';
import type { JSX } from '@solidjs/web';
import { localNow, syncServerClock } from '../../auth/clock';
import { getLocalOffset, toLocalTime } from '../../model/local-time';
import {
  type RaidInvite,
  type RaidRecord,
  declineRaidInvite,
  getRaidBatched,
  getRaidTitle,
  watchLiveRaids,
  watchRaidInvites,
} from '../../auth/raids';
import LobbyRole from '../../model/lobby-role';
import { type Profile, watchProfile } from '../../auth/profile';
import { RAID_INTERVAL } from '../../overworld/chunk-snapshot';
import RaidLobby, { type RaidLobbyReport } from './raid-lobby';
import watchLive from '../app/watch';
import { createLoad } from '../app/create-load';
import {
  Button,
  GroupLabel,
  LIST_PAGE,
  List,
  Meta,
  Note,
  Panel,
  Pill,
  RowActions,
  RowCard,
  createPager,
} from '../styled';
import { getSpeciesData } from '../../data/species';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import AnimatedSprite from '../sprites/AnimatedSprite';
import TypeBadge from '../sprites/TypeBadge';
import { useGame } from '../app/game-context';
import describeWhere from '../../overworld/bearing';
import { m } from '../../i18n/paraglide/messages.js';

export interface RaidsTabProps {
  user: PlayerIdentity;
  /**
   * The lobby the player is standing in, so the dialog around the tab
   * is named for the lair and refuses to be dismissed out from under a
   * host; null while they are looking at the list
   */
  onLobby?: (lobby: RaidLobbyReport | null) => void;
}

/**
 * One raid a friend called the player into. The lobby is usually in
 * the live list already; one staged in another zone's window is
 * fetched by name instead, read through `latest` so a row still
 * arriving does not suspend the tab
 */
/** The label face over a list, with what stands at its right end */
function ListHeading(props: { children: JSX.Element; aside?: JSX.Element }): JSX.Element {
  return (
    <div class="flex flex-wrap items-center gap-2.5">
      <GroupLabel>{props.children}</GroupLabel>
      {props.aside}
    </div>
  );
}

/**
 * One lair as a card: the boss asleep on its own square, its name and
 * types, a muted line under them, and what can be pressed on the right
 */
function LairRow(props: {
  raid: RaidRecord | null;
  line: JSX.Element;
  children: JSX.Element;
  /** An invite stands out from the lairs gathering below it */
  invited?: boolean;
}): JSX.Element {
  return (
    <RowCard tone={props.invited === true ? 'ember' : 'plain'} class="min-h-[76px]">
      <span
        class="flex size-[52px] shrink-0 items-end justify-center rounded-[16px] bg-line-soft/60
          p-0.5"
      >
        <Show when={props.raid}>
          {(raid) => (
            <AnimatedSprite
              species={raid().species}
              female={isFemaleBoss(raid().species, raid().traitValue)}
              animation={SpriteAnim.Sleep}
              direction="DownLeft"
              fill
              label={m.raid_asleep({ name: getSpeciesData(raid().species).name })}
            />
          )}
        </Show>
      </span>
      <div class="flex min-w-0 grow flex-col gap-1">
        <span class="truncate text-sm font-extrabold">
          {props.raid == null ? m.raid_a_raid() : getRaidTitle(props.raid)}
        </span>
        <Show when={props.raid}>
          {(raid) => (
            <span class="flex flex-wrap gap-1">
              <For each={getSpeciesData(raid().species).types}>
                {(type) => <TypeBadge type={type} />}
              </For>
            </span>
          )}
        </Show>
        <Meta class="truncate text-left">{props.line}</Meta>
      </div>
      <RowActions>{props.children}</RowActions>
    </RowCard>
  );
}

function InvitedRow(props: {
  invite: RaidInvite;
  known: RaidRecord | undefined;
  onOpen: () => void;
}): JSX.Element {
  // One per invite row, so the rows on screen share a read. The row
  // draws without its lair until it lands
  const fetched = createLoad(
    () => (props.known == null ? props.invite.raid : null),
    async (id) => getRaidBatched(id),
  );
  const raid = (): RaidRecord | null => props.known ?? fetched.latest() ?? null;
  // Seeded with nothing, so the row names "a friend" until the profile
  // lands rather than holding the list
  const caller = createMemo(() =>
    from<Profile | null | undefined>((set) => {
      set(undefined);
      return watchProfile(props.invite.sender, (record) => {
        set(record);
      });
    }),
  );
  const named = (): string => {
    const nickname = caller()?.nickname ?? '';

    return nickname === '' ? m.raid_a_friend() : nickname;
  };

  return (
    <LairRow
      invited
      raid={raid()}
      line={
        props.invite.role === LobbyRole.Spectator
          ? m.raid_called_watch({ name: named() })
          : m.raid_called_fight({ name: named() })
      }
    >
      <Button tone="primary" onClick={props.onOpen}>
        {m.raid_open()}
      </Button>
      <Button
        onClick={() => {
          declineRaidInvite(props.invite.raid).catch(() => undefined);
        }}
      >
        {m.ui_dismiss()}
      </Button>
    </LairRow>
  );
}

/**
 * The lobbies themselves, which is where the window is read.
 *
 * A window read in the body that declared it throws past every
 * `Loading` written there and lands on the boundary around the whole
 * page, so the read lives one component down
 */
function RaidList(props: RaidsTabProps & { window: Accessor<number>; zone: number }): JSX.Element {
  const game = useGame();
  // The listing follows every lobby that opens, fills, starts or
  // clears in the window the tab was opened for. It waits with the
  // window, under the boundary above
  const raids = watchLive<number, [string, RaidRecord][]>(
    () => props.window(),
    (raidWindow, set) =>
      watchLiveRaids(raidWindow, props.zone, (live) => {
        set(live);
      }),
  );
  // What friends have called the player into, shown above the list
  // and only while something is waiting. Seeded with nothing, so the
  // list draws without them until they land
  const invites = createMemo(() =>
    from<RaidInvite[] | undefined>((set) => {
      set(undefined);
      return watchRaidInvites(props.user.uid, (waiting) => {
        set(waiting);
      });
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
  onSettled(() => {
    const beat = setInterval(() => {
      setNow(localNow(props.zone));
    }, 60_000);

    return () => {
      clearInterval(beat);
    };
  });

  const nextWindow = (): string => {
    const minutes = Math.max(1, Math.ceil((RAID_INTERVAL - (now() % RAID_INTERVAL)) / 60_000));

    return m.raid_next_window({ count: minutes });
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
          <Show when={raids()} fallback={<Note>{m.raid_loading()}</Note>}>
            <Show when={(invites() ?? []).length > 0}>
              <ListHeading
                aside={
                  <span
                    class="inline-flex h-[22px] min-w-[26px] items-center justify-center rounded-full
                      bg-ember px-1.5 font-display text-xs font-semibold text-on-accent tabular-nums"
                  >
                    {invitedIds().length}
                  </span>
                }
              >
                {m.raid_invited()}
              </ListHeading>
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
            {/* The next window's countdown stands at the heading's right */}
            <div class="flex flex-wrap items-center gap-2.5">
              <GroupLabel>{m.raid_gathering({ count: raids()?.length ?? 0 })}</GroupLabel>
              <span class="grow" />
              <Pill tone="tide" size="medium">
                {nextWindow()}
              </Pill>
            </div>
            <Show when={raids()?.length} fallback={<Note>{m.raid_none_gathering()}</Note>}>
              <List class="grid! grid-cols-1 md:grid-cols-2">
                <For each={gathering.shown()}>
                  {([id, raid]) => (
                    <LairRow
                      raid={raid}
                      line={m.raid_gathering_line({
                        where: describeWhere(raid.chunk, game.position()),
                        count: raid.teams.length,
                      })}
                    >
                      <Button
                        tone="primary"
                        onClick={() => {
                          game.setRaid(id);
                        }}
                      >
                        {m.raid_open()}
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
        {(id) => <RaidLobby user={props.user} raidId={id()} onLobby={props.onLobby} />}
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
  const window = createMemo(async () => {
    const now = toLocalTime(await syncServerClock(), zone);

    return Math.floor(now / RAID_INTERVAL) * RAID_INTERVAL;
  });

  return (
    <Loading
      fallback={
        <Panel>
          <Note>{m.raid_loading()}</Note>
        </Panel>
      }
    >
      <RaidList user={props.user} onLobby={props.onLobby} window={window} zone={zone} />
    </Loading>
  );
}
