/**
 * Something that can be switched on and off as a whole.
 *
 * An `EventListenerLifecycle` already answers this for one listener;
 * this is what lets a *family* of them — everything one ability does,
 * everything one shelf of held items does — be started and stopped
 * together, so nothing in the battle is listening for a thing that
 * cannot happen.
 */
export interface Lifecycle {
  start(): void;
  stop(): void;
}

export class MergedLifecycle implements Lifecycle {
  constructor(public lifecycles: Lifecycle[]) {
    // no-op
  }

  start(): void {
    for (const lifecycle of this.lifecycles) {
      lifecycle.start();
    }
  }

  stop(): void {
    for (const lifecycle of this.lifecycles) {
      lifecycle.stop();
    }
  }
}
