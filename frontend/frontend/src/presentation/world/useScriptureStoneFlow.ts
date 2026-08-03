import { useCallback } from "react";
import { QuestStatus } from "@/domain/gameplay/quest/QuestTypes";
import { formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { usePopupStore } from "@/presentation/gameplay/stores/popupStore";
import { GARDEN_QUEST_ID, SCRIPTURE_STONES } from "./gardenOfBeginningsContent";

export function useScriptureStoneFlow(): { handleStoneInteract: (stoneId: string) => void } {
  const { questEngine, questRegistry, collectibleManager, rewardEngine, scriptureRepository } =
    useGameplay();
  const showVersePopup = usePopupStore((state) => state.showVersePopup);

  const handleStoneInteract = useCallback(
    (stoneId: string) => {
      if (!collectibleManager.has(stoneId)) {
        return;
      }
      const stone = SCRIPTURE_STONES.find((candidate) => candidate.id === stoneId);
      if (!stone) {
        return;
      }

      const quest = questRegistry.get(GARDEN_QUEST_ID);
      if (quest.status === QuestStatus.AVAILABLE) {
        questEngine.start(GARDEN_QUEST_ID);
      }

      const totalsBefore = rewardEngine.getTotals();
      collectibleManager.pickUp(stoneId);
      if (questRegistry.get(GARDEN_QUEST_ID).status === QuestStatus.ACTIVE) {
        questEngine.progressObjective(GARDEN_QUEST_ID, stoneId, 1);
      }
      const totalsAfter = rewardEngine.getTotals();

      const unsubscribe = usePopupStore.subscribe((state, previousState) => {
        if (previousState.versePopup !== null && state.versePopup === null) {
          unsubscribe();
          const delta = {
            experience: totalsAfter.experience - totalsBefore.experience,
            faithPoints: totalsAfter.faithPoints - totalsBefore.faithPoints,
            coins: totalsAfter.coins - totalsBefore.coins,
          };
          if (delta.experience > 0 || delta.faithPoints > 0 || delta.coins > 0) {
            usePopupStore.getState().showRewardPopup(delta);
          }
        }
      });

      scriptureRepository
        .getVerse(stone.reference)
        .then((verse) => {
          showVersePopup({ referenceText: formatReference(verse.reference), verseText: verse.text });
        })
        .catch(() => {
          // Mock provider only.
        });
    },
    [
      questEngine,
      questRegistry,
      collectibleManager,
      rewardEngine,
      scriptureRepository,
      showVersePopup,
    ]
  );

  return { handleStoneInteract };
}
