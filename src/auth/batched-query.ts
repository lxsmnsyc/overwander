/**
 * Many single-key reads made in the same moment, answered by one read of
 * all their keys.
 *
 * The queue belongs to the module, so on the server it gathers calls from
 * concurrent requests too. Never use it inside a transaction: the read runs
 * a moment later on another connection, without the transaction's locks or
 * writes. Where it belongs: `.agents/skills/batched-queries/SKILL.md`.
 */

export interface BatchOptions<Query> {
  /**
   * What makes two queries the same read. Defaults to the query itself, so
   * an object query needs one unless callers share the same object
   */
  key?: (query: Query) => unknown;
  /** The most distinct queries one read is handed; the rest go to further reads */
  limit?: number;
  /** How long calls are gathered for, in milliseconds */
  wait?: number;
}

interface Caller<Return> {
  resolve: (value: Return) => void;
  reject: (reason: unknown) => void;
}

interface Slot<Query, Return> {
  query: Query;
  callers: Caller<Return>[];
}

interface Waiting<Query, Return> extends Caller<Return> {
  query: Query;
}

export default function batchedQuery<Query, Data, Return>(
  callback: (queries: Query[]) => Promise<Data>,
  lookup: (data: Data, query: Query, index: number) => Return,
  options: BatchOptions<Query> = {},
): (query: Query) => Promise<Return> {
  const keyOf = options.key ?? ((query: Query): unknown => query);
  const size = Math.max(1, Math.floor(options.limit ?? Number.POSITIVE_INFINITY));
  let waiting: Waiting<Query, Return>[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  // A failed read rejects only the callers it was reading for, and a lookup
  // that throws rejects only the callers of that one key
  const settle = async (chunk: Slot<Query, Return>[]): Promise<void> => {
    const queries: Query[] = [];

    for (const slot of chunk) {
      queries.push(slot.query);
    }

    let data: Data;

    try {
      data = await callback(queries);
    } catch (error) {
      for (const slot of chunk) {
        for (const caller of slot.callers) {
          caller.reject(error);
        }
      }
      return;
    }
    for (const [index, slot] of chunk.entries()) {
      try {
        const value = lookup(data, slot.query, index);

        for (const caller of slot.callers) {
          caller.resolve(value);
        }
      } catch (error) {
        for (const caller of slot.callers) {
          caller.reject(error);
        }
      }
    }
  };

  const flush = (): void => {
    const gathered = waiting;
    const slots = new Map<unknown, Slot<Query, Return>>();

    waiting = [];
    timer = undefined;
    for (const { query, resolve, reject } of gathered) {
      const key = keyOf(query);
      const slot = slots.get(key);

      if (slot == null) {
        slots.set(key, { query, callers: [{ resolve, reject }] });
      } else {
        slot.callers.push({ resolve, reject });
      }
    }

    const unique = Array.from(slots.values());

    for (let start = 0; start < unique.length; start += size) {
      // Cannot reject: `settle` hands every failure to its callers
      settle(unique.slice(start, start + size)).catch(() => undefined);
    }
  };

  return async (query: Query): Promise<Return> =>
    new Promise<Return>((resolve, reject) => {
      waiting.push({ query, resolve, reject });
      timer ??= setTimeout(flush, options.wait ?? 0);
    });
}
