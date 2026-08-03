import { createSphereTrigger } from "@/domain/world/trigger/TriggerShape";
import { createQuest } from "@/domain/gameplay/quest/Quest";
import { createQuestObjective } from "@/domain/gameplay/quest/QuestObjective";
import { QuestObjectiveType } from "@/domain/gameplay/quest/QuestObjectiveType";
import { QuestType } from "@/domain/gameplay/quest/QuestTypes";
import { createReward, RewardType } from "@/domain/gameplay/reward/Reward";
import { createRewardBundle } from "@/domain/gameplay/reward/RewardBundle";
import { createCollectible } from "@/domain/gameplay/collectible/CollectibleEntity";
import { createCollectibleEffects } from "@/domain/gameplay/collectible/CollectibleEffects";
import { CollectibleCategory } from "@/domain/gameplay/collectible/CollectibleCategory";
import type { GameplayServices } from "@/presentation/gameplay/providers/GameplayContext";
import { SCRIPTURE_FRAGMENT_ITEM_ID } from "@/presentation/gameplay/providers/GameplayProvider";
import type { WorldManager } from "@/infrastructure/world/WorldManager";
import { ELDER_NPC_ID } from "./gardenOfBeginningsContent";

export const THE_BEGINNING_QUEST_ID = "quest:the-beginning";
export const RIVER_TRIGGER_ID = "trigger:the-beginning-river";
export const ANCIENT_TREE_ID = "interactable:ancient-tree";
export const GENESIS_STONE_ID = "collectible:stone-genesis";

export const OBJECTIVE_REACH_RIVER = "objective:the-beginning:reach-river";
export const OBJECTIVE_INSPECT_TREE = "objective:the-beginning:inspect-tree";
export const OBJECTIVE_READ_GENESIS = "objective:the-beginning:read-genesis";
export const OBJECTIVE_COLLECT_SEEDS = "objective:the-beginning:collect-seeds";
export const OBJECTIVE_RETURN_TO_ELDER = "objective:the-beginning:return-to-elder";

export const SEED_IDS: readonly string[] = [
  "collectible:seed-1",
  "collectible:seed-2",
  "collectible:seed-3",
];

export const SEED_POSITIONS: readonly (readonly [number, number, number])[] = [
  [4, 0.4, 12],
  [-6, 0.4, 14],
  [1, 0.4, 18],
];

export const ANCIENT_TREE_POSITION: readonly [number, number, number] = [-8, 0, -6];
export const RIVER_TRIGGER_CENTER: readonly [number, number, number] = [-10, 0, 0];
export const GENESIS_STONE_POSITION: readonly [number, number, number] = [10, 0.5, -8];

/** Registers "The Beginning" quest, its river trigger, and its 3 seed collectibles. Idempotent. Assumes setupGardenOfBeginnings has already registered the region/Elder NPC. */
export function setupTheBeginningQuest(worldManager: WorldManager, gameplayServices: GameplayServices): void {
  const { questRegistry, collectibleManager } = gameplayServices;

  if (!worldManager.triggerVolumeManager.has(RIVER_TRIGGER_ID)) {
    worldManager.triggerVolumeManager.register({
      id: RIVER_TRIGGER_ID,
      shape: createSphereTrigger(
        { x: RIVER_TRIGGER_CENTER[0], y: RIVER_TRIGGER_CENTER[1], z: RIVER_TRIGGER_CENTER[2] },
        8
      ),
    });
  }

  if (!questRegistry.has(THE_BEGINNING_QUEST_ID)) {
    questRegistry.register(
      createQuest({
        id: THE_BEGINNING_QUEST_ID,
        type: QuestType.MAIN,
        title: "The Beginning",
        description: "Walk the Garden as it was in the beginning, and learn its first lessons.",
        objectives: [
          createQuestObjective({
            id: OBJECTIVE_REACH_RIVER,
            description: "Walk to the river",
            objectiveType: QuestObjectiveType.REACH_LOCATION,
            targetId: RIVER_TRIGGER_ID,
          }),
          createQuestObjective({
            id: OBJECTIVE_INSPECT_TREE,
            description: "Inspect the ancient tree",
            objectiveType: QuestObjectiveType.USE_OBJECT,
            targetId: ANCIENT_TREE_ID,
          }),
          createQuestObjective({
            id: OBJECTIVE_READ_GENESIS,
            description: "Read Genesis 1",
            objectiveType: QuestObjectiveType.READ_SCRIPTURE,
            targetId: GENESIS_STONE_ID,
          }),
          createQuestObjective({
            id: OBJECTIVE_COLLECT_SEEDS,
            description: "Collect 3 glowing seeds",
            objectiveType: QuestObjectiveType.COLLECT,
            targetCount: 3,
            targetId: null,
          }),
          createQuestObjective({
            id: OBJECTIVE_RETURN_TO_ELDER,
            description: "Return to the Elder",
            objectiveType: QuestObjectiveType.TALK,
            targetId: ELDER_NPC_ID,
          }),
        ],
        rewardBundle: createRewardBundle("reward:the-beginning", [
          createReward(RewardType.EXPERIENCE, 150),
          createReward(RewardType.FAITH_POINTS, 50),
          createReward(RewardType.ACHIEVEMENT, null, "the-beginning-complete"),
        ]),
      })
    );
  }

  for (let i = 0; i < SEED_IDS.length; i += 1) {
    const seedId = SEED_IDS[i];
    const seedPosition = SEED_POSITIONS[i];
    if (!seedId || !seedPosition || collectibleManager.has(seedId)) {
      continue;
    }
    collectibleManager.register(
      createCollectible({
        id: seedId,
        category: CollectibleCategory.SEED,
        name: "Glowing Seed",
        position: { x: seedPosition[0], y: seedPosition[1], z: seedPosition[2] },
        effects: createCollectibleEffects({ itemId: SCRIPTURE_FRAGMENT_ITEM_ID, itemQuantity: 0 }),
      })
    );
  }

  if (!collectibleManager.has(GENESIS_STONE_ID)) {
    collectibleManager.register(
      createCollectible({
        id: GENESIS_STONE_ID,
        category: CollectibleCategory.SCRIPTURE_FRAGMENT,
        name: "Genesis Stone",
        position: {
          x: GENESIS_STONE_POSITION[0],
          y: GENESIS_STONE_POSITION[1],
          z: GENESIS_STONE_POSITION[2],
        },
        effects: createCollectibleEffects({
          itemId: SCRIPTURE_FRAGMENT_ITEM_ID,
          itemQuantity: 1,
          scriptureReward: {
            reference: {
              bookName: "Genesis",
              chapter: 1,
              verseStart: 1,
              verseEnd: 5,
              translationCode: "NIV",
            },
            source: "COLLECTIBLE",
            sourceId: GENESIS_STONE_ID,
          },
        }),
      })
    );
  }
}
