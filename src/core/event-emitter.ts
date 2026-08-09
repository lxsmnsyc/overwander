export interface BaseEvent {
  id: string;
  disabled: boolean;
}

export const enum EventPriority {
  Pre = 0,
  Exact = 1,
  Post = 2,
}

/**
 * Priority scale for attack-resolution events (UnitTriggerMoveTarget,
 * UnitAttack): the regular Pre/Exact/Post range is wrapped by a
 * Prepare/Cleanup bracket (e.g. Mold Breaker's attack-scoped ability
 * suppression, post-attack bookkeeping)
 */
export const enum AttackPriority {
  /**
   * Runs before every regular listener
   */
  Prepare = 0,
  Pre = 1,
  Exact = 2,
  Post = 3,
  /**
   * Runs after every regular listener — and ALWAYS runs, even when a
   * listener disabled the event mid-emission, so Prepare/Cleanup
   * brackets cannot leak
   */
  Cleanup = 4,
}

export interface EventEmitterListener<T> {
  (event: T, self: this): void;

  disabled?: boolean;
}

export class EventListenerLifecycle<T extends BaseEvent> {
  constructor(public listener: EventEmitterListener<T>) {
    // no-op
  }

  start(): void {
    this.listener.disabled = false;
  }

  stop(): void {
    this.listener.disabled = true;
  }
}

export class EventEmitter<T extends BaseEvent, P extends number> {
  // Sparse: indexed by priority, so gaps are undefined
  queue: (Set<EventEmitterListener<T>> | undefined)[] = [];

  on(priority: P, listener: EventEmitterListener<T>): EventListenerLifecycle<T> {
    (this.queue[priority] ??= new Set()).add(listener);
    return new EventListenerLifecycle(listener);
  }

  off(priority: P, listener: EventEmitterListener<T>): void {
    this.queue[priority]?.delete(listener);
  }

  emit(event: T): void {
    if (event.disabled) {
      return;
    }
    const queue = [...this.queue];
    for (let i = 0, len = queue.length; i < len; i++) {
      const listeners = queue[i];
      /**
       * Listeners mutate event.disabled mid-emission (the checker's
       * narrowing cannot see it through the callback calls); a
       * disabled event skips the remaining regular listeners, but
       * AttackPriority.Cleanup listeners always run so brackets
       * cannot leak. Events on the regular EventPriority scale never
       * register at that index, so the rule is inert for them.
       */
      // The queue index is a plain number standing in for the const
      // enum; tsgolint flags the comparison either way
      // oxlint-disable-next-line typescript/no-unsafe-enum-comparison
      const skippable = i !== AttackPriority.Cleanup;
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      if (skippable && event.disabled) {
        continue;
      }
      if (listeners) {
        for (const listener of [...listeners]) {
          // oxlint-disable-next-line typescript/no-unnecessary-condition
          if (skippable && event.disabled) {
            break;
          }
          if (!listener.disabled) {
            listener(event, listener);
          }
        }
      }
    }
  }
}
