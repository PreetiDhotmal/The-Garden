import type { Reward } from "./Reward";

export interface RewardGrantResult {
  readonly bundleId: string;
  readonly granted: readonly Reward[];
  readonly newTotalExperience: number;
  readonly newTotalFaithPoints: number;
  readonly newTotalCoins: number;
  readonly didLevelUp: boolean;
  readonly newLevel: number;
}
