/**
 * Word that the buddy's field effects may have changed: a new buddy,
 * one sent back, an item given or taken, an egg hatched.
 *
 * The overworld stays mounted under the dialogs these happen in, so
 * without this it keeps the buddy it read when it opened.
 */

const listeners = new Set<() => void>();

/** Hear about each change until the returned function is called */
export function onBuddyChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function announceBuddyChange(): void {
  for (const listener of listeners) {
    listener();
  }
}
