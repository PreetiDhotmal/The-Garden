import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { Unsubscribe } from "@/domain/engine/events/EventBus";

export function onQuestStarted(
  eventBus: GameplayEventBus,
  listener: (questId: string) => void
): Unsubscribe {
  return eventBus.on("quest:started", (payload) => {
    listener(payload.questId);
  });
}

export function onQuestCompleted(
  eventBus: GameplayEventBus,
  listener: (questId: string) => void
): Unsubscribe {
  return eventBus.on("quest:completed", (payload) => {
    listener(payload.questId);
  });
}

export function onQuestFailed(
  eventBus: GameplayEventBus,
  listener: (questId: string, reason: string) => void
): Unsubscribe {
  return eventBus.on("quest:failed", (payload) => {
    listener(payload.questId, payload.reason);
  });
}

export function onQuestObjectiveProgressed(
  eventBus: GameplayEventBus,
  listener: (questId: string, objectiveId: string, currentCount: number, targetCount: number) => void
): Unsubscribe {
  return eventBus.on("quest:objective-progressed", (payload) => {
    listener(payload.questId, payload.objectiveId, payload.currentCount, payload.targetCount);
  });
}
