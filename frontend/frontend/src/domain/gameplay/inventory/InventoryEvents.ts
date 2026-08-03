import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { Unsubscribe } from "@/domain/engine/events/EventBus";

export function onInventoryItemAdded(
  eventBus: GameplayEventBus,
  listener: (itemId: string, quantity: number) => void
): Unsubscribe {
  return eventBus.on("inventory:item-added", (payload) => {
    listener(payload.itemId, payload.quantity);
  });
}

export function onInventoryItemRemoved(
  eventBus: GameplayEventBus,
  listener: (itemId: string, quantity: number) => void
): Unsubscribe {
  return eventBus.on("inventory:item-removed", (payload) => {
    listener(payload.itemId, payload.quantity);
  });
}
