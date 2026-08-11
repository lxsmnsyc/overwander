import {
  type Accessor,
  type JSX,
  type ParentProps,
  type Setter,
  createContext,
  createSignal,
  useContext,
} from 'solid-js';
/**
 * The panels the signed-in view can be showing
 */
export const enum GameTab {
  Profile = 0,
  Overworld = 1,
  WorldMap = 2,
  Raids = 3,
  Auctions = 4,
}

/**
 * A battle the player is watching. A raid battle settles the raid it
 * was fought for and a Team Rocket fight settles its stop; a replay
 * settles nothing — it re-runs a finished battle from its seed and
 * frozen teams for the record alone
 */
export interface ActiveBattle {
  id: string;
  replay: boolean;
  /**
   * The raid the battle belongs to, for a raid battle
   */
  raid?: string;
  /**
   * The Team Rocket stop the battle was accepted at
   */
  rocket?: string;
}

/**
 * Something won and not yet collected: the overworld turns it into a
 * safari encounter the next time the player is standing there.
 *
 * Nothing about the prize travels in it — the species, the level,
 * whether it is shadowed, the chunk and window it comes from are all
 * read off the raid or the stop when it is claimed
 */
export type PendingReward = { raid: string; stop?: undefined } | { stop: string; raid?: undefined };

export interface GameState {
  tab: Accessor<GameTab>;
  setTab: Setter<GameTab>;
  /**
   * The raid lobby the player is in, shown inside the Raids tab
   */
  raid: Accessor<string | null>;
  setRaid: Setter<string | null>;
  /**
   * The battle in progress. While one is set, it takes the whole
   * page — tabs and all
   */
  battle: Accessor<ActiveBattle | null>;
  setBattle: Setter<ActiveBattle | null>;
  reward: Accessor<PendingReward | null>;
  setReward: Setter<PendingReward | null>;
}

const GameContext = createContext<GameState>();

export function useGame(): GameState {
  const state = useContext(GameContext);

  if (state == null) {
    throw new Error('useGame must be used inside GameProvider');
  }
  return state;
}

/**
 * Where the signed-in player is: which tab, which raid lobby, and
 * whether a battle has taken over the page. It lives above the tabs
 * because the overworld opens lobbies the Raids tab shows, and both
 * raids and replays open battles that replace everything
 */
export default function GameProvider(props: ParentProps): JSX.Element {
  const [tab, setTab] = createSignal(GameTab.Profile);
  const [raid, setRaid] = createSignal<string | null>(null);
  const [battle, setBattle] = createSignal<ActiveBattle | null>(null);
  const [reward, setReward] = createSignal<PendingReward | null>(null);

  return (
    <GameContext.Provider
      value={{ tab, setTab, raid, setRaid, battle, setBattle, reward, setReward }}
    >
      {props.children}
    </GameContext.Provider>
  );
}
