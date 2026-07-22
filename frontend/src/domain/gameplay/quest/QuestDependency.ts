import type { QuestStatus } from "./QuestTypes";

export interface QuestDependency {
  readonly requiredQuestId: string;
  /** The status `requiredQuestId` must be in for this dependency to be satisfied — almost always COMPLETED, but modeled generally. */
  readonly requiredStatus: QuestStatus;
}

export function isDependencySatisfied(
  dependency: QuestDependency,
  statusOf: (questId: string) => QuestStatus | undefined
): boolean {
  return statusOf(dependency.requiredQuestId) === dependency.requiredStatus;
}
