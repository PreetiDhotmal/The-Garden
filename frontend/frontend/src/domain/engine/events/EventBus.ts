export type EventListener<TPayload> = (payload: TPayload) => void;
export type Unsubscribe = () => void;

/**
 * A strongly-typed publish/subscribe event bus. `TEventMap` maps event
 * names to their payload type, so `on`/`emit` calls are checked by the
 * compiler — publishing "asset:load-completed" with the wrong payload
 * shape is a type error, not a runtime surprise.
 *
 * This is intentionally framework-free: it has no dependency on React
 * or Three.js, so it can be used from any layer (and is trivially unit
 * testable, as below).
 */
export class EventBus<TEventMap extends Record<string, unknown>> {
  private readonly listenersByEvent = new Map<keyof TEventMap, Set<EventListener<unknown>>>();
  private readonly anyListeners = new Set<(eventName: keyof TEventMap, payload: unknown) => void>();

  on<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    listener: EventListener<TEventMap[TEventName]>
  ): Unsubscribe {
    const listeners = this.listenersByEvent.get(eventName) ?? new Set();
    listeners.add(listener as EventListener<unknown>);
    this.listenersByEvent.set(eventName, listeners);

    return () => {
      this.off(eventName, listener);
    };
  }

  /** Notified for every event, regardless of name — for dev-tools event logs. Never used by gameplay logic itself, only observability. */
  onAny(listener: (eventName: keyof TEventMap, payload: unknown) => void): Unsubscribe {
    this.anyListeners.add(listener);
    return () => {
      this.anyListeners.delete(listener);
    };
  }

  once<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    listener: EventListener<TEventMap[TEventName]>
  ): Unsubscribe {
    const unsubscribe = this.on(eventName, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  off<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    listener: EventListener<TEventMap[TEventName]>
  ): void {
    this.listenersByEvent.get(eventName)?.delete(listener as EventListener<unknown>);
  }

  emit<TEventName extends keyof TEventMap>(
    eventName: TEventName,
    payload: TEventMap[TEventName]
  ): void {
    const listeners = this.listenersByEvent.get(eventName);
    if (listeners) {
      // Snapshot before iterating: a listener may unsubscribe itself (or
      // another listener) during emission, which would otherwise mutate
      // the Set mid-iteration.
      for (const listener of Array.from(listeners)) {
        listener(payload);
      }
    }
    for (const anyListener of Array.from(this.anyListeners)) {
      anyListener(eventName, payload);
    }
  }

  listenerCount(eventName: keyof TEventMap): number {
    return this.listenersByEvent.get(eventName)?.size ?? 0;
  }

  clear(): void {
    this.listenersByEvent.clear();
    this.anyListeners.clear();
  }
}
