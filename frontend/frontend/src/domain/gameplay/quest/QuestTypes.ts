export enum QuestType {
  MAIN = "MAIN",
  SIDE = "SIDE",
  DAILY = "DAILY",
  HIDDEN = "HIDDEN",
  TIMED = "TIMED",
}

/**
 * ACCEPTED and REWARD_CLAIMED are additive (Milestone 7) — the
 * existing LOCKED/AVAILABLE/ACTIVE/COMPLETED/FAILED flow from
 * Milestone 4 is unchanged and every quest built in Milestones 4-6
 * (Scripture Stones, the vertical slice) still works exactly as
 * before. ACCEPTED is an optional extra step before ACTIVE, for
 * NPC-offered quests where "accepting" from dialogue is a distinct
 * player action; REWARD_CLAIMED is reached via a new, separate
 * QuestEngine.claimReward() call, which doesn't change when the
 * reward itself is actually granted (still at complete()).
 */
export enum QuestStatus {
  LOCKED = "LOCKED",
  AVAILABLE = "AVAILABLE",
  ACCEPTED = "ACCEPTED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  REWARD_CLAIMED = "REWARD_CLAIMED",
  FAILED = "FAILED",
}
