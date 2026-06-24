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

  start() {
    this.listener.disabled = false;
  }

  stop() {
    this.listener.disabled = true;
  }
}

export class EventEmitter<T extends BaseEvent, P extends number> {
  queue: Set<EventEmitterListener<T>>[] = [];

  on(
    priority: P,
    listener: EventEmitterListener<T>,
  ): EventListenerLifecycle<T> {
    if (!(priority in this.queue)) {
      this.queue[priority] = new Set();
    }
    this.queue[priority].add(listener);
    return new EventListenerLifecycle(listener);
  }

  off(priority: P, listener: EventEmitterListener<T>): void {
    if (priority in this.queue) {
      this.queue[priority].delete(listener);
    }
  }

  emit(event: T): void {
    if (event.disabled) {
      return;
    }
    const queue = [...this.queue];
    for (let i = 0, len = queue.length; i < len; i++) {
      const listeners = queue[i];
      if (event.disabled) {
        return;
      }
      if (listeners) {
        for (const listener of [...listeners]) {
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
