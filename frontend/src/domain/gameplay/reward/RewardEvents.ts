import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { Unsubscribe } from "@/domain/engine/events/EventBus";

export function onRewardGranted(
  eventBus: GameplayEventBus,
  listener: (rewardType: string, amount: number | null) => void
): Unsubscribe {
  return eventBus.on("reward:granted", (payload) => {
    listener(payload.rewardType, payload.amount);
  });
}

export function onPlayerLeveledUp(
  eventBus: GameplayEventBus,
  listener: (newLevel: number) => void
): Unsubscribe {
  return eventBus.on("player:leveled-up", (payload) => {
    listener(payload.newLevel);
  });
}

export function onAchievementUnlocked(
  eventBus: GameplayEventBus,
  listener: (achievementId: string) => void
): Unsubscribe {
  return eventBus.on("achievement:unlocked", (payload) => {
    listener(payload.achievementId);
  });
}
