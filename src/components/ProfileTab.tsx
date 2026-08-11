import { type JSX, Show, createResource, from } from 'solid-js';
import { Tab, TabGroup, TabList, TabPanel } from 'terracotta';
import { resolveBuddy } from '../auth/buddy';
import { type Profile, watchProfile } from '../auth/profile';
import { isEgg } from '../auth/egg';
import { getSpeciesData } from '../data/species';
import BattleHistory from './BattleHistory';
import BidsList from './BidsList';
import CatchesList from './CatchesList';
import InventoryList from './InventoryList';

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

  return (
    <section>
      <h2>Profile</h2>
      <Show when={profile()} fallback={<p>Loading profile…</p>}>
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
                  {/* An egg walks along without saying what it is */}
                  {(pair) =>
                    isEgg(pair()[1])
                      ? `Egg · ${pair()[1].steps} / ${pair()[1].hatchSteps} steps`
                      : `${getSpeciesData(pair()[1].species).name} · Lv. ${pair()[1].level}`
                  }
                </Show>
              </dd>
            </dl>
          </>
        )}
      </Show>

      <TabGroup horizontal defaultValue={InnerTab.Catches} toggleable={false}>
        <TabList>
          <Tab value={InnerTab.Catches}>Catches</Tab>
          <Tab value={InnerTab.Inventory}>Inventory</Tab>
          <Tab value={InnerTab.Battles}>Battles</Tab>
          <Tab value={InnerTab.Bids}>Bids</Tab>
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
        {/* What the player has bid on, which lots they are still
            leading, and which they won and have not collected */}
        <TabPanel value={InnerTab.Bids}>
          <h3>Bids</h3>
          <BidsList player={props.player} />
        </TabPanel>
      </TabGroup>
    </section>
  );
}
