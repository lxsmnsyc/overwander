export interface BaseEvent {
  id: string;
  disabled: boolean;
}

export const enum EventPriority {
  Pre = 0,
  Exact = 1,
  Post = 2,
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
      // Listeners mutate event.disabled mid-emission; the checker's
      // narrowing cannot see the mutation through the callback calls.
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      if (event.disabled) {
        return;
      }
      if (listeners) {
        for (const listener of [...listeners]) {
          // oxlint-disable-next-line typescript/no-unnecessary-condition
          if (event.disabled) {
            return;
          }
          if (!listener.disabled) {
            listener(event, listener);
          }
        }
      }
    }
  }
}
