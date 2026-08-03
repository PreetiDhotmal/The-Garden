import { useCallback, useEffect } from "react";
import type { ScriptureReference } from "@the-garden/shared-types";
import { QuestStatus } from "@/domain/gameplay/quest/QuestTypes";
import { formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { usePopupStore } from "@/presentation/gameplay/stores/popupStore";
import type { GameplayServices } from "@/presentation/gameplay/providers/GameplayContext";
import type { WorldManager } from "@/infrastructure/world/WorldManager";
import {
  WILDERNESS_QUEST_ID,
  DESERT_ENTRANCE_TRIGGER_ID,
  MOUNTAIN_TRIGGER_ID,
  OBJECTIVE_ENTER_DESERT,
  OBJECTIVE_FIND_WATER,
  OBJECTIVE_COLLECT_MANNA,
  OBJECTIVE_AVOID_TEMPTATION,
  OBJECTIVE_READ_SCRIPTURE,
  OBJECTIVE_REACH_MOUNTAIN,
  TEMPTATION_STONE_ID,
  MATTHEW_STONE_ID,
  MANNA_IDS,
} from "./wildernessContent";

function ensureStarted(
  questEngine: GameplayServices["questEngine"],
  questRegistry: GameplayServices["questRegistry"]
): void {
  const quest = questRegistry.get(WILDERNESS_QUEST_ID);
  if (quest.status === QuestStatus.AVAILABLE) {
    questEngine.start(WILDERNESS_QUEST_ID);
  }
}

function reportRewardDelta(
  rewardEngine: GameplayServices["rewardEngine"],
  totalsBefore: ReturnType<GameplayServices["rewardEngine"]["getTotals"]>
): void {
  const totalsAfter = rewardEngine.getTotals();
  const delta = {
    experience: totalsAfter.experience - totalsBefore.experience,
    faithPoints: totalsAfter.faithPoints - totalsBefore.faithPoints,
    coins: totalsAfter.coins - totalsBefore.coins,
  };
  if (delta.experience > 0 || delta.faithPoints > 0 || delta.coins > 0) {
    usePopupStore.getState().showRewardPopup(delta);
  }
}

export interface WildernessQuestFlow {
  readonly handleOasisInteract: () => void;
  readonly handleTemptationInteract: () => void;
  readonly handleMatthewStoneInteract: () => void;
  readonly handleMannaCollected: (mannaId: string) => void;
}

export function useWildernessQuestFlow(
  worldManager: WorldManager,
  onDrinkWater: () => void
): WildernessQuestFlow {
  const { questEngine, questRegistry, collectibleManager, rewardEngine, scriptureRepository } =
    useGameplay();
  const showVersePopup = usePopupStore((state) => state.showVersePopup);

  // Enter desert / reach mountain — proximity triggers driven by WorldManager's own event bus.
  useEffect(() => {
    return worldManager.eventBus.on("trigger:entered", ({ triggerId }) => {
      if (triggerId === DESERT_ENTRANCE_TRIGGER_ID) {
        ensureStarted(questEngine, questRegistry);
        if (questRegistry.get(WILDERNESS_QUEST_ID).status === QuestStatus.ACTIVE) {
          questEngine.progressObjective(WILDERNESS_QUEST_ID, OBJECTIVE_ENTER_DESERT, 1);
        }
      } else if (triggerId === MOUNTAIN_TRIGGER_ID) {
        if (questRegistry.get(WILDERNESS_QUEST_ID).status === QuestStatus.ACTIVE) {
          const totalsBefore = rewardEngine.getTotals();
          questEngine.progressObjective(WILDERNESS_QUEST_ID, OBJECTIVE_REACH_MOUNTAIN, 1);
          reportRewardDelta(rewardEngine, totalsBefore);
        }
      }
    });
  }, [worldManager, questEngine, questRegistry, rewardEngine]);

  const handleOasisInteract = useCallback(() => {
    ensureStarted(questEngine, questRegistry);
    if (questRegistry.get(WILDERNESS_QUEST_ID).status === QuestStatus.ACTIVE) {
      questEngine.progressObjective(WILDERNESS_QUEST_ID, OBJECTIVE_FIND_WATER, 1);
    }
    onDrinkWater();
  }, [questEngine, questRegistry, onDrinkWater]);

  const readScriptureStone = useCallback(
    (stoneId: string, objectiveId: string, reference: ScriptureReference) => {
      if (!collectibleManager.has(stoneId)) {
        return;
      }
      ensureStarted(questEngine, questRegistry);
      const totalsBefore = rewardEngine.getTotals();
      collectibleManager.pickUp(stoneId);
      if (questRegistry.get(WILDERNESS_QUEST_ID).status === QuestStatus.ACTIVE) {
        questEngine.progressObjective(WILDERNESS_QUEST_ID, objectiveId, 1);
      }
      reportRewardDelta(rewardEngine, totalsBefore);
      scriptureRepository
        .getVerse(reference)
        .then((verse) => {
          showVersePopup({ referenceText: formatReference(verse.reference), verseText: verse.text });
        })
        .catch(() => {
          // Mock provider only.
        });
    },
    [collectibleManager, questEngine, questRegistry, rewardEngine, scriptureRepository, showVersePopup]
  );

  const handleTemptationInteract = useCallback(() => {
    readScriptureStone(TEMPTATION_STONE_ID, OBJECTIVE_AVOID_TEMPTATION, {
      bookName: "Deuteronomy",
      chapter: 8,
      verseStart: 2,
      verseEnd: 3,
      translationCode: "NIV",
    });
  }, [readScriptureStone]);

  const handleMatthewStoneInteract = useCallback(() => {
    readScriptureStone(MATTHEW_STONE_ID, OBJECTIVE_READ_SCRIPTURE, {
      bookName: "Matthew",
      chapter: 4,
      verseStart: 1,
      verseEnd: 4,
      translationCode: "NIV",
    });
  }, [readScriptureStone]);

  const handleMannaCollected = useCallback(
    (mannaId: string) => {
      if (!MANNA_IDS.includes(mannaId)) {
        return;
      }
      ensureStarted(questEngine, questRegistry);
      if (questRegistry.get(WILDERNESS_QUEST_ID).status === QuestStatus.ACTIVE) {
        questEngine.progressObjective(WILDERNESS_QUEST_ID, OBJECTIVE_COLLECT_MANNA, 1);
      }
    },
    [questEngine, questRegistry]
  );

  return {
    handleOasisInteract,
    handleTemptationInteract,
    handleMatthewStoneInteract,
    handleMannaCollected,
  };
}
