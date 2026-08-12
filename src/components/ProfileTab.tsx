import { type JSX, Show, createResource, createSignal, from } from 'solid-js';
import { TabGroup } from 'terracotta';
import { signOut } from '../auth/actions';
import { resolveBuddy } from '../auth/buddy';
import { type Profile, watchProfile } from '../auth/profile';
import { isEgg } from '../auth/egg';
import { getSpeciesData } from '../data/species';
import BattleHistory from './BattleHistory';
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
  const [buddy] = createResource(() => props.player, resolveBuddy);
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
            <Show when={loaded().avatar}>
              {(avatar) => (
                <img
                  src={avatar()}
                  alt="Avatar"
                  width={64}
                  height={64}
                  class="size-16 shrink-0 rounded-full border border-line object-cover"
                />
              )}
            </Show>
            <div class="flex grow flex-wrap items-center gap-2">
              <span class="text-lg font-semibold">{loaded().nickname}</span>
              <Badge tone="gold">{loaded().gold} gold</Badge>
              {/* Who is walking with them, which is the one thing
                  here that changes what happens outside: a buddy
                  draws spawns in and an egg is counting paces */}
              <Show when={buddy()}>
                {(pair) => (
                  <Badge>
                    {isEgg(pair()[1])
                      ? `Egg · ${pair()[1].steps} / ${pair()[1].hatchSteps}`
                      : `${getSpeciesData(pair()[1].species).name} · Lv. ${pair()[1].level}`}
                  </Badge>
                )}
              </Show>
            </div>
            {/* The way out. It lived on a sign-in page of its own,
                which is a page for the one moment a player is not
                signed in — so it lives with the rest of what is
                theirs instead */}
            <Button onClick={leave}>Sign out</Button>
          </Card>
        )}
      </Show>

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
