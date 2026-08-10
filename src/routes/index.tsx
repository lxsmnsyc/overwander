import { Title } from '@solidjs/meta';
import type { User } from 'firebase/auth';
import { For, type JSX, Show } from 'solid-js';
import { Tab, TabGroup, TabList, TabPanel } from 'terracotta';
import { useAuth } from '../auth/context';
import BattleView from '../components/BattleView';
import GameProvider, { GameTab, useGame } from '../components/game-context';
import LoginForm from '../components/LoginForm';
import OverworldTab from '../components/OverworldTab';
import ProfileTab from '../components/ProfileTab';
import RaidsTab from '../components/RaidsTab';
import WorldMapTab from '../components/WorldMapTab';

interface TabDefinition {
  tab: GameTab;
  label: string;
}

const TABS: TabDefinition[] = [
  { tab: GameTab.Profile, label: 'Profile' },
  { tab: GameTab.Overworld, label: 'Overworld' },
  { tab: GameTab.WorldMap, label: 'World Map' },
  { tab: GameTab.Raids, label: 'Raids' },
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
        >
          <TabList>
            <For each={TABS}>
              {(definition) => <Tab value={definition.tab}>{definition.label}</Tab>}
            </For>
          </TabList>
          <TabPanel value={GameTab.Profile}>
            <ProfileTab player={props.user.uid} />
          </TabPanel>
          <TabPanel value={GameTab.Overworld}>
            <OverworldTab />
          </TabPanel>
          <TabPanel value={GameTab.WorldMap}>
            <WorldMapTab />
          </TabPanel>
          <TabPanel value={GameTab.Raids}>
            <RaidsTab user={props.user} />
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
    <main>
      <Title>Poketerra</Title>
      <Show
        when={auth.user()}
        fallback={
          <Show when={!auth.loading()} fallback={<p>Loading session…</p>}>
            <h1>Poketerra</h1>
            <p>Sign in to walk the overworld.</p>
            <LoginForm />
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
