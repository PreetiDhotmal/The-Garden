import { useEffect, useState } from "react";
import type { GameplayEventName } from "@/domain/gameplay/events/GameplayEventBus";
import { useGameplay } from "./useGameplay";

const DEFAULT_WATCHED_EVENTS: readonly GameplayEventName[] = [
  "quest:started",
  "quest:objective-progressed",
  "quest:completed",
  "quest:failed",
  "inventory:item-added",
  "inventory:item-removed",
  "scripture:collected",
  "scripture:discovered",
  "reward:granted",
  "collectible:picked",
];

/**
 * Domain registries (QuestRegistry, Inventory, etc.) are plain mutable
 * classes, not React state — this hook is the bridge: subscribe once,
 * bump a counter on any watched event, and components use that
 * counter as a dependency to re-read fresh data from the registries.
 */
export function useGameplayVersion(
  events: readonly GameplayEventName[] = DEFAULT_WATCHED_EVENTS
): number {
  const { eventBus } = useGameplay();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribes = events.map((eventName) =>
      eventBus.on(eventName, () => {
        setVersion((current) => current + 1);
      })
    );
    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  }, [eventBus, events]);

  return version;
}
