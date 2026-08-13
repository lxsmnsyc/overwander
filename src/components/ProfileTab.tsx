import { type JSX, Show, createSignal, from } from 'solid-js';
import { TabGroup } from 'terracotta';
import { signOut } from '../auth/actions';
import { type Profile, watchProfile } from '../auth/profile';
import BattleHistory from './BattleHistory';
import BuddyCard from './BuddyCard';
import BidsList from './BidsList';
import CatchesList from './CatchesList';
import InventoryList from './InventoryList';
import { Badge, Button, Card, Note, Panel, Status, TabBar, TabButton, TabPane } from './styled';

const enum InnerTab {
  Catches = 0,
  Inventory = 1,
  Battles = 2,
  Bids = 3,
}

export interface ProfileTabProps {
  player: string;
}

/**
 * Everything about the player: their details and balance, their
 * buddy, and — under an inner tab — their catches and what they
 * carry
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
                theirs instead */}
            <Button onClick={leave}>Sign out</Button>
          </Card>
        )}
      </Show>

      {/* Who is walking with them, which is the one thing on this
          page that changes what happens outside it: a buddy draws
          spawns in, earns the candy, and is what an egg is counted
          against */}
      <BuddyCard player={props.player} />

      <TabGroup
        horizontal
        defaultValue={InnerTab.Catches}
        toggleable={false}
        class="flex flex-col gap-3"
      >
        <TabBar>
          <TabButton value={InnerTab.Catches}>Catches</TabButton>
          <TabButton value={InnerTab.Inventory}>Inventory</TabButton>
          <TabButton value={InnerTab.Battles}>Battles</TabButton>
          <TabButton value={InnerTab.Bids}>Bids</TabButton>
        </TabBar>
        <TabPane value={InnerTab.Catches}>
          <Card title="Catches">
            <CatchesList player={props.player} />
          </Card>
        </TabPane>
        <TabPane value={InnerTab.Inventory}>
          <Card title="Inventory">
            <InventoryList player={props.player} />
          </Card>
        </TabPane>
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
      <Status message={error()} tone="alert" />
    </Panel>
  );
}
