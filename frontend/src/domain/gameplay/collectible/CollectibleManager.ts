import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { RewardBundle } from "@/domain/gameplay/reward/RewardBundle";
import type { ScriptureReward } from "@/domain/gameplay/scripture/ScriptureReward";
import type { CollectibleEntity } from "./CollectibleEntity";

export class UnknownCollectibleError extends Error {
  constructor(readonly id: string) {
    super(`No collectible is registered with id "${id}".`);
    this.name = "UnknownCollectibleError";
  }
}

export interface CollectibleEffectHandlers {
  readonly grantItem?: (itemId: string, quantity: number) => void;
  readonly grantReward?: (bundle: RewardBundle) => void;
  readonly unlockScripture?: (reward: ScriptureReward) => void;
}

/**
 * Owns every spawned-but-not-yet-collected CollectibleEntity. Effect
 * application is entirely dependency-injected via
 * `CollectibleEffectHandlers` — this class never imports Inventory,
 * RewardEngine, or ScriptureProgress directly, so it has no idea
 * those systems exist beyond the callback shapes it's given.
 */
export class CollectibleManager {
  private readonly collectiblesById = new Map<string, CollectibleEntity>();

  constructor(
    private readonly eventBus: GameplayEventBus,
    private readonly handlers: CollectibleEffectHandlers = {}
  ) {}

  register(collectible: CollectibleEntity): void {
    this.collectiblesById.set(collectible.id, collectible);
  }

  has(id: string): boolean {
    return this.collectiblesById.has(id);
  }

  list(): readonly CollectibleEntity[] {
    return Array.from(this.collectiblesById.values());
  }

  /** Applies the collectible's effects, removes it from the world registry, and emits collectible:picked. */
  pickUp(id: string): CollectibleEntity {
    const collectible = this.collectiblesById.get(id);
    if (!collectible) {
      throw new UnknownCollectibleError(id);
    }

    const { effects } = collectible;
    if (effects.itemId && this.handlers.grantItem) {
      this.handlers.grantItem(effects.itemId, effects.itemQuantity);
    }
    if (effects.rewardBundle && this.handlers.grantReward) {
      this.handlers.grantReward(effects.rewardBundle);
    }
    if (effects.scriptureReward && this.handlers.unlockScripture) {
      this.handlers.unlockScripture(effects.scriptureReward);
    }

    this.collectiblesById.delete(id);
    this.eventBus.emit("collectible:picked", { collectibleId: id, category: collectible.category });
    return collectible;
  }
}
