import type { Reward } from "./Reward";

export interface RewardBundle {
  readonly id: string;
  readonly rewards: readonly Reward[];
}

export function createRewardBundle(id: string, rewards: readonly Reward[]): RewardBundle {
  return { id, rewards };
}
