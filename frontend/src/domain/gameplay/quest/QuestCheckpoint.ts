export interface QuestCheckpoint {
  readonly id: string;
  readonly description: string;
  /** The objective id that must be complete for this checkpoint to be considered reached. */
  readonly reachedAtObjectiveId: string;
}
