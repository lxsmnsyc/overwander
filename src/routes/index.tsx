import { Title } from '@solidjs/meta';
import type { User } from 'firebase/auth';
import { For, type JSX, Show } from 'solid-js';
import { TabGroup, TabPanel } from 'terracotta';
import { useAuth } from '../auth/context';
import AuctionTab from '../components/AuctionTab';
import BattleView from '../components/BattleView';
import GameProvider, { GameTab, useGame } from '../components/game-context';
import LoginForm from '../components/LoginForm';
import OverworldTab from '../components/OverworldTab';
import ProfileTab from '../components/ProfileTab';
import RaidsTab from '../components/RaidsTab';
import { Note, TabBar, TabButton } from '../components/styled';

interface TabDefinition {
  tab: GameTab;
  label: string;
}

const TABS: TabDefinition[] = [
  { tab: GameTab.Profile, label: 'Profile' },
  { tab: GameTab.Overworld, label: 'Overworld' },
  { tab: GameTab.Raids, label: 'Raids' },
  { tab: GameTab.Auctions, label: 'Auctions' },
];

/**
 * The signed-in view: the tabs, unless a battle has taken the page
 */
function GameView(props: { user: User }): JSX.Element {
  const game = useGame();

  return (
    <Show
      when={game.battle()}
      fallback={
        <TabGroup
          horizontal
          value={game.tab()}
          onChange={(value) => {
            if (value != null) {
              game.setTab(value);
            }
          }}
          toggleable={false}
          class="flex flex-col gap-4"
        >
          <TabBar>
            <For each={TABS}>
              {(definition) => <TabButton value={definition.tab}>{definition.label}</TabButton>}
            </For>
          </TabBar>
          <TabPanel value={GameTab.Profile}>
            <ProfileTab player={props.user.uid} />
          </TabPanel>
          <TabPanel value={GameTab.Overworld}>
            <OverworldTab />
          </TabPanel>
          <TabPanel value={GameTab.Raids}>
            <RaidsTab user={props.user} />
          </TabPanel>
          <TabPanel value={GameTab.Auctions}>
            <AuctionTab player={props.user.uid} />
          </TabPanel>
        </TabGroup>
      }
    >
      {(active) => <BattleView active={active()} />}
    </Show>
  );
}

export default function Home(): JSX.Element {
  const auth = useAuth();

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      <Title>Poketerra</Title>
      <Show
        when={auth.user()}
        fallback={
          <Show when={!auth.loading()} fallback={<Note>Loading session…</Note>}>
            {/* The whole of the game before signing in: what it is,
                and the one thing there is to do about it */}
            <div class="mx-auto flex w-full max-w-sm flex-col gap-4 py-10 text-center">
              <h1>Poketerra</h1>
              <Note>Sign in to walk the overworld.</Note>
              <LoginForm />
            </div>
          </Show>
        }
      >
        {(user) => (
          <GameProvider>
            <GameView user={user()} />
          </GameProvider>
        )}
      </Show>
    </main>
  );
}
