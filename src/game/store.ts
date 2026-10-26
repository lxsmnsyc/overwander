/**
 * A value the game holds and the interface reads.
 *
 * `src/game` is the game's logic without a UI framework, so its state
 * cannot be a Solid signal. A store is the plain version: read it,
 * set it, and be told when it changes. A component turns one into a
 * signal with `createStoreSignal` from `src/components/app`
 */
export interface Store<T> {
  get: () => T;
  /** Called with each new value, never with the current one; returns the unsubscribe */
  subscribe: (listener: (value: T) => void) => () => void;
}

export interface WritableStore<T> extends Store<T> {
  set: (value: T) => void;
  update: (change: (value: T) => T) => void;
}

/**
 * A store holding `initial`. A value `equals` calls the same as the
 * current one is not a change, so nobody is told about it
 */
export function createStore<T>(
  initial: T,
  equals: (previous: T, next: T) => boolean = Object.is,
): WritableStore<T> {
  let current = initial;
  const listeners = new Set<(value: T) => void>();

  function set(value: T): void {
    if (equals(current, value)) {
      return;
    }
    current = value;
    // Copied, so a listener that unsubscribes itself or another does
    // not change who is told about this value
    for (const listener of Array.from(listeners)) {
      listener(value);
    }
  }

  return {
    get: () => current,
    set,
    update: (change) => {
      set(change(current));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
