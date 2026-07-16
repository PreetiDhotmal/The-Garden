import type { FaithWorld } from "./faith-world";
import type { ScriptureReference } from "./scripture";

/**
 * Mirrors backend enum: com.thegarden.domain.quest.QuestStatus
 */
export type QuestStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";

/**
 * Mirrors backend DTO: com.thegarden.application.dto.QuestDto
 */
export interface Quest {
  readonly id: string;
  readonly world: FaithWorld;
  readonly title: string;
  readonly description: string;
  readonly scriptureReference: ScriptureReference;
  readonly status: QuestStatus;
  readonly objectiveIds: readonly string[];
}

/**
 * Mirrors backend DTO: com.thegarden.application.dto.QuestObjectiveDto
 */
export interface QuestObjective {
  readonly id: string;
  readonly questId: string;
  readonly description: string;
  readonly isComplete: boolean;
}
