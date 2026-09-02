import { createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import { asNumber, asRecord, asString } from '../../auth/__normalize';
import { BALL_ITEMS, Balls } from '../../data/ids/items';
import { ACTION_ORDER, DEFAULT_BINDS, type KeyBinds } from './keys';

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
  /**
   * Whether the ball goes on being the ball. On, a meeting opens on
   * whatever was last thrown; off, every one of them opens on a Poke
   * Ball and the player picks again
   */
  keepBall: boolean;
  /**
   * Which ball that was. Remembered rather than chosen: nothing in the
   * settings panel sets it, the last throw does, and it is kept even
   * while `keepBall` is off so that turning it on picks up where the
   * player left off
   */
  lastBall: Balls;
  /**
   * Which key does what in the world. The arrows are not in here: they
   * always walk, so a player who has bound the letters to something
   * else still has somewhere to walk from
   */
  keys: KeyBinds;
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
    keepBall: true,
    lastBall: Balls.PokeBall,
    keys: { ...DEFAULT_BINDS },
    sound: 0.7,
    music: 0.5,
  };
}

function oneOf<V extends string>(value: unknown, allowed: readonly V[], fallback: V): V {
  const said = asString(value);

  return allowed.find((option) => option === said) ?? fallback;
}

/**
 * A ball that is one of the balls. A stored number can be anything,
 * including one from a version of the game that had a ball this one
 * does not
 */
function ballOf(value: unknown, fallback: Balls): Balls {
  const said = asNumber(value, fallback);

  return Object.hasOwn(BALL_ITEMS, said) ? said : fallback;
}

/**
 * The binds as they were left, one action at a time. A stored key can
 * be anything, including nothing and including an action this version
 * no longer has, so each falls back on its own
 */
function bindsOf(value: unknown): KeyBinds {
  const said = asRecord(value);
  const binds = { ...DEFAULT_BINDS };

  for (const action of ACTION_ORDER) {
    const bound = asString(said[action]);

    if (bound !== '') {
      binds[action] = bound;
    }
  }
  return binds;
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
      keepBall: typeof said.keepBall === 'boolean' ? said.keepBall : base.keepBall,
      lastBall: ballOf(said.lastBall, base.lastBall),
      keys: bindsOf(said.keys),
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
