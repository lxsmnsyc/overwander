import {
  type BaseEvent,
  EventEmitter,
  type EventEmitterListener,
  type EventListenerLifecycle,
} from './event-emitter';

export type EventDefinition = [event: BaseEvent, priority: number];

export type EventMap = Record<number | string, EventDefinition>;

export class EventEngine<T extends EventMap, K extends keyof T = keyof T> {
  private readonly emitters: Partial<Record<K, EventEmitter<any, any>>> = {};

  on<E extends K, D extends EventDefinition = T[E]>(
    type: E,
    priority: D[1],
    listener: EventEmitterListener<D[0]>,
  ): EventListenerLifecycle<D[0]> {
    const emitter = (this.emitters[type] ||= new EventEmitter());
    // The emitter store is untyped (any); the signature restores D[0]
    // oxlint-disable-next-line typescript/no-unsafe-return
    return emitter.on(priority, listener);
  }

  off<E extends K, D extends EventDefinition = T[E]>(
    type: E,
    priority: D[1],
    listener: EventEmitterListener<D[0]>,
  ): void {
    const emitter = (this.emitters[type] ||= new EventEmitter());
    emitter.off(priority, listener);
  }

  emit<E extends K>(type: E, event: T[E][0]): void {
    const emitter = (this.emitters[type] ||= new EventEmitter());
    emitter.emit(event);
  }
}
