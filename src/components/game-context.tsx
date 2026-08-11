import {
  type Accessor,
  type JSX,
  type ParentProps,
  type Setter,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js';
import { useAuth } from '../auth/context';
import type { PositionRecord } from '../auth/position-record';
import { getPosition, savePosition } from '../auth/positions';
import getWorld from '../overworld/current';
import pickStartPosition, { type StartPosition } from '../overworld/start';
/**
 * The panels the signed-in view can be showing
 */
export const enum GameTab {
  Profile = 0,
  Overworld = 1,
  Raids = 2,
  Auctions = 3,
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
   * Where the player is standing, or null while it is still being
   * found out.
   *
   * It lives above the tabs because more than one of them needs it and
   * only one of them can be mounted: a tab panel unmounts when it is
   * left, so a position kept inside the Overworld tab would be unknown
   * to the World Map until the player had visited the Overworld first.
   * It is read once here, and the Overworld publishes every step back
   * to it
   */
  position: Accessor<PositionRecord | null>;
  setPosition: Setter<PositionRecord | null>;
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
  const auth = useAuth();
  const [tab, setTab] = createSignal(GameTab.Profile);
  const [position, setPosition] = createSignal<PositionRecord | null>(null);

  // Where they left off, or — for somebody who has never walked
  // anywhere — somewhere random in the starting region, written down
  // at once so the dice are rolled for them exactly once
  createEffect(() => {
    const user = auth.user();

    if (user == null || position() != null) {
      return;
    }

    let cancelled = false;

    const place = (at: PositionRecord | StartPosition, store: boolean): void => {
      if (cancelled) {
        return;
      }
      setPosition({
        player: user.uid,
        chunkX: at.chunkX,
        chunkY: at.chunkY,
        cellX: at.cellX,
        cellY: at.cellY,
        movedAt: 'movedAt' in at ? at.movedAt : 0,
      });

      if (store) {
        savePosition(at.chunkX, at.chunkY, at.cellX, at.cellY).catch(() => {
          // A first position that did not save is a walk that will
          // save it: nothing here is worth interrupting a sign-in for
        });
      }
    };

    getPosition(user.uid)
      .then((stored) => {
        if (stored != null) {
          place(stored, false);
          return;
        }
        place(pickStartPosition(getWorld(), `${user.uid}:${Date.now()}:${Math.random()}`), true);
      })
      .catch(() => {
        // Their position could not be read, which is no reason to keep
        // them out of the world. Nothing is written for it either: a
        // save on top of a failed read could move somebody whose real
        // record was there all along
        place(pickStartPosition(getWorld(), `${user.uid}:${Date.now()}:${Math.random()}`), false);
      });

    onCleanup(() => {
      cancelled = true;
    });
  });
  const [raid, setRaid] = createSignal<string | null>(null);
  const [battle, setBattle] = createSignal<ActiveBattle | null>(null);
  const [reward, setReward] = createSignal<PendingReward | null>(null);

  return (
    <GameContext.Provider
      value={{
        tab,
        setTab,
        position,
        setPosition,
        raid,
        setRaid,
        battle,
        setBattle,
        reward,
        setReward,
      }}
    >
      {props.children}
    </GameContext.Provider>
  );
}
