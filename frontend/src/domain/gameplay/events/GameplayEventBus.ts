import { EventBus } from "@/domain/engine/events/EventBus";

/**
 * Every gameplay-level event, across all systems in this milestone.
 * Future systems (NPC AI, dialogue, worlds) subscribe through this —
 * they never call into another system's methods directly. This is
 * the event-driven architecture requirement made concrete.
 */
export interface GameplayEventMap {
  [key: string]: unknown;

  "quest:started": { questId: string };
  "quest:accepted": { questId: string };
  "quest:objective-progressed": {
    questId: string;
    objectiveId: string;
    currentCount: number;
    targetCount: number;
  };
  "quest:completed": { questId: string };
  "quest:reward-claimed": { questId: string };
  "quest:failed": { questId: string; reason: string };
  "quest:checkpoint-reached": { questId: string; checkpointId: string };

  "scripture:discovered": { referenceKey: string };
  "scripture:memorized": { referenceKey: string };
  "scripture:collected": { referenceKey: string };

  "interaction:entered-range": { targetId: string };
  "interaction:exited-range": { targetId: string };
  "interaction:started": { targetId: string };
  "interaction:finished": { targetId: string };
  "interaction:cancelled": { targetId: string };

  "collectible:picked": { collectibleId: string; category: string };

  "inventory:item-added": { itemId: string; quantity: number };
  "inventory:item-removed": { itemId: string; quantity: number };

  "reward:granted": { rewardType: string; amount: number | null };
  "save:completed": Record<string, never>;

  "player:leveled-up": { newLevel: number };

  "achievement:unlocked": { achievementId: string };

  "npc:interacted": { npcId: string; talkCount: number };

  "dialogue:started": { dialogueTreeId: string; npcId: string | null };
  "dialogue:node-changed": { dialogueTreeId: string; nodeId: string };
  "dialogue:finished": { dialogueTreeId: string; npcId: string | null };
  "dialogue:quest-offer-requested": { questId: string };
  "dialogue:scripture-display-requested": { referenceKey: string };
  "dialogue:quest-reward-claim-requested": { questId: string };
  "dialogue:objective-progress-requested": { questId: string; objectiveId: string };

  // --- Game framework events (Milestone: gameplay framework) ---
  "game:state-changed": { from: string; to: string };
  "chapter:unlocked": { chapterId: string };
  "chapter:completed": { chapterId: string };
  "level:started": { levelId: string };
  "level:completed": { levelId: string };
  "objective:completed": { objectiveId: string; levelId: string };
  "garden:restored": { chapterId: string };
  "reflection:opened": { levelId: string };
  "reflection:closed": { levelId: string };
  "checkpoint:reached": { checkpointId: string; levelId: string };
  "player:respawned": { playerId: string; checkpointId: string };
  "coop:player-joined": { playerId: string };
  "coop:player-left": { playerId: string };
  "transition:phase-changed": { phase: string };

  // --- Cooperative puzzle framework (Milestone: Level 1 Communication) ---
  /** A stage's objectives are all satisfied — the "success" reaction point. */
  "puzzle:stage-completed": { levelId: string; stageId: string };
  /** A player attempted the stage's mechanism incorrectly — deliberately NOT a failure/fail event: no punishment, just a fun, surprising, instantly-reset moment (Part 4). Audio/animation hooks react to this specifically, distinct from stage-completed. */
  "puzzle:attempt-missed": { levelId: string; stageId: string };
  /** Every stage in the level's sequence is complete. */
  "puzzle:level-completed": { levelId: string };
}

export type GameplayEventName = keyof GameplayEventMap;
export type GameplayEventBus = EventBus<GameplayEventMap>;

export function createGameplayEventBus(): GameplayEventBus {
  return new EventBus<GameplayEventMap>();
}
