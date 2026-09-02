import { describe, expect, it } from 'vitest';
import {
  ACTION_ORDER,
  DEFAULT_BINDS,
  type GameAction,
  type KeyBinds,
  actionOf,
  keyOf,
} from '../src/components/app/keys';

/**
 * What a key press means to the game.
 *
 * The four directions are the game's rather than the overworld's, so
 * the mapping is read off the player's own binds and the arrows are
 * kept out of them: somebody who has bound the letters to something
 * else still has somewhere to walk from.
 */

/** A press, as much of one as the mapping reads */
function press(key: string): KeyboardEvent {
  // The mapping only ever asks for `key`, which is what lets a plain
  // object stand in for an event the browser would have built
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { key } as KeyboardEvent;
}

describe('what a key does', () => {
  it('writes a letter down in lower case and everything else as it is named', () => {
    expect(keyOf(press('W'))).toBe('w');
    expect(keyOf(press('w'))).toBe('w');
    expect(keyOf(press('Enter'))).toBe('Enter');
    expect(keyOf(press('ArrowUp'))).toBe('ArrowUp');
  });

  it('walks with the arrows whatever the binds say', () => {
    const odd: KeyBinds = {
      up: 'i',
      down: 'k',
      left: 'j',
      right: 'l',
      interact: 'f',
      menu: 'g',
    };

    expect(actionOf(press('ArrowUp'), odd)).toBe('up');
    expect(actionOf(press('ArrowDown'), odd)).toBe('down');
    expect(actionOf(press('ArrowLeft'), odd)).toBe('left');
    expect(actionOf(press('ArrowRight'), odd)).toBe('right');
  });

  it('reads the bound keys, and nothing it was not given', () => {
    expect(actionOf(press('w'), DEFAULT_BINDS)).toBe('up');
    expect(actionOf(press('W'), DEFAULT_BINDS)).toBe('up');
    expect(actionOf(press('Enter'), DEFAULT_BINDS)).toBe('interact');
    expect(actionOf(press('z'), DEFAULT_BINDS)).toBeNull();
    expect(actionOf(press('Escape'), DEFAULT_BINDS)).toBeNull();
  });

  it('reads the menu key, which is bound like any other', () => {
    expect(actionOf(press('m'), DEFAULT_BINDS)).toBe('menu');
    expect(actionOf(press('M'), DEFAULT_BINDS)).toBe('menu');
    expect(actionOf(press('m'), { ...DEFAULT_BINDS, menu: 'q' })).toBeNull();
  });

  it('follows an action to whatever key it was moved to', () => {
    const moved: KeyBinds = { ...DEFAULT_BINDS, up: 'i' };

    expect(actionOf(press('i'), moved)).toBe('up');
    expect(actionOf(press('w'), moved)).toBeNull();
  });

  it('binds every action it offers, and offers every action it binds', () => {
    const bound = new Set<GameAction>(ACTION_ORDER);

    expect(bound.size).toBe(ACTION_ORDER.length);
    for (const action of ACTION_ORDER) {
      expect(bound.has(action), action).toBe(true);
      expect(DEFAULT_BINDS[action], action).not.toBe('');
    }
  });
});
