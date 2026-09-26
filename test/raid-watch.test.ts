import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RaidRecord } from '../src/auth/raid-record';

/**
 * A lobby watched the way every member watches it: the stream's own
 * changes are folded in, and only the first look and a reconnect read.
 */

type Listener = (payload: {
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}) => void;

const listeners = new Map<string, Listener>();
let subscribed: (status: string) => void = () => undefined;
let stored: Record<string, unknown> | null = null;
let reads = 0;

vi.mock('../src/auth/supabase', () => {
  const channel = {
    on(_kind: string, filter: { table: string }, listener: Listener) {
      listeners.set(filter.table, listener);
      return channel;
    },
    subscribe(callback: (status: string) => void) {
      subscribed = callback;
      return channel;
    },
  };
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => {
      reads += 1;
      return Promise.resolve({ data: stored == null ? null : structuredClone(stored) });
    },
  };

  return {
    default: () => ({
      channel: () => channel,
      from: () => query,
      removeChannel: async () => Promise.resolve(),
    }),
  };
});

const { watchRaid } = await import('../src/auth/raids');

const ROW = {
  id: 'lobby',
  kind: 0,
  lair: null,
  species: 150,
  trait_value: 1,
  host: 'host',
  battle_id: null,
  window_at: 1000,
  utc_offset: 0,
  chunk_seed: 'seed',
  chunk_x: 0,
  chunk_y: 0,
  biome: 1,
  cell: 3,
  cleared: false,
};

async function flush(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function send(table: string, eventType: string, row: Record<string, unknown>): void {
  listeners.get(table)?.({
    eventType,
    new: eventType === 'DELETE' ? {} : row,
    old: eventType === 'DELETE' ? row : {},
  });
}

describe('a watched lobby', () => {
  let seen: (RaidRecord | null)[];

  beforeEach(async () => {
    listeners.clear();
    reads = 0;
    seen = [];
    stored = { ...ROW, teams: [{ id: 'first', joined_seq: 1 }] };
    watchRaid('lobby', (raid) => {
      seen.push(raid);
    });
    subscribed('SUBSCRIBED');
    await flush();
  });

  it('reads once to begin with', () => {
    expect(reads).toBe(1);
    expect(seen.at(-1)?.teams).toEqual(['first']);
  });

  it('takes a joining and a leaving team from the stream without reading', () => {
    send('teams', 'INSERT', { id: 'second', raid_id: 'lobby', joined_seq: 2 });
    expect(seen.at(-1)?.teams).toEqual(['first', 'second']);

    send('teams', 'DELETE', { id: 'first' });
    expect(seen.at(-1)?.teams).toEqual(['second']);
    expect(reads).toBe(1);
  });

  it('keeps the teams in the order they joined, whatever order they arrive in', () => {
    send('teams', 'INSERT', { id: 'third', raid_id: 'lobby', joined_seq: 3 });
    send('teams', 'INSERT', { id: 'second', raid_id: 'lobby', joined_seq: 2 });

    expect(seen.at(-1)?.teams).toEqual(['first', 'second', 'third']);
  });

  it('takes the lobby row from the stream and keeps its teams', () => {
    send('raids', 'UPDATE', { ...ROW, battle_id: 'battle' });

    expect(seen.at(-1)?.battle).toBe('battle');
    expect(seen.at(-1)?.teams).toEqual(['first']);
    expect(reads).toBe(1);
  });

  it('is gone when its row is', () => {
    send('raids', 'DELETE', { id: 'lobby' });

    expect(seen.at(-1)).toBeNull();
  });

  it('reads again on a reconnect, which may have missed changes', async () => {
    stored = { ...ROW, teams: [{ id: 'other', joined_seq: 5 }] };
    subscribed('SUBSCRIBED');
    await flush();

    expect(reads).toBe(2);
    expect(seen.at(-1)?.teams).toEqual(['other']);
  });
});
