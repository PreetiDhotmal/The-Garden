import { createQuest } from "@/domain/gameplay/quest/Quest";
import { createQuestObjective } from "@/domain/gameplay/quest/QuestObjective";
import { QuestType } from "@/domain/gameplay/quest/QuestTypes";
import { createReward, RewardType } from "@/domain/gameplay/reward/Reward";
import { createRewardBundle } from "@/domain/gameplay/reward/RewardBundle";
import { createCollectible } from "@/domain/gameplay/collectible/CollectibleEntity";
import { createCollectibleEffects } from "@/domain/gameplay/collectible/CollectibleEffects";
import { CollectibleCategory } from "@/domain/gameplay/collectible/CollectibleCategory";
import { SCRIPTURE_FRAGMENT_ITEM_ID } from "@/presentation/gameplay/providers/GameplayProvider";
import type { GameplayServices } from "@/presentation/gameplay/providers/GameplayContext";

export const VERTICAL_SLICE_QUEST_ID = "quest:find-the-scripture-stone";
export const VERTICAL_SLICE_OBJECTIVE_ID = "touch-the-stone";
export const VERTICAL_SLICE_STONE_ID = "collectible:scripture-stone";

export const SCRIPTURE_STONE_REFERENCE = {
  bookName: "John",
  chapter: 3,
  verseStart: 16,
  verseEnd: null,
  translationCode: "NIV",
} as const;

/** Registers the one quest and one collectible the vertical slice demo needs. Idempotent — safe to call once per GameplayProvider mount. */
export function setupVerticalSliceContent(services: GameplayServices): void {
  const { questRegistry, collectibleManager } = services;

  if (!questRegistry.has(VERTICAL_SLICE_QUEST_ID)) {
    questRegistry.register(
      createQuest({
        id: VERTICAL_SLICE_QUEST_ID,
        type: QuestType.MAIN,
        title: "Find the Scripture Stone",
        description: "An ancient stone rests nearby, waiting to be discovered.",
        objectives: [
          createQuestObjective({
            id: VERTICAL_SLICE_OBJECTIVE_ID,
            description: "Touch the ancient stone",
          }),
        ],
        rewardBundle: createRewardBundle("reward:find-the-scripture-stone", [
          createReward(RewardType.EXPERIENCE, 25),
          createReward(RewardType.COINS, 10),
        ]),
      })
    );
  }

  if (!collectibleManager.has(VERTICAL_SLICE_STONE_ID)) {
    collectibleManager.register(
      createCollectible({
        id: VERTICAL_SLICE_STONE_ID,
        category: CollectibleCategory.SCRIPTURE_FRAGMENT,
        name: "Scripture Stone",
        position: { x: 4, y: 0.5, z: 4 },
        effects: createCollectibleEffects({
          itemId: SCRIPTURE_FRAGMENT_ITEM_ID,
          itemQuantity: 1,
          rewardBundle: createRewardBundle("reward:scripture-stone-pickup", [
            createReward(RewardType.FAITH_POINTS, 5),
            createReward(RewardType.ACHIEVEMENT, null, "first-scripture-fragment"),
          ]),
          scriptureReward: {
            reference: SCRIPTURE_STONE_REFERENCE,
            source: "COLLECTIBLE",
            sourceId: VERTICAL_SLICE_STONE_ID,
          },
        }),
      })
    );
  }
}
