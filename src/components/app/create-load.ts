import { type Accessor, createEffect, createMemo, createSignal } from 'solid-js';
import describeFailure from '../../i18n/refusals';

/**
 * Two shapes for a read that a screen must be able to draw around
 * rather than wait on. Solid 2 has no read that never waits: a pending
 * async memo read anywhere, `latest` included, holds the nearest
 * `Loading`. So these keep the answer as data instead.
 */

/**
 * A read that can fail, resolved to what came back or to why it did
 * not. An async memo over `catchFailure(...)` never throws, so a body
 * that draws a failed bag as a note does not need an `Errored` around
 * every place that reads the bag.
 */
export interface Outcome<T> {
  /** What came back, or undefined when the read failed */
  value: T | undefined;
  /**
   * What the failure says to a player, or null while there is none.
   * Only an `Error` says something: a store's own message is never
   * written for a player
   */
  failure: string | null;
}

/** `read`, with a rejection turned into an answer */
export async function catchFailure<T>(read: Promise<T>): Promise<Outcome<T>> {
  try {
    return { value: await read, failure: null };
  } catch (thrown: unknown) {
    return { value: undefined, failure: thrown instanceof Error ? describeFailure(thrown) : null };
  }
}

/**
 * A load whose reader draws its empty state instead of waiting: what
 * 1.x read with `resource.latest` or `answered`. It never holds a
 * `Loading`, and it is safe to read in the body that made it, in
 * handlers and in timers.
 */
export interface Load<T> {
  /**
   * The last answer: undefined until the first lands and while the
   * last read failed, the previous answer while a new one is asked
   */
  latest: Accessor<T | undefined>;
  /** What the last read's failure says to a player, as `Outcome.failure` */
  failed: Accessor<string | null>;
  /** Whether the last read failed, whether or not it said why */
  errored: Accessor<boolean>;
  /** Asks the same question again */
  refresh: () => void;
}

/**
 * Loads `fetch(key)` whenever the key changes, and not when it is
 * built again with the same value: the key goes through a memo, so a
 * string key compares by value. A null, undefined or false key asks
 * nothing and keeps the last answer, as a 1.x resource did.
 *
 * `refresh()` and writes to the signals the key reads throw from a
 * component body or a memo (`REACTIVE_WRITE_IN_OWNED_SCOPE`): call them
 * from handlers or promise callbacks.
 */
export function createLoad<K, T>(
  key: () => K | null | undefined | false,
  fetch: (key: K) => Promise<T>,
): Load<T> {
  const asked = createMemo(key);
  const [revision, setRevision] = createSignal(0);
  const [answer, setAnswer] = createSignal<{ value: T } | undefined>(undefined);
  const [failure, setFailure] = createSignal<{ said: string | null } | undefined>(undefined);

  createEffect(
    () => ({ at: asked(), revision: revision() }),
    ({ at }) => {
      if (at == null || at === false) {
        return undefined;
      }

      // An answer to a question since replaced is dropped
      let live = true;

      fetch(at).then(
        (value) => {
          if (live) {
            setAnswer({ value });
            setFailure(undefined);
          }
        },
        (thrown: unknown) => {
          if (live) {
            setFailure({ said: thrown instanceof Error ? describeFailure(thrown) : null });
          }
        },
      );
      return () => {
        live = false;
      };
    },
  );

  return {
    latest: () => (failure() == null ? answer()?.value : undefined),
    failed: () => failure()?.said ?? null,
    errored: () => failure() != null,
    refresh: () => {
      setRevision((count) => count + 1);
    },
  };
}
