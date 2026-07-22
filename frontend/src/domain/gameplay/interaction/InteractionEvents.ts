import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { Unsubscribe } from "@/domain/engine/events/EventBus";

/**
 * Thin, typed convenience wrapper over GameplayEventBus for the
 * interaction-related event subset — saves callers from repeating the
 * five interaction event names verbatim. The events themselves are
 * declared once, in GameplayEventMap; this module adds no new events.
 */
export function onInteractionStarted(
  eventBus: GameplayEventBus,
  listener: (targetId: string) => void
): Unsubscribe {
  return eventBus.on("interaction:started", (payload) => {
    listener(payload.targetId);
  });
}

export function onInteractionFinished(
  eventBus: GameplayEventBus,
  listener: (targetId: string) => void
): Unsubscribe {
  return eventBus.on("interaction:finished", (payload) => {
    listener(payload.targetId);
  });
}

export function onInteractionEnteredRange(
  eventBus: GameplayEventBus,
  listener: (targetId: string) => void
): Unsubscribe {
  return eventBus.on("interaction:entered-range", (payload) => {
    listener(payload.targetId);
  });
}

export function onInteractionExitedRange(
  eventBus: GameplayEventBus,
  listener: (targetId: string) => void
): Unsubscribe {
  return eventBus.on("interaction:exited-range", (payload) => {
    listener(payload.targetId);
  });
}
