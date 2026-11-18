import { type Accessor, createMemo, from } from 'solid-js';
import type { Store } from '../../game/store';

/**
 * A store from `src/game` as a signal, for as long as the component
 * that asks lives.
 *
 * Belongs in a component body, so the subscription has an owner to be
 * closed with. A change lands at the next flush, like any other write
 */
export default function createStoreSignal<T>(store: Store<T>): Accessor<T> {
  // The current value is handed over during the subscribe, so the
  // first read never waits. The store already decides what counts as
  // a change, so the memo passes on every value it is told about
  return createMemo(
    () =>
      from<T>((next) => {
        next(store.get());
        return store.subscribe(next);
      }),
    { equals: false },
  );
}
