import { type LiveRow, followChanges } from './live';

/**
 * The two watch helpers every live view rides on.
 *
 * A change stream carries changes and never current state, so each
 * helper does the first read itself and re-reads on every resubscribe:
 * a dropped socket must not leave a stale screen
 */

/** What a subscription hands back */
export type Unwatch = () => void;

/**
 * Follow one row. `read` is the initial and recovery fetch; `filter`
 * is the change stream's own condition, e.g. `id=eq.abc`. `fromChange`
 * takes a change's own row instead of reading it again, for a row that
 * is the whole answer
 */
export function watchRow<T>(
  table: string,
  filter: string,
  read: () => Promise<T>,
  onChange: (value: T) => void,
  fromChange?: (row: LiveRow) => T | undefined,
): Unwatch {
  const refetch = (): void => {
    read()
      .then(onChange)
      .catch(() => {
        // A read that failed mid-watch is a blink, not a sign-out;
        // the next change or reconnect tries again
      });
  };
  // The first subscribe is the socket catching up with the read below
  // rather than a second reason to run it. Only a resubscribe is: a
  // dropped socket may have missed a change while it was away
  let connected = false;
  const unfollow = followChanges(
    table,
    [filter],
    (change) => {
      // A delete carries no new row, so it is read like a reconnect,
      // and so is a row the reader declines to take as it stands
      const value = Object.keys(change.new).length === 0 ? undefined : fromChange?.(change.new);

      if (value === undefined) {
        refetch();
        return;
      }
      onChange(value);
    },
    () => {
      if (connected) {
        refetch();
      }
      connected = true;
    },
  );

  // The first paint cannot wait for the socket
  refetch();
  return unfollow;
}

/**
 * Follow a set of rows. The subscription is deliberately wider than
 * the read (often unfiltered), because a row *leaving* the set is an
 * UPDATE the set's own filter would not match; every ping simply
 * re-runs the read
 */
export interface WatchTableOptions<T> {
  /** Whether a changed row matters at all, for a change the filter could not rule out */
  wanted?: (row: LiveRow) => boolean;
  /** The set with a changed row folded in, where the row says enough; undefined reads instead */
  fromChange?: (row: LiveRow) => T | undefined;
  /** What the caller already holds, which stands in for the first read */
  initial?: { value: T };
}

export function watchTable<T>(
  table: string,
  filters: (string | undefined)[],
  read: () => Promise<T>,
  onChange: (value: T) => void,
  { wanted, fromChange, initial }: WatchTableOptions<T> = {},
): Unwatch {
  const refetch = (): void => {
    read()
      .then(onChange)
      .catch(() => {
        // Same forgiveness as watchRow: transient failures retry on
        // the next ping
      });
  };
  // An undefined filter is a binding on the whole table, which takes in every other
  const narrowed: string[] = [];
  let whole = filters.length === 0;

  for (const filter of filters) {
    if (filter == null) {
      whole = true;
    } else {
      narrowed.push(filter);
    }
  }

  // As above: the first subscribe rides the read below, and only a
  // resubscribe is worth another
  let connected = false;
  const unfollow = followChanges(
    table,
    whole ? [] : narrowed,
    (change) => {
      const row = change.new;

      // A delete carries no row to judge, so it is always read
      if (Object.keys(row).length === 0) {
        refetch();
        return;
      }
      if (wanted != null && !wanted(row)) {
        return;
      }

      const folded = fromChange?.(row);

      if (folded === undefined) {
        refetch();
        return;
      }
      onChange(folded);
    },
    () => {
      if (connected) {
        refetch();
      }
      connected = true;
    },
  );

  if (initial == null) {
    refetch();
  } else {
    onChange(initial.value);
  }
  return unfollow;
}
