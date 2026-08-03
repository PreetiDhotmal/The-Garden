import { useCallback } from "react";
import { QuestStatus } from "@/domain/gameplay/quest/QuestTypes";
import { formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { usePopupStore } from "@/presentation/gameplay/stores/popupStore";
import {
  SCRIPTURE_STONE_REFERENCE,
  VERTICAL_SLICE_OBJECTIVE_ID,
  VERTICAL_SLICE_QUEST_ID,
  VERTICAL_SLICE_STONE_ID,
} from "../verticalSliceContent";

/**
 * Wires together every system this milestone built into the single
 * playable scenario the milestone asks for: interact -> collectible
 * pickup (item + reward + scripture unlock) -> quest objective
 * progress (-> auto-completion -> its own reward) -> verse popup ->
 * (on close) reward popup. Nothing here is new gameplay *logic* — it's
 * pure orchestration of calls into QuestEngine/CollectibleManager/
 * ScriptureRepository, which is exactly what a future NPC or world
 * trigger would also do.
 */
export function useVerticalSliceFlow(): { handleStoneInteract: () => void } {
  const { questEngine, questRegistry, collectibleManager, rewardEngine, scriptureRepository } =
    useGameplay();
  const showVersePopup = usePopupStore((state) => state.showVersePopup);

  const handleStoneInteract = useCallback(() => {
    if (!collectibleManager.has(VERTICAL_SLICE_STONE_ID)) {
      return; // already collected
    }

    const quest = questRegistry.get(VERTICAL_SLICE_QUEST_ID);
    if (quest.status === QuestStatus.AVAILABLE) {
      questEngine.start(VERTICAL_SLICE_QUEST_ID);
    }

    const totalsBefore = rewardEngine.getTotals();
    collectibleManager.pickUp(VERTICAL_SLICE_STONE_ID);
    questEngine.progressObjective(VERTICAL_SLICE_QUEST_ID, VERTICAL_SLICE_OBJECTIVE_ID, 1);
    const totalsAfter = rewardEngine.getTotals();

    // Show the reward popup once the verse popup is dismissed, rather
    // than stacking two modals — subscribes once, imperatively, and
    // unsubscribes itself the moment the verse popup closes.
    const unsubscribe = usePopupStore.subscribe((state, previousState) => {
      if (previousState.versePopup !== null && state.versePopup === null) {
        unsubscribe();
        usePopupStore.getState().showRewardPopup({
          experience: totalsAfter.experience - totalsBefore.experience,
          faithPoints: totalsAfter.faithPoints - totalsBefore.faithPoints,
          coins: totalsAfter.coins - totalsBefore.coins,
        });
      }
    });

    scriptureRepository
      .getVerse(SCRIPTURE_STONE_REFERENCE)
      .then((verse) => {
        showVersePopup({ referenceText: formatReference(verse.reference), verseText: verse.text });
      })
      .catch(() => {
        // Mock provider only — a real provider's failure handling belongs to a future milestone.
      });
  }, [
    questEngine,
    questRegistry,
    collectibleManager,
    rewardEngine,
    scriptureRepository,
    showVersePopup,
  ]);

  return { handleStoneInteract };
}
