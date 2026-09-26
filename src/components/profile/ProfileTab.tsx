import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
  from,
} from 'solid-js';
import { type AchievementSheet, listAchievements } from '../../auth/achievements';
import { signOut } from '../../auth/actions';
import { type Profile, watchProfile } from '../../auth/profile';
import { AchievementTier, TIER_COLORS } from '../../data/achievements';
import AddFriendDialog from '../friends/AddFriendDialog';
import AwardsCard from './AwardsCard';
import { PlayerFace } from './PlayerPlate';
import BattleHistory from '../battle/BattleHistory';
import BuddyCard from '../catches/BuddyCard';
import { type AuctionRecord, canReclaim, listAuctionsBy } from '../../auth/auctions';
import BidsList from '../auctions/BidsList';
import SellingList from '../auctions/SellingList';
import FriendsTab from '../friends/FriendsTab';
import RequestsTab from '../friends/RequestsTab';
import createFriendTie from '../friends/tie';
import createClientSignal from '../app/client-signal';
import { answered } from '../app/resource-reads';
import {
  type FriendRequests,
  FriendTie,
  friendActionLabel,
  watchFriendRequests,
} from '../../auth/friends';
import EditProfileDialog from './EditProfileDialog';
import { hostDuel, inviteToDuel } from '../../auth/duels';
import { LobbyRole } from '../../auth/lobby-role';
import { GameDialog, useGame } from '../app/game-context';
import { ActionsIcon } from '../icons';
import PlayerPlace from './PlayerPlace';
import ProfileSection from './sections';
import TeamsCard from './TeamsCard';
import TradesTab from '../trades/TradesTab';
import { getTitleName, titleLine, titleType } from '../../data/ids/titles';
import {
  Badge,
  Button,
  Card,
  Menu,
  Note,
  Panel,
  Row,
  Status,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
} from '../styled';

/**
 * The tier the wearer stands at on the worn title's line, read off
 * the sheet in its own component so the resource is read under the
 * Suspense below
 */
function TierBadge(props: {
  sheet: Resource<AchievementSheet>;
  title: number;
  name: string;
}): JSX.Element {
  const tier = (): AchievementTier => {
    const sheet = props.sheet();

    if (sheet == null) {
      return AchievementTier.None;
    }

    const line = titleLine(props.title);

    if (line != null) {
      for (const [held, standing] of sheet.lines) {
        if (held === line) {
          return standing.tier;
        }
      }
      return AchievementTier.None;
    }

    const type = titleType(props.title);

    if (type != null) {
      for (const [held, standing] of sheet.types) {
        if (held === type) {
          return standing.tier;
        }
      }
    }
    return AchievementTier.None;
  };

  return (
    <Show when={tier() !== AchievementTier.None} fallback={<Badge>{props.name}</Badge>}>
      <Badge style={{ 'border-color': TIER_COLORS[tier()], color: TIER_COLORS[tier()] }}>
        {props.name}
      </Badge>
    </Show>
  );
}

/**
 * The worn title as a pill in its tier's metal: a line or type title
 * is coloured by where the wearer stands on that line today, so the
 * same title brightens as they climb. A ladder title has no tier and
 * wears the gold tone
 */
function TitleBadge(props: { player: string; title: number; name: string }): JSX.Element {
  if (titleLine(props.title) == null && titleType(props.title) == null) {
    return <Badge tone="gold">{props.name}</Badge>;
  }

  const [sheet] = createResource(() => props.player, listAchievements);

  return (
    <Suspense fallback={<Badge>{props.name}</Badge>}>
      <TierBadge sheet={sheet} title={props.title} name={props.name} />
    </Suspense>
  );
}

export interface ProfileTabProps {
  player: string;
  /**
   * Whether this is somebody else's profile, being looked at.
   *
   * Everything that only reports stays; everything that changes
   * something goes — signing out, swapping the buddy, collecting what
   * a raid still owes. None of it is a permission: the server refuses
   * every one of them for a player who is not the owner. This is so
   * they are not offered in the first place
   */
  viewOnly?: boolean;
  /**
   * Which part to open at, for somebody sent here to answer one thing.
   * The panel is built fresh each time the dialog opens, so this is
   * read once on the way in and the player is free to move off it
   */
  section?: ProfileSection;
}

/** The player's own sections, grouped for the side list */
const SECTION_GROUPS: { label: string; sections: [ProfileSection, string][] }[] = [
  {
    label: 'Record',
    sections: [
      [ProfileSection.Battles, 'Battles'],
      [ProfileSection.Awards, 'Awards'],
      [ProfileSection.Teams, 'Teams'],
    ],
  },
  {
    label: 'Social',
    sections: [
      [ProfileSection.Friends, 'Friends'],
      [ProfileSection.Requests, 'Requests'],
      [ProfileSection.Trades, 'Trades'],
    ],
  },
  {
    label: 'Market',
    sections: [
      [ProfileSection.Bids, 'Bids'],
      [ProfileSection.Selling, 'Selling'],
    ],
  },
];

/**
 * Who the player is: their details and balance, who is walking with
 * them, and — under an inner tab — what they have fought and what they
 * have bid on
 */
export default function ProfileTab(props: ProfileTabProps): JSX.Element {
  const game = useGame();
  // The balance moves whenever the player earns or spends, so the
  // profile is followed rather than read once
  const profile = from<Profile | null>((set) =>
    watchProfile(props.player, (record) => {
      set(record);
    }),
  );
  const [error, setError] = createSignal<string | null>(null);
  const [said, setSaid] = createSignal<string | null>(null);
  const [adding, setAdding] = createSignal(false);
  const [editing, setEditing] = createSignal(false);
  /**
   * Where the reader stands with the trainer they are looking at. On
   * the reader's own profile it stands at None and is never asked:
   * nobody befriends themselves
   */
  const friend = createFriendTie(() => (props.viewOnly === true ? props.player : null));
  /**
   * What is waiting on an answer. It is followed here rather than in
   * the tab that lists it because the count is wanted on the tab
   * itself, and the same query twice is two subscriptions
   */
  const waiting = from<FriendRequests>((set) =>
    props.viewOnly === true
      ? () => {
          // Nothing to follow: a visited profile is not the reader's,
          // and somebody else's requests are not theirs to see
        }
      : watchFriendRequests(props.player, (requests) => {
          set(requests);
        }),
  );
  const asking = (): FriendRequests => waiting() ?? { incoming: [], outgoing: [] };

  /**
   * What the player has put on the block. Read here rather than in
   * the tab that lists it for the reason the requests are: the count
   * of what is stranded belongs on the tab itself, and reading it in
   * both places would be the same query twice.
   *
   * Gated on the browser, so nothing is asked for while the page is
   * being drawn, and read below without waiting, since this body
   * declares it: a read that waits here would reach the boundary
   * around the profile rather than one inside it. Somebody else's
   * lots are not the reader's business: the reclaim button on one
   * would be theirs to press, so a visited profile asks for nothing
   */
  const client = createClientSignal();
  const [selling, { refetch: refetchSelling }] = createResource(
    () => client() && props.viewOnly !== true && props.player,
    listAuctionsBy,
  );
  // Answered rather than left to the gate: a source that goes falsy
  // stops a resource fetching but does not empty it, so a reader who
  // walked from their own profile to somebody else's would be shown
  // their own lots under the other player's name
  const lots = (): [string, AuctionRecord][] =>
    props.viewOnly === true ? [] : (answered(selling) ?? []);

  /**
   * How many lots came back unsold and are still sitting in escrow.
   * Nothing else in the game ever mentions one, so this count is the
   * whole of how a player finds out
   */
  const stranded = (): number => {
    const now = Date.now();
    let count = 0;

    for (const [, lot] of lots()) {
      if (canReclaim(lot, props.player, now)) {
        count += 1;
      }
    }
    return count;
  };

  /**
   * The open section, held here rather than by the group so a group
   * built again keeps its place
   */
  const [open, setOpen] = createSignal(props.section ?? ProfileSection.Battles);

  /** What is waiting on the player in a section, for its badge */
  const countFor = (section: ProfileSection): number => {
    if (section === ProfileSection.Requests) {
      return asking().incoming.length;
    }
    if (section === ProfileSection.Selling) {
      return stranded();
    }
    return 0;
  };

  const leave = (): void => {
    setError(null);
    signOut().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : String(caught));
    });
  };

  /**
   * Whether a lobby is being staged for this trainer. It is two calls
   * -- open one, call them into it -- and the menu goes dead between
   * them so a second press does not stage a second fight
   */
  const [staging, setStaging] = createSignal(false);

  /**
   * Ask this trainer for a fight: a lobby of the reader's own, with
   * them called into the seat opposite. The lobby is opened over
   * whatever the profile was opened over, which is where the fight is
   * actually arranged
   */
  const challenge = (): void => {
    setError(null);
    setStaging(true);
    hostDuel()
      .then(async (id) => {
        const called = await inviteToDuel(id, props.player, LobbyRole.Fighter);

        if (!called) {
          setError('They could not be called in — your lobby may already have two trainers in it.');
        }
        game.setVisiting(null);
        game.setDuel(id);
        game.setDialog(GameDialog.Battles);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setStaging(false);
      });
  };

  return (
    <Panel>
      {/* One trainer card: who they are on the left, who walks with
          them on the right */}
      <Card class="md:flex-row md:items-stretch md:gap-0">
        <Show when={profile()} fallback={<Note>Loading profile…</Note>}>
          {(loaded) => (
            <div class="flex min-w-0 items-start gap-4 md:w-1/2 md:border-r-2 md:border-line-soft md:pr-4">
              <PlayerFace sprite={loaded().sprite} size={64} />
              <div class="flex min-w-0 grow flex-col gap-2">
                <span class="truncate text-lg font-semibold">{loaded().nickname}</span>
                <Row>
                  <Show when={loaded().title != null && getTitleName(loaded().title ?? -1)} keyed>
                    {(worn) => (
                      <TitleBadge player={props.player} title={loaded().title ?? -1} name={worn} />
                    )}
                  </Show>
                  <Badge tone="gold">{loaded().gold.toLocaleString()} gold</Badge>
                </Row>
                <PlayerPlace player={props.player} />
              </div>
              {/* Visited, the menu holds what a reader can do to somebody else */}
              <Show
                when={props.viewOnly !== true}
                fallback={
                  <Menu
                    label="Actions"
                    icon={ActionsIcon}
                    actions={[
                      {
                        label: 'Battle',
                        disabled: staging(),
                        onSelect: challenge,
                      },
                      {
                        label: friendActionLabel(friend.tie()),
                        disabled: friend.busy(),
                        onSelect: friend.act,
                      },
                      ...(friend.tie() === FriendTie.Blocked
                        ? []
                        : [
                            {
                              label: 'Block',
                              disabled: friend.busy(),
                              onSelect: friend.block,
                            },
                          ]),
                    ]}
                  />
                }
              >
                <Menu
                  label="Actions"
                  icon={ActionsIcon}
                  actions={[
                    {
                      label: 'Edit profile',
                      onSelect: () => {
                        setEditing(true);
                      },
                    },
                    {
                      label: 'Add friend',
                      onSelect: () => {
                        setAdding(true);
                      },
                    },
                    { label: 'Sign out', onSelect: leave },
                  ]}
                />
              </Show>
            </div>
          )}
        </Show>

        <div class="min-w-0 border-t-2 border-line-soft pt-3 md:w-1/2 md:border-t-0 md:pt-0 md:pl-4">
          <BuddyCard
            player={props.player}
            viewOnly={props.viewOnly}
            onOpen={(catchId) => {
              game.setSheet({ catchId, readOnly: props.viewOnly === true });
            }}
          />
        </div>
      </Card>

      {/* Visited, the bottom half is only what they have fought and earned */}
      <Show
        when={props.viewOnly !== true}
        fallback={
          <TabGroup horizontal defaultValue={ProfileSection.Battles} class="flex flex-col gap-3">
            <TabBar>
              <TabButton value={ProfileSection.Battles}>Battles</TabButton>
              <TabButton value={ProfileSection.Awards}>Awards</TabButton>
            </TabBar>
            <TabPane value={ProfileSection.Battles}>
              <Card title="Battles">
                <BattleHistory player={props.player} viewOnly />
              </Card>
            </TabPane>
            <TabPane value={ProfileSection.Awards}>
              <AwardsCard player={props.player} />
            </TabPane>
          </TabGroup>
        }
      >
        {/* One level of sections: a side list from `md` up, a bar that
            scrolls sideways on a phone */}
        <TabGroup
          horizontal
          value={open()}
          onChange={(value) => {
            setOpen(value);
          }}
          class="flex flex-col gap-3 md:flex-row md:items-start md:gap-4"
        >
          <TabBar class="md:sticky md:top-0 md:w-40 md:shrink-0 md:flex-col md:overflow-visible">
            <For each={SECTION_GROUPS}>
              {(group) => (
                <>
                  <span
                    aria-hidden="true"
                    class="hidden px-3 pt-2 pb-0.5 text-xs font-semibold text-muted uppercase first:pt-0.5 md:block"
                  >
                    {group.label}
                  </span>
                  <For each={group.sections}>
                    {([section, label]) => (
                      <TabButton value={section} class="md:justify-start">
                        {label}
                        <Show when={countFor(section) > 0}>
                          <Badge tone="ember" class="ml-1.5">
                            {countFor(section)}
                          </Badge>
                        </Show>
                      </TabButton>
                    )}
                  </For>
                </>
              )}
            </For>
          </TabBar>

          <div class="min-w-0 grow">
            <TabPane value={ProfileSection.Battles}>
              <Card>
                <BattleHistory player={props.player} />
              </Card>
            </TabPane>
            <TabPane value={ProfileSection.Awards}>
              <AwardsCard player={props.player} />
            </TabPane>
            {/* The saved parties the raid and duel team pickers fill from */}
            <TabPane value={ProfileSection.Teams}>
              <TeamsCard player={props.player} />
            </TabPane>
            <TabPane value={ProfileSection.Friends}>
              <Card>
                <Row class="justify-end">
                  <Button
                    tone="primary"
                    onClick={() => {
                      setAdding(true);
                    }}
                  >
                    Add friend
                  </Button>
                </Row>
                <FriendsTab player={props.player} />
              </Card>
            </TabPane>
            {/* What they have been asked and can still take back */}
            <TabPane value={ProfileSection.Requests}>
              <Card>
                <RequestsTab waiting={asking()} />
              </Card>
            </TabPane>
            {/* Offers to answer, waiting on an answer, and what has changed hands */}
            <TabPane value={ProfileSection.Trades}>
              <Card>
                <TradesTab player={props.player} />
              </Card>
            </TabPane>
            <TabPane value={ProfileSection.Bids}>
              <Card>
                <BidsList player={props.player} />
              </Card>
            </TabPane>
            {/* Lots on the block, and unsold ones waiting to come out of escrow */}
            <TabPane value={ProfileSection.Selling}>
              <Card>
                <SellingList
                  player={props.player}
                  lots={lots()}
                  onChanged={() => {
                    Promise.resolve(refetchSelling()).catch(() => undefined);
                  }}
                />
              </Card>
            </TabPane>
          </div>
        </TabGroup>
      </Show>
      {/* Somebody to ask, out of everybody playing. It is opened from
          the menu on the player's own profile alone */}
      <AddFriendDialog
        isOpen={adding()}
        onClose={() => {
          setAdding(false);
        }}
      />
      {/* The name and the picture, which are the whole of what a
          trainer sets about themselves */}
      <Show when={profile()}>
        {(loaded) => (
          <EditProfileDialog
            player={props.player}
            profile={loaded()}
            isOpen={editing()}
            onClose={() => {
              setEditing(false);
            }}
            onSaved={() => {
              setSaid('Profile saved.');
            }}
          />
        )}
      </Show>
      <Status message={said()} />
      <Status message={error()} tone="alert" />
      <Status message={friend.error()} tone="alert" />
    </Panel>
  );
}
