import { describe, expect, it } from 'vitest';
import { type Kept, mergeBox, staleIn } from '../src/auth/box';
import { type CaughtPokemon, asCaughtPokemon } from '../src/auth/caught-record';
import { trafficPath } from '../src/auth/traffic';
import { Species } from '../src/data/ids/species';

function catchOf(owner: string, level: number): CaughtPokemon {
  return asCaughtPokemon({ owner, species: Species.Bulbasaur, level });
}

function held(entries: [string, number, number][]): Map<string, Kept> {
  const box = new Map<string, Kept>();

  for (const [id, revision, level] of entries) {
    box.set(id, { revision, caught: catchOf('me', level) });
  }
  return box;
}

function ids(box: [string, CaughtPokemon][]): string[] {
  const found: string[] = [];

  for (const [id] of box) {
    found.push(id);
  }
  return found;
}

describe('a kept box', () => {
  it('reads everything the first time', () => {
    expect(
      staleIn(new Map(), [
        ['a', 0],
        ['b', 3],
      ]),
    ).toEqual(['a', 'b']);
  });

  it('reads again only what is new or changed', () => {
    const box = held([
      ['a', 0, 5],
      ['b', 3, 5],
    ]);

    expect(
      staleIn(box, [
        ['a', 0],
        ['b', 4],
        ['c', 0],
      ]),
    ).toEqual(['b', 'c']);
  });

  it('reads nothing when nothing moved', () => {
    expect(staleIn(held([['a', 2, 5]]), [['a', 2]])).toEqual([]);
  });

  it('takes the fresh copy of what changed and keeps the rest', () => {
    const box = held([
      ['a', 0, 5],
      ['b', 3, 5],
    ]);
    const merged = mergeBox(
      'me',
      box,
      [
        ['a', 0],
        ['b', 4],
      ],
      ['b'],
      [['b', 4, catchOf('me', 9)]],
    );

    expect(ids(merged.box)).toEqual(['a', 'b']);
    expect(merged.box[1][1].level).toBe(9);
    expect(merged.keep.get('b')?.revision).toBe(4);
    expect(merged.keep.get('a')).toBe(box.get('a'));
  });

  it('drops what is no longer listed', () => {
    const merged = mergeBox(
      'me',
      held([
        ['a', 0, 5],
        ['gone', 1, 5],
      ]),
      [['a', 0]],
      [],
      [],
    );

    expect(ids(merged.box)).toEqual(['a']);
    expect(merged.keep.has('gone')).toBe(false);
  });

  it('drops a changed catch that did not come back, or came back as somebody else’s', () => {
    const merged = mergeBox(
      'me',
      held([
        ['released', 0, 5],
        ['traded', 0, 5],
      ]),
      [
        ['released', 1],
        ['traded', 1],
      ],
      ['released', 'traded'],
      [['traded', 2, catchOf('them', 5)]],
    );

    expect(merged.box).toEqual([]);
    expect(merged.keep.size).toBe(0);
  });
});

describe('measured traffic', () => {
  it('is named by table or function rather than by the whole address', () => {
    expect(trafficPath('http://127.0.0.1:54321/rest/v1/caught?select=id&owner=eq.me')).toBe(
      'caught',
    );
    expect(trafficPath('https://x.supabase.co/rest/v1/rpc/save_position')).toBe(
      'rpc/save_position',
    );
    expect(trafficPath('https://x.supabase.co/auth/v1/token')).toBe('token');
  });
});
