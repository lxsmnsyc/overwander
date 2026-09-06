import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Battle from '../../src/battle/core';
import { BattleEvents } from '../../src/battle/events';
import { EventPriority } from '../../src/core/event-emitter';
import setupBattleMechanics from '../../src/battle/mechanics/battle';

/**
 * The frame timer behind a real-time fight.
 *
 * It is the one mechanic the harness leaves out, because it is the one
 * that drives itself. What it has to get right is what happens when a
 * frame does not arrive: a tab in the background is not painted, so
 * the frame that runs when the player comes back carries the whole
 * time away with it, and handing that to the engine plays out minutes
 * of fighting with nobody at the controls.
 */

const FRAME = 1000 / 60;

/** The page, as much of it as the timer reads */
interface Page {
  visibilityState: 'visible' | 'hidden';
  hasFocus: () => boolean;
  addEventListener: (name: string, handler: () => void) => void;
  removeEventListener: (name: string, handler: () => void) => void;
}

describe('the battle frame timer', () => {
  let now = 0;
  let paint: (() => void) | null = null;
  let listeners: Map<string, Set<() => void>>;
  let page: Page;

  /** Run the next frame the timer asked for */
  const frame = (after: number): void => {
    const next = paint;

    now += after;
    paint = null;
    next?.();
  };

  /** Tell the page something changed, the way the browser would */
  const announce = (name: string): void => {
    for (const handler of listeners.get(name) ?? []) {
      handler();
    }
  };

  beforeEach(() => {
    now = 1_000_000;
    paint = null;
    listeners = new Map();

    const bind = (name: string, handler: () => void): void => {
      const held = listeners.get(name) ?? new Set();

      held.add(handler);
      listeners.set(name, held);
    };
    const unbind = (name: string, handler: () => void): void => {
      listeners.get(name)?.delete(handler);
    };

    page = {
      visibilityState: 'visible',
      hasFocus: () => true,
      addEventListener: bind,
      removeEventListener: unbind,
    };

    vi.stubGlobal('document', page);
    vi.stubGlobal('addEventListener', bind);
    vi.stubGlobal('removeEventListener', unbind);
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
      paint = callback;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {
      paint = null;
    });
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** A bare battle with nothing but the timer on it, and its tick count */
  const timed = (): { battle: Battle; ticks: () => number } => {
    const battle = new Battle('clock');
    let counted = 0;

    setupBattleMechanics(battle);
    battle.on(BattleEvents.Tick, EventPriority.Post, () => {
      counted += 1;
    });
    return { battle, ticks: () => counted };
  };

  it('advances the fight a frame at a time while the page is watched', () => {
    const { battle, ticks } = timed();

    battle.start();
    frame(100);
    // A hundred milliseconds is six frames, give or take where the
    // sub-frame remainder falls
    expect(ticks()).toBeGreaterThan(0);
    expect(ticks()).toBeLessThanOrEqual(Math.ceil(100 / FRAME));
  });

  it('hands a stalled frame a moment, not the whole time it stalled for', () => {
    const { battle, ticks } = timed();

    battle.start();
    // A minute in one frame is what a backgrounded tab comes back
    // with. Played out whole it is a fight the player never saw
    frame(60_000);
    expect(ticks()).toBeLessThanOrEqual(Math.ceil(250 / FRAME));
    expect(ticks()).toBeGreaterThan(0);
  });

  it('holds while the tab is hidden, and does not replay the time away', () => {
    const { battle, ticks } = timed();

    battle.start();
    frame(100);

    const before = ticks();

    page.visibilityState = 'hidden';
    announce('visibilitychange');
    frame(30_000);
    expect(ticks()).toBe(before);

    page.visibilityState = 'visible';
    announce('visibilitychange');
    // The first frame back is a frame, not half a minute
    frame(16);
    expect(ticks() - before).toBeLessThanOrEqual(1);
  });

  it('holds while another window has the focus', () => {
    const { battle, ticks } = timed();

    battle.start();
    frame(100);

    const before = ticks();

    page.hasFocus = () => false;
    announce('blur');
    frame(5000);
    expect(ticks()).toBe(before);

    page.hasFocus = () => true;
    announce('focus');
    frame(100);
    // Going again, and only for the frame it was given
    expect(ticks()).toBeGreaterThan(before);
    expect(ticks() - before).toBeLessThanOrEqual(Math.ceil(100 / FRAME));
  });

  it('lets go of the page when the fight ends', () => {
    const { battle } = timed();

    battle.start();
    expect(listeners.get('visibilitychange')?.size).toBe(1);
    battle.end();
    expect(listeners.get('visibilitychange')?.size).toBe(0);
    expect(paint).toBeNull();
  });
});
