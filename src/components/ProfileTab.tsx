import { type JSX, Show, createSignal, from } from 'solid-js';
import { TabGroup } from 'terracotta';
import { signOut } from '../auth/actions';
import { type Profile, watchProfile } from '../auth/profile';
import BattleHistory from './BattleHistory';
import BuddyCard from './BuddyCard';
import BidsList from './BidsList';
import { Badge, Button, Card, Note, Panel, Status, TabBar, TabButton, TabPane } from './styled';

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
  Bids = 1,
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
          <Card class="sm:flex-row sm:items-center sm:gap-4">
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
            <div class="flex grow flex-wrap items-center gap-2">
              <span class="text-lg font-semibold">{loaded().nickname}</span>
              <Badge tone="gold">{loaded().gold} gold</Badge>
            </div>
            {/* The way out. It lived on a sign-in page of its own,
                which is a page for the one moment a player is not
                signed in — so it lives with the rest of what is
                theirs instead. Nobody signs out of somebody else's
                profile */}
            <Show when={props.viewOnly !== true}>
              <Button onClick={leave}>Sign out</Button>
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
          <Card title="Battles">
            <BattleHistory player={props.player} viewOnly />
          </Card>
        }
      >
        <TabGroup
          horizontal
          defaultValue={InnerTab.Battles}
          toggleable={false}
          class="flex flex-col gap-3"
        >
          <TabBar>
            <TabButton value={InnerTab.Battles}>Battles</TabButton>
            <TabButton value={InnerTab.Bids}>Bids</TabButton>
          </TabBar>
          <TabPane value={InnerTab.Battles}>
            <Card title="Battles">
              <BattleHistory player={props.player} />
            </Card>
          </TabPane>
          {/* What the player has bid on, which lots they are still
              leading, and which they won and have not collected */}
          <TabPane value={InnerTab.Bids}>
            <Card title="Bids">
              <BidsList player={props.player} />
            </Card>
          </TabPane>
        </TabGroup>
      </Show>
      <Status message={error()} tone="alert" />
    </Panel>
  );
}
