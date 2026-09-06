import { describe, expect, it } from 'vitest';
import LRUMap from '../src/core/lru-map';

/**
 * The map that forgets what it has not used lately.
 *
 * What it has to get right is the order: the list is what decides
 * which key goes when the limit is reached, and a list that loses a
 * pointer drops the wrong one or leaks the node it was pointing at.
 * So every case below reads the order back through iteration, which
 * walks the list rather than the map underneath it.
 */

/** The keys as the list holds them, newest first */
const order = <K, V>(held: LRUMap<K, V>): K[] => [...held.keys()];

describe('an LRU map', () => {
  it('holds what a map holds, and answers the same way', () => {
    const held = new LRUMap<string, number>(10);

    expect(held.size).toBe(0);
    held.set('a', 1).set('b', 2);
    expect(held.size).toBe(2);
    expect(held.get('a')).toBe(1);
    expect(held.get('nobody')).toBeUndefined();
    expect(held.has('b')).toBe(true);
    expect(held.has('nobody')).toBe(false);
    expect(held.delete('b')).toBe(true);
    expect(held.delete('b')).toBe(false);
    expect(held.size).toBe(1);
    held.clear();
    expect(held.size).toBe(0);
    expect(order(held)).toEqual([]);
  });

  it('iterates newest first, not in the order things were put in', () => {
    const held = new LRUMap<string, number>(10);

    held.set('a', 1).set('b', 2).set('c', 3);
    expect(order(held)).toEqual(['c', 'b', 'a']);
    expect([...held.values()]).toEqual([3, 2, 1]);
    expect([...held]).toEqual([
      ['c', 3],
      ['b', 2],
      ['a', 1],
    ]);
  });

  it('counts a read as a use and a check as nothing', () => {
    const held = new LRUMap<string, number>(10);

    held.set('a', 1).set('b', 2).set('c', 3);
    held.get('a');
    expect(order(held)).toEqual(['a', 'c', 'b']);
    // Asking whether it is there is not using it
    held.has('b');
    expect(order(held)).toEqual(['a', 'c', 'b']);
  });

  it('moves a key to the front when it is written again, without growing', () => {
    const held = new LRUMap<string, number>(10);

    held.set('a', 1).set('b', 2);
    held.set('a', 9);
    expect(held.size).toBe(2);
    expect(held.get('a')).toBe(9);
    expect(order(held)).toEqual(['a', 'b']);
  });

  it('drops the tail once it is full, and says which went', () => {
    const gone: [string, number][] = [];
    const held = new LRUMap<string, number>(3, (key, value) => {
      gone.push([key, value]);
    });

    held.set('a', 1).set('b', 2).set('c', 3);
    expect(gone).toEqual([]);
    held.set('d', 4);
    expect(gone).toEqual([['a', 1]]);
    expect(order(held)).toEqual(['d', 'c', 'b']);
    expect(held.has('a')).toBe(false);
    expect(held.size).toBe(3);
  });

  it('keeps what is being used and drops what is not', () => {
    const held = new LRUMap<string, number>(3);

    held.set('a', 1).set('b', 2).set('c', 3);
    // Walking back to `a` is what saves it: `b` is now the stalest
    held.get('a');
    held.set('d', 4);
    expect(held.has('a')).toBe(true);
    expect(held.has('b')).toBe(false);
    expect(order(held)).toEqual(['d', 'a', 'c']);
  });

  it('says nothing about a key the caller took itself', () => {
    const gone: string[] = [];
    const held = new LRUMap<string, number>(3, (key) => {
      gone.push(key);
    });

    held.set('a', 1).set('b', 2);
    held.delete('a');
    held.clear();
    expect(gone).toEqual([]);
  });

  it('unlinks from the middle, the front and the back alike', () => {
    const held = new LRUMap<string, number>(10);

    // Newest first, so the list reads c, b, a
    held.set('a', 1).set('b', 2).set('c', 3);
    held.delete('b');
    expect(order(held)).toEqual(['c', 'a']);
    held.delete('c');
    expect(order(held)).toEqual(['a']);
    held.delete('a');
    expect(order(held)).toEqual([]);
    // And the ends were let go of with it: the next write starts a
    // fresh chain rather than pointing at what was dropped
    held.set('d', 4);
    expect(order(held)).toEqual(['d']);
  });

  it('walks the whole chain while a caller deletes as it goes', () => {
    const held = new LRUMap<string, number>(10);

    held.set('a', 1).set('b', 2).set('c', 3).set('d', 4);

    const seen: string[] = [];

    for (const key of held.keys()) {
      seen.push(key);
      if (key === 'c' || key === 'd') {
        held.delete(key);
      }
    }
    expect(seen).toEqual(['d', 'c', 'b', 'a']);
    expect(order(held)).toEqual(['b', 'a']);
  });

  it('builds a missing value once and uses a held one', () => {
    const held = new LRUMap<string, number>(10);
    let built = 0;

    expect(held.getOrInsert('a', 1)).toBe(1);
    expect(held.getOrInsert('a', 2)).toBe(1);
    expect(
      held.getOrInsertComputed('b', () => {
        built += 1;
        return 7;
      }),
    ).toBe(7);
    expect(
      held.getOrInsertComputed('b', () => {
        built += 1;
        return 8;
      }),
    ).toBe(7);
    expect(built).toBe(1);
    // Both count as a use, so `b` is in front
    expect(order(held)).toEqual(['b', 'a']);
  });

  it('holds at least one however small a limit it is given', () => {
    const held = new LRUMap<string, number>(0);

    held.set('a', 1).set('b', 2);
    expect(held.size).toBe(1);
    expect(order(held)).toEqual(['b']);
  });

  it('hands forEach the value, the key and itself, newest first', () => {
    const held = new LRUMap<string, number>(10);
    const seen: [string, number][] = [];

    held.set('a', 1).set('b', 2);
    held.forEach((value, key, map) => {
      expect(map).toBe(held);
      seen.push([key, value]);
    });
    expect(seen).toEqual([
      ['b', 2],
      ['a', 1],
    ]);
  });
});
