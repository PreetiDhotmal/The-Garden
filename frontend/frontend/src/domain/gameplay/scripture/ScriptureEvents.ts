import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { Unsubscribe } from "@/domain/engine/events/EventBus";

export function onScriptureDiscovered(
  eventBus: GameplayEventBus,
  listener: (referenceKey: string) => void
): Unsubscribe {
  return eventBus.on("scripture:discovered", (payload) => {
    listener(payload.referenceKey);
  });
}

export function onScriptureCollected(
  eventBus: GameplayEventBus,
  listener: (referenceKey: string) => void
): Unsubscribe {
  return eventBus.on("scripture:collected", (payload) => {
    listener(payload.referenceKey);
  });
}

export function onScriptureMemorized(
  eventBus: GameplayEventBus,
  listener: (referenceKey: string) => void
): Unsubscribe {
  return eventBus.on("scripture:memorized", (payload) => {
    listener(payload.referenceKey);
  });
}
