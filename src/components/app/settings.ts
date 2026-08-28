import { createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import { asNumber, asRecord, asString } from '../../auth/__normalize';

/**
 * How this player has set the game up on this machine.
 *
 * None of it is account data: two browsers signed in as the same player
 * disagree about it, and the server never sees any of it. That is what
 * makes it a module signal rather than something under `src/auth` and
 * rather than a context, so anything at all can read it, canvas code
 * included.
 *
 * The theme is the one setting that is *not* here. Terracotta owns it,
 * along with the no-flash script in `entry-server.tsx` that reads its
 * key before the page paints.
 */

/** Where the whole lot is remembered, as one JSON object */
const STORAGE_KEY = 'overwander:settings';

export type ClockFormat = '24h' | '12h';

/** What the menu bar says about the hour the world is in */
export type WorldTimeFace = 'period' | 'clock';

export type BoxColumns = 5 | 6 | 8;

export interface GameSettings {
  /**
   * Whether the decoration holds still: transitions, the fades a dialog
   * opens on, and the idle a pokemon breathes at. What the player is
   * doing still moves, since a world that cannot be walked through is
   * not a setting
   */
  reduceMotion: boolean;
  clock: ClockFormat;
  worldTime: WorldTimeFace;
  /** How wide the pokemon box is drawn, in squares */
  boxColumns: BoxColumns;
  /** Both 0 to 1 */
  sound: number;
  music: number;
}

/**
 * What a machine that has never been asked is set to. Reduced motion
 * is the machine's own answer rather than ours: somebody who has
 * turned it on system-wide has already said it once
 */
function defaults(): GameSettings {
  return {
    reduceMotion: !isServer && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches,
    clock: '24h',
    worldTime: 'period',
    boxColumns: 6,
    sound: 0.7,
    music: 0.5,
  };
}

function oneOf<V extends string>(value: unknown, allowed: readonly V[], fallback: V): V {
  const said = asString(value);

  return allowed.find((option) => option === said) ?? fallback;
}

/** A volume, clamped: a stored value can be anything at all */
function volume(value: unknown, fallback: number): number {
  const said = asNumber(value, fallback);

  return Number.isFinite(said) ? Math.min(1, Math.max(0, said)) : fallback;
}

function stored(): GameSettings {
  const base = defaults();

  if (isServer) {
    return base;
  }

  try {
    const held = localStorage.getItem(STORAGE_KEY);

    if (held == null) {
      return base;
    }

    const said = asRecord(JSON.parse(held) as unknown);
    const columns = asNumber(said.boxColumns);

    return {
      reduceMotion: said.reduceMotion === true,
      clock: oneOf(said.clock, ['24h', '12h'] as const, base.clock),
      worldTime: oneOf(said.worldTime, ['period', 'clock'] as const, base.worldTime),
      boxColumns: columns === 5 || columns === 8 ? columns : base.boxColumns,
      sound: volume(said.sound, base.sound),
      music: volume(said.music, base.music),
    };
  } catch {
    // Unreadable or refused storage is a machine that has not been
    // asked, which is what the defaults are for
    return base;
  }
}

const [settings, write] = createSignal<GameSettings>(defaults());

/** How this player has the game set up. Read it; change it with `setSetting` */
export default settings;

export function setSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
  const next = { ...settings(), [key]: value };

  write(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A browser refusing storage still gets the change this session
  }
}

/**
 * Take what was remembered. Called once from the client entry, after
 * hydration: reading storage while the page is being matched against
 * the server's markup is what makes the two disagree
 */
export function loadSettings(): void {
  write(stored());
}
