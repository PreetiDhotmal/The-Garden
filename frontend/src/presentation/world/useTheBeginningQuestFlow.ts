import { useCallback, useEffect } from "react";
import { QuestStatus } from "@/domain/gameplay/quest/QuestTypes";
import { formatReference } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { usePopupStore } from "@/presentation/gameplay/stores/popupStore";
import type { GameplayServices } from "@/presentation/gameplay/providers/GameplayContext";
import type { WorldManager } from "@/infrastructure/world/WorldManager";
import {
  THE_BEGINNING_QUEST_ID,
  RIVER_TRIGGER_ID,
  OBJECTIVE_REACH_RIVER,
  OBJECTIVE_INSPECT_TREE,
  OBJECTIVE_READ_GENESIS,
  OBJECTIVE_COLLECT_SEEDS,
  OBJECTIVE_RETURN_TO_ELDER,
  GENESIS_STONE_ID,
  SEED_IDS,
} from "./theBeginningQuestContent";

function ensureStarted(
  questEngine: GameplayServices["questEngine"],
  questRegistry: GameplayServices["questRegistry"]
): void {
  const quest = questRegistry.get(THE_BEGINNING_QUEST_ID);
  if (quest.status === QuestStatus.AVAILABLE) {
    questEngine.start(THE_BEGINNING_QUEST_ID);
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

export interface TheBeginningQuestFlow {
  readonly handleTreeInspect: () => void;
  readonly handleGenesisStoneInteract: () => void;
  readonly handleSeedCollected: (seedId: string) => void;
  readonly handleReturnToElder: () => void;
}

/**
 * progressObjective already auto-completes the quest (and grants its
 * reward bundle) once every required objective hits its target count
 * — see QuestEngine.progressObjective's requiredObjectivesComplete
 * check. Nothing here needs to call complete() explicitly.
 */
export function useTheBeginningQuestFlow(worldManager: WorldManager): TheBeginningQuestFlow {
  const { questEngine, questRegistry, collectibleManager, rewardEngine, scriptureRepository } =
    useGameplay();
  const showVersePopup = usePopupStore((state) => state.showVersePopup);

  // River reached — a proximity trigger, not a click-to-interact object, so it's driven by WorldManager's own event bus rather than InteractionManager.
  useEffect(() => {
    return worldManager.eventBus.on("trigger:entered", ({ triggerId }) => {
      if (triggerId !== RIVER_TRIGGER_ID) {
        return;
      }
      ensureStarted(questEngine, questRegistry);
      if (questRegistry.get(THE_BEGINNING_QUEST_ID).status === QuestStatus.ACTIVE) {
        questEngine.progressObjective(THE_BEGINNING_QUEST_ID, OBJECTIVE_REACH_RIVER, 1);
      }
    });
  }, [worldManager, questEngine, questRegistry]);

  const handleTreeInspect = useCallback(() => {
    ensureStarted(questEngine, questRegistry);
    if (questRegistry.get(THE_BEGINNING_QUEST_ID).status === QuestStatus.ACTIVE) {
      questEngine.progressObjective(THE_BEGINNING_QUEST_ID, OBJECTIVE_INSPECT_TREE, 1);
    }
  }, [questEngine, questRegistry]);

  const handleGenesisStoneInteract = useCallback(() => {
    if (!collectibleManager.has(GENESIS_STONE_ID)) {
      return;
    }
    ensureStarted(questEngine, questRegistry);

    const totalsBefore = rewardEngine.getTotals();
    const collectible = collectibleManager.pickUp(GENESIS_STONE_ID);
    if (questRegistry.get(THE_BEGINNING_QUEST_ID).status === QuestStatus.ACTIVE) {
      questEngine.progressObjective(THE_BEGINNING_QUEST_ID, OBJECTIVE_READ_GENESIS, 1);
    }
    reportRewardDelta(rewardEngine, totalsBefore);

    const reference = collectible.effects.scriptureReward?.reference;
    if (reference) {
      scriptureRepository
        .getVerse(reference)
        .then((verse) => {
          showVersePopup({ referenceText: formatReference(verse.reference), verseText: verse.text });
        })
        .catch(() => {
          // Mock provider only.
        });
    }
  }, [collectibleManager, questEngine, questRegistry, rewardEngine, scriptureRepository, showVersePopup]);

  const handleSeedCollected = useCallback(
    (seedId: string) => {
      if (!SEED_IDS.includes(seedId)) {
        return;
      }
      ensureStarted(questEngine, questRegistry);
      if (questRegistry.get(THE_BEGINNING_QUEST_ID).status === QuestStatus.ACTIVE) {
        questEngine.progressObjective(THE_BEGINNING_QUEST_ID, OBJECTIVE_COLLECT_SEEDS, 1);
      }
    },
    [questEngine, questRegistry]
  );

  const handleReturnToElder = useCallback(() => {
    const quest = questRegistry.get(THE_BEGINNING_QUEST_ID);
    if (quest.status !== QuestStatus.ACTIVE) {
      return;
    }
    const otherObjectivesComplete = quest.objectives
      .filter((objective) => objective.id !== OBJECTIVE_RETURN_TO_ELDER)
      .every((objective) => objective.currentCount >= objective.targetCount);
    if (!otherObjectivesComplete) {
      return;
    }
    const totalsBefore = rewardEngine.getTotals();
    questEngine.progressObjective(THE_BEGINNING_QUEST_ID, OBJECTIVE_RETURN_TO_ELDER, 1);
    reportRewardDelta(rewardEngine, totalsBefore);
  }, [questEngine, questRegistry, rewardEngine]);

  return { handleTreeInspect, handleGenesisStoneInteract, handleSeedCollected, handleReturnToElder };
}
