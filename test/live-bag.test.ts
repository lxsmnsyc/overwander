import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The bag the browser keeps: read once, told what changed, and read
 * again only when it cannot be sure it has heard everything.
 */

type Heard = (message: { payload: Record<string, unknown> }) => void;

let heard: Heard = () => undefined;
let status: (state: string) => void = () => undefined;
let items: Record<string, unknown>[] = [];
let reads = 0;
let answer: () => Promise<void> = async () => Promise.resolve();

vi.mock('../src/auth/supabase', () => {
  const channel = {
    on(_kind: string, _filter: unknown, listener: Heard) {
      heard = listener;
      return channel;
    },
    subscribe(callback: (state: string) => void) {
      status = callback;
      return channel;
    },
  };

  return {
    default: () => ({
      channel: () => channel,
      removeChannel: async () => Promise.resolve(),
      from: (table: string) => ({
        select: () => ({
          eq: async () => {
            if (table === 'bag_items') {
              reads += 1;
              const rows = structuredClone(items);

              await answer();
              return { data: rows, error: null };
            }
            return { data: [], error: null };
          },
        }),
      }),
    }),
  };
});

const { default: readHeldBag } = await import('../src/auth/live-bag');
const { countServerCall } = await import('../src/utils/server-calls');

let player = 0;
let uid = '';

function said(operation: string, item: number, count: number | null): void {
  heard({
    payload: {
      operation,
      table: 'bag_items',
      record: count == null ? null : { player: uid, item, count },
      old_record: { player: uid, item },
    },
  });
}

describe('the kept bag', () => {
  beforeEach(async () => {
    // A new player each time, so every test starts on a fresh channel
    player += 1;
    uid = `player-${player}`;
    items = [{ item: 1, count: 5 }];
    reads = 0;
    answer = async () => Promise.resolve();
    await readHeldBag(uid);
    status('SUBSCRIBED');
    await readHeldBag(uid);
    reads = 0;
  });

  it('answers from the copy once it is listening', async () => {
    expect((await readHeldBag(uid)).items.get(1)).toBe(5);
    expect(reads).toBe(0);
  });

  it('takes what the channel says without reading', async () => {
    said('UPDATE', 1, 4);
    said('INSERT', 2, 1);
    said('DELETE', 1, null);

    const bag = await readHeldBag(uid);

    expect(bag.items.has(1)).toBe(false);
    expect(bag.items.get(2)).toBe(1);
    expect(reads).toBe(0);
  });

  it('reads again after a server call of its own', async () => {
    countServerCall();
    items = [{ item: 1, count: 4 }];

    expect((await readHeldBag(uid)).items.get(1)).toBe(4);
    expect(reads).toBe(1);
  });

  it('reads again after a reconnect, which may have missed changes', async () => {
    status('CHANNEL_ERROR');
    status('SUBSCRIBED');
    items = [{ item: 1, count: 9 }];

    expect((await readHeldBag(uid)).items.get(1)).toBe(9);
    expect(reads).toBe(1);
  });

  it('lays a change heard during a read over what the read brings back', async () => {
    countServerCall();
    // The read is answered from before the change and lands after it
    answer = async () => {
      // A message arrives on a later turn, never inside the call
      await Promise.resolve();
      said('UPDATE', 1, 2);
    };

    expect((await readHeldBag(uid)).items.get(1)).toBe(2);
  });
});
