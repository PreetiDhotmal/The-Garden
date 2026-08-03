import type { ScriptureReference } from "@the-garden/shared-types";
import { createSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import { createBoundingBox } from "@/domain/world/region/BoundingBox";
import { createWorldRegion } from "@/domain/world/region/WorldRegion";
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
import { createNpcDefinition } from "@/domain/gameplay/npc/NpcDefinition";
import type { DialogueTree } from "@/domain/gameplay/dialogue/DialogueTree";
import type { GameplayServices } from "@/presentation/gameplay/providers/GameplayContext";
import { SCRIPTURE_FRAGMENT_ITEM_ID } from "@/presentation/gameplay/providers/GameplayProvider";
import type { WorldManager } from "@/infrastructure/world/WorldManager";
import guideGreetingDialogue from "@/infrastructure/gameplay/data/dialogue/guide-greeting.json";
import travelerGreetingDialogue from "@/infrastructure/gameplay/data/dialogue/traveler-greeting.json";

export const WILDERNESS_REGION_ID = "region:the-wilderness";
export const WILDERNESS_QUEST_ID = "quest:the-wilderness";
export const GUIDE_NPC_ID = "npc:guide";
export const TRAVELER_NPC_ID = "npc:traveler";
export const DESERT_ENTRANCE_TRIGGER_ID = "trigger:desert-entrance";
export const MOUNTAIN_TRIGGER_ID = "trigger:wilderness-mountain";
export const OASIS_INTERACTABLE_ID = "interactable:oasis";
export const TEMPTATION_STONE_ID = "collectible:temptation-stone";
export const MATTHEW_STONE_ID = "collectible:matthew-stone";

export const OBJECTIVE_ENTER_DESERT = "objective:the-wilderness:enter-desert";
export const OBJECTIVE_FIND_WATER = "objective:the-wilderness:find-water";
export const OBJECTIVE_COLLECT_MANNA = "objective:the-wilderness:collect-manna";
export const OBJECTIVE_AVOID_TEMPTATION = "objective:the-wilderness:avoid-temptation";
export const OBJECTIVE_READ_SCRIPTURE = "objective:the-wilderness:read-scripture";
export const OBJECTIVE_HELP_TRAVELER = "objective:the-wilderness:help-traveler";
export const OBJECTIVE_REACH_MOUNTAIN = "objective:the-wilderness:reach-mountain";

export const MANNA_IDS: readonly string[] = [
  "collectible:manna-1",
  "collectible:manna-2",
  "collectible:manna-3",
];
export const MANNA_POSITIONS: readonly (readonly [number, number, number])[] = [
  [10, 0.4, -10],
  [-8, 0.4, -18],
  [4, 0.4, -28],
];

export const WORLD_WIDTH = 140;
export const WORLD_DEPTH = 140;
export const DESERT_ENTRANCE_CENTER: readonly [number, number, number] = [0, 0, -5];
export const OASIS_POSITION: readonly [number, number, number] = [-20, 0.4, -40];
export const TEMPTATION_STONE_POSITION: readonly [number, number, number] = [18, 0.5, -20];
export const MATTHEW_STONE_POSITION: readonly [number, number, number] = [15, 0.5, -45];
export const MOUNTAIN_TRIGGER_CENTER: readonly [number, number, number] = [0, 0, -65];
export const GUIDE_POSITION = { x: 2, y: 0, z: 6 };
export const TRAVELER_POSITION = { x: -12, y: 0, z: -25 };

/** Registers the Wilderness region, spawn point, quest, NPCs, and collectibles. Idempotent. */
export function setupTheWilderness(
  worldManager: WorldManager,
  gameplayServices: GameplayServices,
  groundHeightAt: (x: number, z: number) => number
): void {
  if (!worldManager.regionRegistry.list().some((region) => region.id === WILDERNESS_REGION_ID)) {
    worldManager.regionRegistry.register(
      createWorldRegion({
        id: WILDERNESS_REGION_ID,
        name: "The Wilderness",
        bounds: createBoundingBox({ x: 0, y: 0, z: 0 }, { x: 70, y: 30, z: 70 }),
        streamingPriority: 10,
      })
    );
  }

  const spawnHeight = groundHeightAt(0, 10);
  if (worldManager.spawnManager.list().length === 0) {
    worldManager.spawnManager.register(
      createSpawnPoint({ id: "spawn:wilderness-entrance", position: { x: 0, y: spawnHeight + 1, z: 10 } }),
      true
    );
  }

  if (!worldManager.triggerVolumeManager.has(DESERT_ENTRANCE_TRIGGER_ID)) {
    worldManager.triggerVolumeManager.register({
      id: DESERT_ENTRANCE_TRIGGER_ID,
      shape: createSphereTrigger(
        { x: DESERT_ENTRANCE_CENTER[0], y: DESERT_ENTRANCE_CENTER[1], z: DESERT_ENTRANCE_CENTER[2] },
        8
      ),
    });
  }
  if (!worldManager.triggerVolumeManager.has(MOUNTAIN_TRIGGER_ID)) {
    worldManager.triggerVolumeManager.register({
      id: MOUNTAIN_TRIGGER_ID,
      shape: createSphereTrigger(
        { x: MOUNTAIN_TRIGGER_CENTER[0], y: MOUNTAIN_TRIGGER_CENTER[1], z: MOUNTAIN_TRIGGER_CENTER[2] },
        10
      ),
    });
  }

  const { questRegistry, collectibleManager, npcRegistry, dialogueTreeRegistry } = gameplayServices;

  if (!questRegistry.has(WILDERNESS_QUEST_ID)) {
    questRegistry.register(
      createQuest({
        id: WILDERNESS_QUEST_ID,
        type: QuestType.MAIN,
        title: "The Wilderness",
        description: "Faith grows through trials. Cross the wilderness to reach the mountain.",
        objectives: [
          createQuestObjective({
            id: OBJECTIVE_ENTER_DESERT,
            description: "Walk into the desert",
            objectiveType: QuestObjectiveType.REACH_LOCATION,
            targetId: DESERT_ENTRANCE_TRIGGER_ID,
          }),
          createQuestObjective({
            id: OBJECTIVE_FIND_WATER,
            description: "Find clean water",
            objectiveType: QuestObjectiveType.USE_OBJECT,
            targetId: OASIS_INTERACTABLE_ID,
          }),
          createQuestObjective({
            id: OBJECTIVE_COLLECT_MANNA,
            description: "Collect manna",
            objectiveType: QuestObjectiveType.COLLECT,
            targetCount: MANNA_IDS.length,
            targetId: null,
          }),
          createQuestObjective({
            id: OBJECTIVE_AVOID_TEMPTATION,
            description: "Face temptation",
            objectiveType: QuestObjectiveType.USE_OBJECT,
            targetId: TEMPTATION_STONE_ID,
          }),
          createQuestObjective({
            id: OBJECTIVE_READ_SCRIPTURE,
            description: "Read Matthew 4",
            objectiveType: QuestObjectiveType.READ_SCRIPTURE,
            targetId: MATTHEW_STONE_ID,
          }),
          createQuestObjective({
            id: OBJECTIVE_HELP_TRAVELER,
            description: "Help another traveler",
            objectiveType: QuestObjectiveType.TALK,
            targetId: TRAVELER_NPC_ID,
          }),
          createQuestObjective({
            id: OBJECTIVE_REACH_MOUNTAIN,
            description: "Reach the mountain",
            objectiveType: QuestObjectiveType.REACH_LOCATION,
            targetId: MOUNTAIN_TRIGGER_ID,
          }),
        ],
        rewardBundle: createRewardBundle("reward:the-wilderness", [
          createReward(RewardType.EXPERIENCE, 300),
          createReward(RewardType.FAITH_POINTS, 100),
          createReward(RewardType.ACHIEVEMENT, null, "the-wilderness-complete"),
        ]),
      })
    );
  }

  for (let i = 0; i < MANNA_IDS.length; i += 1) {
    const mannaId = MANNA_IDS[i];
    const mannaPosition = MANNA_POSITIONS[i];
    if (!mannaId || !mannaPosition || collectibleManager.has(mannaId)) {
      continue;
    }
    collectibleManager.register(
      createCollectible({
        id: mannaId,
        category: CollectibleCategory.ARTIFACT,
        name: "Manna",
        position: { x: mannaPosition[0], y: mannaPosition[1], z: mannaPosition[2] },
        effects: createCollectibleEffects({ itemId: SCRIPTURE_FRAGMENT_ITEM_ID, itemQuantity: 0 }),
      })
    );
  }

  const scriptureReference = (
    bookName: string,
    chapter: number,
    verseStart: number,
    verseEnd: number
  ): ScriptureReference => ({ bookName, chapter, verseStart, verseEnd, translationCode: "NIV" });

  if (!collectibleManager.has(TEMPTATION_STONE_ID)) {
    collectibleManager.register(
      createCollectible({
        id: TEMPTATION_STONE_ID,
        category: CollectibleCategory.SCRIPTURE_FRAGMENT,
        name: "Weathered Stone",
        position: {
          x: TEMPTATION_STONE_POSITION[0],
          y: TEMPTATION_STONE_POSITION[1],
          z: TEMPTATION_STONE_POSITION[2],
        },
        effects: createCollectibleEffects({
          itemId: SCRIPTURE_FRAGMENT_ITEM_ID,
          itemQuantity: 1,
          scriptureReward: {
            reference: scriptureReference("Deuteronomy", 8, 2, 3),
            source: "COLLECTIBLE",
            sourceId: TEMPTATION_STONE_ID,
          },
        }),
      })
    );
  }

  if (!collectibleManager.has(MATTHEW_STONE_ID)) {
    collectibleManager.register(
      createCollectible({
        id: MATTHEW_STONE_ID,
        category: CollectibleCategory.SCRIPTURE_FRAGMENT,
        name: "Temptation Stone",
        position: {
          x: MATTHEW_STONE_POSITION[0],
          y: MATTHEW_STONE_POSITION[1],
          z: MATTHEW_STONE_POSITION[2],
        },
        effects: createCollectibleEffects({
          itemId: SCRIPTURE_FRAGMENT_ITEM_ID,
          itemQuantity: 1,
          scriptureReward: {
            reference: scriptureReference("Matthew", 4, 1, 4),
            source: "COLLECTIBLE",
            sourceId: MATTHEW_STONE_ID,
          },
        }),
      })
    );
  }

  if (!dialogueTreeRegistry.has("dialogue:guide-greeting")) {
    dialogueTreeRegistry.register(guideGreetingDialogue as unknown as DialogueTree);
  }
  if (!dialogueTreeRegistry.has("dialogue:traveler-greeting")) {
    dialogueTreeRegistry.register(travelerGreetingDialogue as unknown as DialogueTree);
  }

  if (!npcRegistry.has(GUIDE_NPC_ID)) {
    npcRegistry.register(
      createNpcDefinition({
        id: GUIDE_NPC_ID,
        name: "The Guide",
        worldRegionId: WILDERNESS_REGION_ID,
        dialogueTreeId: "dialogue:guide-greeting",
        isQuestGiver: true,
        questIds: [WILDERNESS_QUEST_ID],
        interactionRadius: 2.5,
        idleAnimationRole: "IDLE",
        talkAnimationRole: "TALK",
        walkAnimationRole: null,
        spawnPosition: { x: GUIDE_POSITION.x, y: spawnHeight, z: GUIDE_POSITION.z },
        wanderRadius: null,
      })
    );
  }

  if (!npcRegistry.has(TRAVELER_NPC_ID)) {
    npcRegistry.register(
      createNpcDefinition({
        id: TRAVELER_NPC_ID,
        name: "A Traveler",
        worldRegionId: WILDERNESS_REGION_ID,
        dialogueTreeId: "dialogue:traveler-greeting",
        isQuestGiver: false,
        questIds: [],
        interactionRadius: 2.5,
        idleAnimationRole: "IDLE",
        talkAnimationRole: "TALK",
        walkAnimationRole: null,
        spawnPosition: TRAVELER_POSITION,
        wanderRadius: null,
      })
    );
  }
}
