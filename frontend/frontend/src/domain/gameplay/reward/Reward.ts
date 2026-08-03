export enum RewardType {
  EXPERIENCE = "EXPERIENCE",
  FAITH_POINTS = "FAITH_POINTS",
  COINS = "COINS",
  UNLOCKABLE = "UNLOCKABLE",
  ACHIEVEMENT = "ACHIEVEMENT",
  SCRIPTURE_UNLOCK = "SCRIPTURE_UNLOCK",
  ITEM = "ITEM",
}

/**
 * A single reward payload. Only the fields relevant to `type` are
 * populated — e.g. an EXPERIENCE reward sets `amount`, an ITEM reward
 * sets `itemId`/`amount`, an ACHIEVEMENT reward sets `referenceId`
 * only. This is deliberately one flexible shape rather than a
 * discriminated union of many reward classes, since RewardEngine and
 * every reward-consuming system only need to branch on `type` once.
 */
export interface Reward {
  readonly type: RewardType;
  readonly amount: number | null;
  /** Item id (ITEM), achievement id (ACHIEVEMENT), unlockable id (UNLOCKABLE), or scripture reference key (SCRIPTURE_UNLOCK). */
  readonly referenceId: string | null;
}

export function createReward(
  type: RewardType,
  amount: number | null = null,
  referenceId: string | null = null
): Reward {
  return { type, amount, referenceId };
}
