import { describe, expect, it } from 'vitest';
import { createStore } from '../../src/game/store';

describe('createStore', () => {
  it('reads what was set', () => {
    const store = createStore(1);

    store.set(2);
    expect(store.get()).toBe(2);
    store.update((value) => value + 3);
    expect(store.get()).toBe(5);
  });

  it('tells each listener about a change, and not about the current value', () => {
    const store = createStore('a');
    const heard: string[] = [];

    store.subscribe((value) => {
      heard.push(value);
    });
    expect(heard).toEqual([]);
    store.set('b');
    expect(heard).toEqual(['b']);
  });

  it('stays quiet when the value does not change', () => {
    const store = createStore({ x: 1 }, (one, two) => one.x === two.x);
    const heard: unknown[] = [];

    store.subscribe((value) => {
      heard.push(value);
    });
    store.set({ x: 1 });
    expect(heard).toEqual([]);
    store.set({ x: 2 });
    expect(heard).toEqual([{ x: 2 }]);
  });

  it('stops telling a listener once it unsubscribes', () => {
    const store = createStore(0);
    const heard: number[] = [];
    const unsubscribe = store.subscribe((value) => {
      heard.push(value);
    });

    store.set(1);
    unsubscribe();
    store.set(2);
    expect(heard).toEqual([1]);
  });

  it('tells every listener even when one unsubscribes another mid-change', () => {
    const store = createStore(0);
    const heard: string[] = [];
    let second = (): void => {};

    store.subscribe(() => {
      heard.push('first');
      second();
    });
    second = store.subscribe(() => {
      heard.push('second');
    });
    store.set(1);
    expect(heard).toEqual(['first', 'second']);
    store.set(2);
    expect(heard).toEqual(['first', 'second', 'first']);
  });
});
