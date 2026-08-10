import { Title } from '@solidjs/meta';
import { For, type JSX, Show } from 'solid-js';
import { Tab, TabGroup, TabList, TabPanel } from 'terracotta';
import { useAuth } from '../auth/context';
import LoginForm from '../components/LoginForm';
import OverworldTab from '../components/OverworldTab';
import ProfileTab from '../components/ProfileTab';
import WorldMapTab from '../components/WorldMapTab';

const enum HomeTab {
  Profile = 0,
  Overworld = 1,
  WorldMap = 2,
  Raids = 3,
}

interface TabDefinition {
  tab: HomeTab;
  label: string;
  /**
   * Tabs whose feature does not exist yet stay unselectable rather
   * than opening on an empty panel
   */
  todo?: boolean;
}

const TABS: TabDefinition[] = [
  { tab: HomeTab.Profile, label: 'Profile' },
  { tab: HomeTab.Overworld, label: 'Overworld' },
  { tab: HomeTab.WorldMap, label: 'World Map' },
  { tab: HomeTab.Raids, label: 'Raids', todo: true },
];

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
          <TabGroup horizontal defaultValue={HomeTab.Profile} toggleable={false}>
            <TabList>
              <For each={TABS}>
                {(definition) => (
                  <Tab value={definition.tab} disabled={definition.todo}>
                    {definition.label}
                    {definition.todo ? ' (TODO)' : ''}
                  </Tab>
                )}
              </For>
            </TabList>
            <TabPanel value={HomeTab.Profile}>
              <ProfileTab player={user().uid} />
            </TabPanel>
            <TabPanel value={HomeTab.Overworld}>
              <OverworldTab />
            </TabPanel>
            <TabPanel value={HomeTab.WorldMap}>
              <WorldMapTab />
            </TabPanel>
          </TabGroup>
        )}
      </Show>
    </main>
  );
}
