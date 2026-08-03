import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { RewardType, type Reward } from "./Reward";
import type { RewardBundle } from "./RewardBundle";
import type { RewardGrantResult } from "./RewardGrantResult";
import {
  addCoins,
  addExperience,
  addFaithPoints,
  INITIAL_PLAYER_PROGRESS,
  type PlayerProgressTotals,
} from "./PlayerProgressTotals";

/**
 * Owns cumulative player progress (experience/faith/coins/level) and
 * is the only place a RewardBundle is actually applied. Every other
 * system (quest completion, collectible pickup, achievement) grants
 * rewards *through* this — none of them mutate progress totals
 * directly.
 */
export class RewardEngine {
  private totals: PlayerProgressTotals = INITIAL_PLAYER_PROGRESS;

  constructor(private readonly eventBus: GameplayEventBus) {}

  getTotals(): PlayerProgressTotals {
    return this.totals;
  }

  /** For save/load — replaces totals wholesale rather than going through grant(), since this isn't a new reward. */
  restoreTotals(totals: PlayerProgressTotals): void {
    this.totals = totals;
  }

  grant(bundle: RewardBundle): RewardGrantResult {
    const levelBefore = this.totals.level;

    for (const reward of bundle.rewards) {
      this.applyReward(reward);
    }

    const didLevelUp = this.totals.level > levelBefore;
    if (didLevelUp) {
      this.eventBus.emit("player:leveled-up", { newLevel: this.totals.level });
    }

    return {
      bundleId: bundle.id,
      granted: bundle.rewards,
      newTotalExperience: this.totals.experience,
      newTotalFaithPoints: this.totals.faithPoints,
      newTotalCoins: this.totals.coins,
      didLevelUp,
      newLevel: this.totals.level,
    };
  }

  private applyReward(reward: Reward): void {
    switch (reward.type) {
      case RewardType.EXPERIENCE:
        this.totals = addExperience(this.totals, reward.amount ?? 0);
        break;
      case RewardType.FAITH_POINTS:
        this.totals = addFaithPoints(this.totals, reward.amount ?? 0);
        break;
      case RewardType.COINS:
        this.totals = addCoins(this.totals, reward.amount ?? 0);
        break;
      case RewardType.ACHIEVEMENT:
        if (reward.referenceId) {
          this.eventBus.emit("achievement:unlocked", { achievementId: reward.referenceId });
        }
        break;
      case RewardType.UNLOCKABLE:
      case RewardType.SCRIPTURE_UNLOCK:
      case RewardType.ITEM:
        // These reward types are fulfilled by their owning system
        // (ScriptureProgress.unlock, Inventory.addItem, an unlockables
        // registry) — RewardEngine only emits the notification here;
        // it doesn't reach into those systems directly, keeping this
        // class from depending on all of them.
        break;
      default: {
        const exhaustiveCheck: never = reward.type;
        throw new Error(`Unhandled reward type: ${String(exhaustiveCheck)}`);
      }
    }
    this.eventBus.emit("reward:granted", { rewardType: reward.type, amount: reward.amount });
  }
}
