import {
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
import BattleHistory from '../battle/BattleHistory';
import BuddyCard from '../catches/BuddyCard';
import BidsList from '../auctions/BidsList';
import FriendsTab from '../friends/FriendsTab';
import RequestsTab from '../friends/RequestsTab';
import createFriendTie from '../friends/tie';
import {
  type FriendRequests,
  FriendTie,
  friendActionLabel,
  watchFriendRequests,
} from '../../auth/friends';
import EditProfileDialog from './EditProfileDialog';
import { ActionsIcon } from '../icons';
import PlayerPlace from './PlayerPlace';
import TradesTab from '../trades/TradesTab';
import { getTitleName, titleLine, titleType } from '../../data/ids/titles';
import {
  Badge,
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
 * What is left under the tabs.
 *
 * The catches and the bag were the first two, and they are their own
 * panels behind the menu now: they are the two things a player opens
 * most, and neither is a fact about who somebody is. What stays is
 * what the profile was always about — what this player has done.
 *
 * A profile being *visited* has no tabs at all. Somebody else's bids
 * cannot be read — a bidding history is the one thing on the board
 * that stays private, and the rules refuse the query — which leaves
 * their battles, and a bar holding one tab is a control that decides
 * nothing
 */
const enum InnerTab {
  Battles = 0,
  Friends = 1,
  Requests = 2,
  Bids = 3,
  Trades = 4,
  Awards = 5,
}

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
      return sheet.lines.find(([held]) => held === line)?.[1].tier ?? AchievementTier.None;
    }

    const type = titleType(props.title);

    if (type != null) {
      return sheet.types.find(([held]) => held === type)?.[1].tier ?? AchievementTier.None;
    }
    return AchievementTier.None;
  };

  return (
    <Show
      when={tier() !== AchievementTier.None}
      fallback={<Badge class="-mt-1 self-start">{props.name}</Badge>}
    >
      <Badge
        class="-mt-1 self-start"
        style={{ 'border-color': TIER_COLORS[tier()], color: TIER_COLORS[tier()] }}
      >
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
    return (
      <Badge tone="gold" class="-mt-1 self-start">
        {props.name}
      </Badge>
    );
  }

  const [sheet] = createResource(() => props.player, listAchievements);

  return (
    <Suspense fallback={<Badge class="-mt-1 self-start">{props.name}</Badge>}>
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
}

/**
 * Who the player is: their details and balance, who is walking with
 * them, and — under an inner tab — what they have fought and what they
 * have bid on
 */
export default function ProfileTab(props: ProfileTabProps): JSX.Element {
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

  const leave = (): void => {
    setError(null);
    signOut().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : String(caught));
    });
  };

  return (
    <Panel>
      <Show when={profile()} fallback={<Note>Loading profile…</Note>}>
        {(loaded) => (
          <Card class="sm:flex-row sm:items-start sm:gap-4">
            {/* The avatar, or the room one will take. It is drawn
                either way: a card that grows a picture the day a
                player sets one changes shape under somebody who
                already knows it, and the placeholder says there is
                something here to set */}
            <Show
              when={loaded().avatar}
              fallback={
                <div
                  class="flex size-16 shrink-0 items-center justify-center rounded-full border
                    border-dashed border-line bg-line-soft text-lg font-semibold text-muted"
                  role="img"
                  aria-label="No avatar set"
                  title="No avatar set"
                >
                  {loaded().nickname.slice(0, 1).toUpperCase()}
                </div>
              }
            >
              {(avatar) => (
                <img
                  src={avatar()}
                  alt="Avatar"
                  width={64}
                  height={64}
                  class="size-16 shrink-0 rounded-full border-2 border-tide object-cover"
                />
              )}
            </Show>
            <div class="flex min-w-0 grow flex-col gap-2">
              {/* The purse beside the name rather than on a line of
                  its own, where it sat looking like a stray under the
                  place badge */}
              <Row>
                <span class="text-lg font-semibold">{loaded().nickname}</span>
                <Badge tone="gold">{loaded().gold} gold</Badge>
              </Row>
              {/* The worn title, under the name it decorates */}
              <Show when={loaded().title != null && getTitleName(loaded().title ?? -1)} keyed>
                {(worn) => (
                  <TitleBadge player={props.player} title={loaded().title ?? -1} name={worn} />
                )}
              </Show>
              {/* Where in the world they are, under the name: it is
                  the one fact about a trainer that changes while
                  somebody is reading it, and it belongs to who they
                  are rather than to a card of its own */}
              <PlayerPlace player={props.player} />
            </div>
            {/* Everything the profile can do, behind one button: the
                way out is a press a player makes once a session, and
                a card is not the place for a row of them.

                Visited, the menu holds the one thing a reader can do
                to somebody else — ask them, answer them, or undo it */}
            <Show
              when={props.viewOnly !== true}
              fallback={
                <Menu
                  label="Actions"
                  icon={ActionsIcon}
                  actions={[
                    {
                      label: friendActionLabel(friend.tie()),
                      disabled: friend.busy(),
                      onSelect: friend.act,
                    },
                    // Blocking is offered until it is done, and then
                    // the menu is the one press that undoes it: a
                    // blocked trainer has nothing else to be asked
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
          </Card>
        )}
      </Show>

      {/* Who is walking with them, which is the one thing on this
          page that changes what happens outside it: a buddy draws
          spawns in, earns the candy, and is what an egg is counted
          against */}
      <BuddyCard player={props.player} viewOnly={props.viewOnly} />

      {/* Visited, this is the whole of the bottom half: what they have
          fought, with no bar over it. The tabs are back the moment the
          profile is the reader's own */}
      <Show
        when={props.viewOnly !== true}
        fallback={
          <TabGroup horizontal defaultValue={InnerTab.Battles} class="flex flex-col gap-3">
            <TabBar>
              <TabButton value={InnerTab.Battles}>Battles</TabButton>
              <TabButton value={InnerTab.Awards}>Awards</TabButton>
            </TabBar>
            <TabPane value={InnerTab.Battles}>
              <Card title="Battles">
                <BattleHistory player={props.player} viewOnly />
              </Card>
            </TabPane>
            <TabPane value={InnerTab.Awards}>
              <AwardsCard player={props.player} />
            </TabPane>
          </TabGroup>
        }
      >
        <TabGroup horizontal defaultValue={InnerTab.Battles} class="flex flex-col gap-3">
          <TabBar>
            <TabButton value={InnerTab.Battles}>Battles</TabButton>
            <TabButton value={InnerTab.Awards}>Awards</TabButton>
            <TabButton value={InnerTab.Friends}>Friends</TabButton>
            <TabButton value={InnerTab.Requests}>
              Friend Requests
              {/* The count of what is waiting, on the tab itself:
                  a request nobody is told about is one nobody
                  answers */}
              <Show when={asking().incoming.length > 0}>
                <Badge tone="ember" class="ml-1.5">
                  {asking().incoming.length}
                </Badge>
              </Show>
            </TabButton>
            <TabButton value={InnerTab.Bids}>Bids</TabButton>
            <TabButton value={InnerTab.Trades}>Trades</TabButton>
          </TabBar>
          <TabPane value={InnerTab.Battles}>
            <Card title="Battles">
              <BattleHistory player={props.player} />
            </Card>
          </TabPane>
          {/* What they have won for good: the badge shelf, every slot
              shown so a visitor can see what is earned and what is
              still out there */}
          <TabPane value={InnerTab.Awards}>
            <AwardsCard player={props.player} />
          </TabPane>
          <TabPane value={InnerTab.Friends}>
            <Card title="Friends">
              <FriendsTab player={props.player} />
            </Card>
          </TabPane>
          {/* Both directions: what has been asked of the player, and
              what they have asked and can still take back */}
          <TabPane value={InnerTab.Requests}>
            <Card title="Friend Requests">
              <RequestsTab waiting={asking()} />
            </Card>
          </TabPane>
          {/* What the player has bid on, which lots they are still
              leading, and which they won and have not collected */}
          <TabPane value={InnerTab.Bids}>
            <Card title="Bids">
              <BidsList player={props.player} />
            </Card>
          </TabPane>
          {/* Offers between the player and their friends: to answer,
              waiting on an answer, and what has already changed hands */}
          <TabPane value={InnerTab.Trades}>
            <Card title="Trades">
              <TradesTab player={props.player} />
            </Card>
          </TabPane>
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
