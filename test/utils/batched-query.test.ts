import { describe, expect, it } from 'vitest';
import batchedQuery from '../../src/utils/batched-query';

/** A read that squares every number it is handed, remembering each batch */
function squares(fail: (queries: number[]) => boolean = () => false): {
  read: (query: number) => Promise<number>;
  batches: number[][];
} {
  const batches: number[][] = [];
  const read = batchedQuery(
    async (queries: number[]) => {
      // Settles on a later tick, as a real read would
      await Promise.resolve();
      batches.push(queries);
      if (fail(queries)) {
        throw new Error(`refused ${queries.join(',')}`);
      }
      const answers = new Map<number, number>();

      for (const query of queries) {
        answers.set(query, query * query);
      }
      return answers;
    },
    (answers, query) => answers.get(query) ?? Number.NaN,
    { limit: 2 },
  );

  return { read, batches };
}

describe('batchedQuery', () => {
  it('answers calls made together with one read, each with its own answer', async () => {
    const { read, batches } = squares();

    expect(await Promise.all([read(2), read(3)])).toEqual([4, 9]);
    expect(batches).toEqual([[2, 3]]);
  });

  it('reads a key asked for twice only once', async () => {
    const { read, batches } = squares();

    expect(await Promise.all([read(2), read(2), read(3)])).toEqual([4, 4, 9]);
    expect(batches).toEqual([[2, 3]]);
  });

  it('splits more distinct keys than the limit across reads', async () => {
    const { read, batches } = squares();

    expect(await Promise.all([read(1), read(2), read(3)])).toEqual([1, 4, 9]);
    expect(batches).toEqual([[1, 2], [3]]);
  });

  it('rejects only the callers of the read that failed', async () => {
    const { read } = squares((queries) => queries.includes(3));
    const answers = await Promise.allSettled([read(1), read(2), read(3)]);

    expect(answers[0]).toEqual({ status: 'fulfilled', value: 1 });
    expect(answers[1]).toEqual({ status: 'fulfilled', value: 4 });
    expect(answers[2].status).toBe('rejected');
  });

  it('starts a fresh read for calls made after the last one went out', async () => {
    const { read, batches } = squares();

    expect(await read(2)).toBe(4);
    expect(await read(2)).toBe(4);
    expect(batches).toEqual([[2], [2]]);
  });

  it('matches object queries by the key it is given', async () => {
    const seen: string[][] = [];
    const read = batchedQuery(
      async (queries: { id: string }[]) => {
        const ids: string[] = [];

        await Promise.resolve();
        for (const query of queries) {
          ids.push(query.id);
        }
        seen.push(ids);
        return ids;
      },
      (ids, _query, index) => ids[index],
      { key: (query) => query.id },
    );

    expect(await Promise.all([read({ id: 'a' }), read({ id: 'a' })])).toEqual(['a', 'a']);
    expect(seen).toEqual([['a']]);
  });
});
