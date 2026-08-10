import { type JSX, Show, createResource } from 'solid-js';
import { Tab, TabGroup, TabList, TabPanel } from 'terracotta';
import { resolveBuddy } from '../auth/buddy';
import { getProfile } from '../auth/profile';
import { getSpeciesData } from '../data/species';
import BattleHistory from './BattleHistory';
import CatchesList from './CatchesList';
import InventoryList from './InventoryList';

const enum InnerTab {
  Catches = 0,
  Inventory = 1,
  Battles = 2,
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
  const [profile] = createResource(() => props.player, getProfile);
  const [buddy] = createResource(() => props.player, resolveBuddy);

  return (
    <section>
      <h2>Profile</h2>
      <Show when={!profile.loading} fallback={<p>Loading profile…</p>}>
        <Show when={profile()} fallback={<p>No profile yet.</p>}>
          {(loaded) => (
            <>
              <Show when={loaded().avatar}>
                {(avatar) => <img src={avatar()} alt="Avatar" width={64} height={64} />}
              </Show>
              <dl>
                <dt>Nickname</dt>
                <dd>{loaded().nickname}</dd>
                <dt>Player id</dt>
                <dd>{props.player}</dd>
                <dt>Gold</dt>
                <dd>{loaded().gold}</dd>
                <dt>Buddy</dt>
                <dd>
                  <Show when={buddy()} fallback="None">
                    {(pair) => `${getSpeciesData(pair()[1].species).name} · Lv. ${pair()[1].level}`}
                  </Show>
                </dd>
              </dl>
            </>
          )}
        </Show>
      </Show>

      <TabGroup horizontal defaultValue={InnerTab.Catches} toggleable={false}>
        <TabList>
          <Tab value={InnerTab.Catches}>Catches</Tab>
          <Tab value={InnerTab.Inventory}>Inventory</Tab>
          <Tab value={InnerTab.Battles}>Battles</Tab>
        </TabList>
        <TabPanel value={InnerTab.Catches}>
          <h3>Catches</h3>
          <CatchesList player={props.player} />
        </TabPanel>
        <TabPanel value={InnerTab.Inventory}>
          <h3>Inventory</h3>
          <InventoryList player={props.player} />
        </TabPanel>
        <TabPanel value={InnerTab.Battles}>
          <h3>Battles</h3>
          <BattleHistory player={props.player} />
        </TabPanel>
      </TabGroup>
    </section>
  );
}
