import type { ScriptureReference } from "@the-garden/shared-types";
import { createSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import { createBoundingBox } from "@/domain/world/region/BoundingBox";
import { createWorldRegion } from "@/domain/world/region/WorldRegion";
import { createSphereTrigger } from "@/domain/world/trigger/TriggerShape";
import { createQuest } from "@/domain/gameplay/quest/Quest";
import { createQuestObjective } from "@/domain/gameplay/quest/QuestObjective";
import { QuestType } from "@/domain/gameplay/quest/QuestTypes";
import { createReward, RewardType } from "@/domain/gameplay/reward/Reward";
import { createRewardBundle } from "@/domain/gameplay/reward/RewardBundle";
import { createCollectible } from "@/domain/gameplay/collectible/CollectibleEntity";
import { createCollectibleEffects } from "@/domain/gameplay/collectible/CollectibleEffects";
import { CollectibleCategory } from "@/domain/gameplay/collectible/CollectibleCategory";
import type { GameplayServices } from "@/presentation/gameplay/providers/GameplayContext";
import { SCRIPTURE_FRAGMENT_ITEM_ID } from "@/presentation/gameplay/providers/GameplayProvider";
import type { WorldManager } from "@/infrastructure/world/WorldManager";
import { createNpcDefinition } from "@/domain/gameplay/npc/NpcDefinition";
import elderGreetingDialogue from "@/infrastructure/gameplay/data/dialogue/elder-greeting.json";
import type { DialogueTree } from "@/domain/gameplay/dialogue/DialogueTree";

export const ELDER_NPC_ID = "npc:elder";

export const GARDEN_REGION_ID = "region:garden-of-beginnings";
export const GARDEN_QUEST_ID = "quest:garden-of-beginnings-shrines";
export const SACRED_CLEARING_TRIGGER_ID = "trigger:sacred-clearing";

export interface ScriptureStoneDefinition {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly reference: ScriptureReference;
  readonly promptText: string;
}

/** Three hand-placed Scripture Stones, matching the world layout described in the milestone (garden / forest / sacred clearing). */
export const SCRIPTURE_STONES: readonly ScriptureStoneDefinition[] = [
  {
    id: "collectible:stone-garden",
    position: [6, 0.5, 2],
    reference: {
      bookName: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: null,
      translationCode: "NIV",
    },
    promptText: "Read the Garden Stone",
  },
  {
    id: "collectible:stone-forest",
    position: [-14, 0.5, 10],
    reference: {
      bookName: "Joshua",
      chapter: 1,
      verseStart: 9,
      verseEnd: null,
      translationCode: "NIV",
    },
    promptText: "Read the Forest Stone",
  },
  {
    id: "collectible:stone-shrine",
    position: [0, 0.5, -22],
    reference: {
      bookName: "Psalm",
      chapter: 23,
      verseStart: 1,
      verseEnd: null,
      translationCode: "NIV",
    },
    promptText: "Read the Shrine Stone",
  },
];

/** Registers the world region, spawn point, sacred-clearing trigger, quest, and Scripture Stone collectibles. Idempotent. */
export function setupGardenOfBeginnings(
  worldManager: WorldManager,
  gameplayServices: GameplayServices,
  groundHeightAt: (x: number, z: number) => number
): void {
  if (!worldManager.regionRegistry.list().some((region) => region.id === GARDEN_REGION_ID)) {
    worldManager.regionRegistry.register(
      createWorldRegion({
        id: GARDEN_REGION_ID,
        name: "Garden of Beginnings",
        bounds: createBoundingBox({ x: 0, y: 0, z: 0 }, { x: 60, y: 30, z: 60 }),
        streamingPriority: 10,
      })
    );
  }

  const spawnHeight = groundHeightAt(0, 0);
  if (worldManager.spawnManager.list().length === 0) {
    worldManager.spawnManager.register(
      createSpawnPoint({ id: "spawn:garden-entrance", position: { x: 0, y: spawnHeight + 1, z: 8 } }),
      true
    );
  }

  if (!worldManager.triggerVolumeManager.has(SACRED_CLEARING_TRIGGER_ID)) {
    worldManager.triggerVolumeManager.register({
      id: SACRED_CLEARING_TRIGGER_ID,
      shape: createSphereTrigger({ x: 0, y: 0, z: -22 }, 10),
    });
  }

  const { questRegistry, collectibleManager } = gameplayServices;

  if (!questRegistry.has(GARDEN_QUEST_ID)) {
    questRegistry.register(
      createQuest({
        id: GARDEN_QUEST_ID,
        type: QuestType.MAIN,
        title: "Stones of the Garden",
        description:
          "Three ancient stones rest throughout the Garden of Beginnings, each bearing scripture.",
        objectives: SCRIPTURE_STONES.map((stone) =>
          createQuestObjective({
            id: stone.id,
            description: `Read the ${stone.promptText.replace("Read the ", "")}`,
          })
        ),
        rewardBundle: createRewardBundle("reward:garden-of-beginnings-shrines", [
          createReward(RewardType.EXPERIENCE, 100),
          createReward(RewardType.COINS, 25),
          createReward(RewardType.ACHIEVEMENT, null, "garden-of-beginnings-complete"),
        ]),
      })
    );
  }

  for (const stone of SCRIPTURE_STONES) {
    if (collectibleManager.has(stone.id)) {
      continue;
    }
    collectibleManager.register(
      createCollectible({
        id: stone.id,
        category: CollectibleCategory.SCRIPTURE_FRAGMENT,
        name: "Scripture Stone",
        position: { x: stone.position[0], y: stone.position[1], z: stone.position[2] },
        effects: createCollectibleEffects({
          itemId: SCRIPTURE_FRAGMENT_ITEM_ID,
          itemQuantity: 1,
          scriptureReward: { reference: stone.reference, source: "COLLECTIBLE", sourceId: stone.id },
        }),
      })
    );
  }

  const { npcRegistry, dialogueTreeRegistry, worldProgressionManager } = gameplayServices;

  if (!dialogueTreeRegistry.has("dialogue:elder-greeting")) {
    // JSON module imports are structurally widened by TypeScript (e.g.
    // event `kind` fields infer as `string`, not the discriminated
    // union's literal types) — the explicit double-cast documents that
    // this is trusted, convention-validated JSON data, not something
    // TS can structurally verify against DialogueTree on its own.
    dialogueTreeRegistry.register(elderGreetingDialogue as unknown as DialogueTree);
  }

  if (!npcRegistry.has(ELDER_NPC_ID)) {
    npcRegistry.register(
      createNpcDefinition({
        id: ELDER_NPC_ID,
        name: "The Elder",
        worldRegionId: GARDEN_REGION_ID,
        dialogueTreeId: "dialogue:elder-greeting",
        isQuestGiver: true,
        questIds: [GARDEN_QUEST_ID],
        interactionRadius: 2.5,
        idleAnimationRole: "IDLE",
        talkAnimationRole: "TALK",
        walkAnimationRole: null,
        spawnPosition: { x: -3, y: spawnHeight, z: 3 },
        wanderRadius: null,
      })
    );
  }

  if (!worldProgressionManager.has(GARDEN_REGION_ID)) {
    worldProgressionManager.register({
      worldRegionId: GARDEN_REGION_ID,
      displayName: "Garden of Beginnings",
      unlockConditions: [],
      completionConditions: [{ kind: "QUEST_COMPLETED", questId: GARDEN_QUEST_ID }],
      isFutureDlc: false,
    });
  }
}
