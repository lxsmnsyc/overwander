import { type Accessor, createMemo, from } from 'solid-js';
import { isServer } from '@solidjs/web';

/**
 * A signal fed by a subscription that has to be opened again when
 * what it follows changes.
 *
 * What it follows is the key, read in a memo of its own, so every
 * signal the key reads is a reason to open it again, and an equal key
 * built again opens nothing. The old subscription is closed first. A
 * null or undefined key means there is nothing to follow yet: a panel
 * waiting on one is never stuck on a producer that gave up before its
 * subject arrived.
 *
 * The value is null until the first answer and again on each re-open,
 * which is the point of resetting it: what arrives next is about a
 * different chunk, window or player, and showing the last one's data
 * under the new one's heading is worse than showing nothing for a
 * moment. Being null rather than pending, it never holds a `Loading`.
 * Nothing is opened during a server render, where the live feed has no
 * socket: the page is drawn with null and the browser opens it
 */
export default function watchLive<K, T>(
  key: () => K | null | undefined,
  open: (key: K, set: (value: T) => void) => () => void,
): Accessor<T | null> {
  const asked = createMemo(key);

  return createMemo(() => {
    const at = asked();

    return from<T | null>((set) => {
      // Seeded, so the first read answers null instead of waiting
      set(null);
      if (at == null || isServer) {
        return () => undefined;
      }
      return open(at, set);
    });
  });
}
