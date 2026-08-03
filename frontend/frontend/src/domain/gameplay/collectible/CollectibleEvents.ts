import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { Unsubscribe } from "@/domain/engine/events/EventBus";

export function onCollectiblePicked(
  eventBus: GameplayEventBus,
  listener: (collectibleId: string, category: string) => void
): Unsubscribe {
  return eventBus.on("collectible:picked", (payload) => {
    listener(payload.collectibleId, payload.category);
  });
}
