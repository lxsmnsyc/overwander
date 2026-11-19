import type * as Solid from 'solid-js';
import { describe, expect, it, vi } from 'vitest';

// The suite runs on the server build of Solid, where effects never
// apply and so a load never starts. The browser build is the one a
// load runs under, so this file reads that one
vi.mock('solid-js', async () =>
  vi.importActual<typeof Solid>('../../node_modules/solid-js/dist/solid.js'),
);

const { createRoot, createSignal, flush } = await import('solid-js');
const { createLoad } = await import('../../src/components/app/create-load');

/** Lets the pending fetches settle and the writes they make land */
async function settle(): Promise<void> {
  for (let round = 0; round < 3; round++) {
    await Promise.resolve();
    flush();
  }
}

/** A fetch whose answers are let go by hand, counting how often it is asked */
function createGate(): {
  asked: string[];
  fetch: (key: string) => Promise<string>;
  answer: (value: string) => void;
  fail: (error: Error) => void;
} {
  const asked: string[] = [];
  let resolve: ((value: string) => void) | undefined;
  let reject: ((error: Error) => void) | undefined;

  return {
    asked,
    fetch: async (key) => {
      asked.push(key);
      return new Promise<string>((done, refuse) => {
        resolve = done;
        reject = refuse;
      });
    },
    answer: (value) => {
      resolve?.(value);
    },
    fail: (error) => {
      reject?.(error);
    },
  };
}

/** A fetch that keeps one resolver per key, so answers can land out of order */
function createKeyedGate(): {
  asked: string[];
  fetch: (key: string) => Promise<string>;
  answer: (key: string, value: string) => void;
} {
  const asked: string[] = [];
  const waiting = new Map<string, (value: string) => void>();

  return {
    asked,
    fetch: async (key) => {
      asked.push(key);
      return new Promise<string>((done) => {
        waiting.set(key, done);
      });
    },
    answer: (key, value) => {
      waiting.get(key)?.(value);
    },
  };
}

describe('createLoad', () => {
  it('answers, keeps the answer while a new key loads, and asks once per key', async () => {
    const gate = createGate();

    await createRoot(async (dispose) => {
      const [key, setKey] = createSignal('a');
      const load = createLoad(key, gate.fetch);

      flush();
      expect(load.latest()).toBeUndefined();
      expect(gate.asked).toEqual(['a']);

      gate.answer('first');
      await settle();
      expect(load.latest()).toBe('first');

      setKey('b');
      flush();
      expect(gate.asked).toEqual(['a', 'b']);
      expect(load.latest()).toBe('first');

      gate.answer('second');
      await settle();
      expect(load.latest()).toBe('second');

      // The same key again asks nothing
      setKey('b');
      flush();
      expect(gate.asked).toEqual(['a', 'b']);
      dispose();
    });
  });

  it('asks the same key again on refresh', async () => {
    const gate = createGate();

    await createRoot(async (dispose) => {
      const load = createLoad(() => 'a', gate.fetch);

      flush();
      gate.answer('first');
      await settle();

      load.refresh();
      flush();
      expect(gate.asked).toEqual(['a', 'a']);
      expect(load.latest()).toBe('first');

      gate.answer('again');
      await settle();
      expect(load.latest()).toBe('again');
      dispose();
    });
  });

  it('says a failure and clears the answer until the next one lands', async () => {
    const gate = createGate();

    await createRoot(async (dispose) => {
      const load = createLoad(() => 'a', gate.fetch);

      flush();
      gate.answer('first');
      await settle();

      load.refresh();
      flush();
      gate.fail(new Error('refused'));
      await settle();
      expect(load.errored()).toBe(true);
      expect(load.latest()).toBeUndefined();

      load.refresh();
      flush();
      gate.answer('back');
      await settle();
      expect(load.errored()).toBe(false);
      expect(load.failed()).toBeNull();
      expect(load.latest()).toBe('back');
      dispose();
    });
  });

  it('asks nothing for an empty key', () => {
    const gate = createGate();

    createRoot((dispose) => {
      createLoad(() => null, gate.fetch);
      flush();
      expect(gate.asked).toEqual([]);
      dispose();
    });
  });

  it('drops an answer to a key since replaced', async () => {
    const gate = createKeyedGate();

    await createRoot(async (dispose) => {
      const [key, setKey] = createSignal('a');
      const load = createLoad(key, gate.fetch);

      flush();
      await settle();
      setKey('b');
      flush();
      expect(gate.asked).toEqual(['a', 'b']);

      gate.answer('b', 'answer-b');
      await settle();
      gate.answer('a', 'answer-a');
      await settle();
      expect(load.latest()).toBe('answer-b');
      dispose();
    });
  });

  it('drops an answer that lands after disposal, and asks nothing more', async () => {
    const gate = createKeyedGate();
    const [key, setKey] = createSignal('a');
    let load: ReturnType<typeof createLoad<string, string>> | undefined;
    let dispose: (() => void) | undefined;

    createRoot((done) => {
      load = createLoad(key, gate.fetch);
      dispose = done;
    });
    flush();
    await settle();
    dispose?.();

    gate.answer('a', 'late');
    await settle();
    expect(load?.latest()).toBeUndefined();

    setKey('b');
    await settle();
    expect(gate.asked).toEqual(['a']);
  });
});
