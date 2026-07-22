import { useEffect } from "react";
import { onQuestCompleted, onQuestStarted } from "@/domain/gameplay/quest/QuestEvents";
import { onCollectiblePicked } from "@/domain/gameplay/collectible/CollectibleEvents";
import { onAchievementUnlocked, onPlayerLeveledUp } from "@/domain/gameplay/reward/RewardEvents";
import { QuestStatus } from "@/domain/gameplay/quest/QuestTypes";
import { parseReferenceKey, formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "../hooks/useGameplay";
import { useNotificationStore } from "../stores/notificationStore";
import { usePopupStore } from "../stores/popupStore";

export function GameplayEventBridge() {
  const { eventBus, questRegistry, questEngine, scriptureRepository, scriptureProgressRef } =
    useGameplay();
  const push = useNotificationStore((state) => state.push);
  const showAchievementPopup = usePopupStore((state) => state.showAchievementPopup);
  const showVersePopup = usePopupStore((state) => state.showVersePopup);

  useEffect(() => {
    const unsubscribes = [
      onQuestStarted(eventBus, (questId) => {
        const quest = questRegistry.has(questId) ? questRegistry.get(questId) : null;
        push(`Quest started: ${quest?.title ?? questId}`);
      }),
      onQuestCompleted(eventBus, (questId) => {
        const quest = questRegistry.has(questId) ? questRegistry.get(questId) : null;
        push(`Quest completed: ${quest?.title ?? questId}`);
      }),
      onCollectiblePicked(eventBus, (_collectibleId, category) => {
        push(`Picked up a ${category.toLowerCase()}.`);
      }),
      onPlayerLeveledUp(eventBus, (newLevel) => {
        push(`Level up! You are now level ${String(newLevel)}.`);
      }),
      onAchievementUnlocked(eventBus, (achievementId) => {
        showAchievementPopup(achievementId);
      }),

      // Milestone 7: DialogueManager only ever *requests* these actions
      // (see DialogueManager's docstring) — this is where they're
      // actually performed, through the same QuestEngine/ScriptureRepository
      // every other system uses, not a parallel dialogue-specific path.
      eventBus.on("dialogue:quest-offer-requested", ({ questId }) => {
        if (!questRegistry.has(questId)) {
          return;
        }
        const quest = questRegistry.get(questId);
        if (quest.status === QuestStatus.AVAILABLE) {
          questEngine.accept(questId);
        }
      }),
      eventBus.on("dialogue:quest-reward-claim-requested", ({ questId }) => {
        if (!questRegistry.has(questId)) {
          return;
        }
        const quest = questRegistry.get(questId);
        if (quest.status === QuestStatus.COMPLETED) {
          questEngine.claimReward(questId);
        }
      }),
      eventBus.on("dialogue:scripture-display-requested", ({ referenceKey }) => {
        const reference = parseReferenceKey(referenceKey);
        scriptureProgressRef.current = scriptureProgressRef.current.discover(reference, "dialogue");
        scriptureRepository
          .getVerse(reference)
          .then((verse) => {
            showVersePopup({
              referenceText: formatReference(verse.reference),
              verseText: verse.text,
            });
          })
          .catch(() => {
            // Best-effort — a dialogue-triggered verse that fails to load just doesn't pop up.
          });
      }),
    ];

    return () => {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  }, [
    eventBus,
    questRegistry,
    questEngine,
    scriptureRepository,
    scriptureProgressRef,
    push,
    showAchievementPopup,
    showVersePopup,
  ]);

  return null;
}
