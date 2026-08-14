import { type Accessor, createEffect, createSignal, onCleanup } from 'solid-js';

/**
 * A signal fed by a subscription that has to be opened again when
 * what it follows changes.
 *
 * Solid's own `from` is the shorter way to do this and the wrong one
 * here: it calls the producer **once**, at creation, and never again.
 * That is fine for a subscription whose subject is known by then, and
 * silently fatal for one that is not — a producer that reads a signal
 * and gives up ("nothing to watch yet, here is a no-op unsubscribe")
 * is never asked a second time, so the moment it was waiting for
 * arrives and nothing is listening. What the player sees is a panel
 * that says "Loading…" for ever, with no error anywhere: the read was
 * never attempted.
 *
 * This runs `open` inside an effect instead, so every signal it reads
 * is a reason to open it again, and the old subscription is closed
 * first. `open` returns null while there is nothing to follow yet.
 *
 * The value resets to null on each re-open, which is the point of
 * resetting it: what arrives next is about a different chunk, window
 * or player, and showing the last one's data under the new one's
 * heading is worse than showing nothing for a moment
 */
export default function watchLive<T>(
  open: (set: (value: T) => void) => (() => void) | null,
): Accessor<T | null> {
  const [value, setValue] = createSignal<T | null>(null);

  createEffect(() => {
    setValue(null);

    // Wrapped, since a stored value that is itself a function would
    // otherwise be taken for an updater
    const close = open((next) => {
      setValue(() => next);
    });

    if (close != null) {
      onCleanup(close);
    }
  });

  return value;
}
