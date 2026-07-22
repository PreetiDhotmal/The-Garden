import type { RewardBundle } from "@/domain/gameplay/reward/RewardBundle";
import type { ScriptureReward } from "@/domain/gameplay/scripture/ScriptureReward";

export interface CollectibleEffects {
  readonly itemId: string | null;
  readonly itemQuantity: number;
  readonly rewardBundle: RewardBundle | null;
  readonly scriptureReward: ScriptureReward | null;
}

export function createCollectibleEffects(
  overrides: Partial<CollectibleEffects> = {}
): CollectibleEffects {
  return {
    itemId: overrides.itemId ?? null,
    itemQuantity: overrides.itemQuantity ?? 1,
    rewardBundle: overrides.rewardBundle ?? null,
    scriptureReward: overrides.scriptureReward ?? null,
  };
}
