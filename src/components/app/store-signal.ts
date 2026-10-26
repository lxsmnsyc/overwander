import { type Accessor, createSignal, onCleanup } from 'solid-js';
import type { Store } from '../../game/store';

/**
 * A store from `src/game` as a signal, for as long as the component
 * that asks lives.
 *
 * Belongs in a component body, so the subscription has an owner to be
 * closed with
 */
export default function createStoreSignal<T>(store: Store<T>): Accessor<T> {
  // The store already decides what counts as a change
  const [value, setValue] = createSignal(store.get(), { equals: false });

  // Wrapped, since a stored value that is itself a function would
  // otherwise be taken for an updater
  onCleanup(
    store.subscribe((next) => {
      setValue(() => next);
    }),
  );

  return value;
}
