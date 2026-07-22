import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { createRewardBundle } from "@/domain/gameplay/reward/RewardBundle";
import { createReward, RewardType } from "@/domain/gameplay/reward/Reward";
import { CollectibleCategory } from "./CollectibleCategory";
import { createCollectibleEffects } from "./CollectibleEffects";
import { createCollectible } from "./CollectibleEntity";
import { CollectibleManager, UnknownCollectibleError } from "./CollectibleManager";

describe("CollectibleManager", () => {
  it("removes the collectible and emits collectible:picked on pickup", () => {
    const eventBus = createGameplayEventBus();
    const manager = new CollectibleManager(eventBus);
    const collectible = createCollectible({
      id: "flower-1",
      category: CollectibleCategory.FLOWER,
      name: "Lily",
      position: { x: 0, y: 0, z: 0 },
      effects: createCollectibleEffects(),
    });
    manager.register(collectible);
    const picked = vi.fn();
    eventBus.on("collectible:picked", picked);

    manager.pickUp("flower-1");

    expect(manager.has("flower-1")).toBe(false);
    expect(picked).toHaveBeenCalledWith({
      collectibleId: "flower-1",
      category: CollectibleCategory.FLOWER,
    });
  });

  it("invokes grantItem when the collectible has an item effect", () => {
    const grantItem = vi.fn();
    const manager = new CollectibleManager(createGameplayEventBus(), { grantItem });
    manager.register(
      createCollectible({
        id: "scroll-1",
        category: CollectibleCategory.SCROLL,
        name: "Scroll",
        position: { x: 0, y: 0, z: 0 },
        effects: createCollectibleEffects({ itemId: "scripture-fragment", itemQuantity: 1 }),
      })
    );

    manager.pickUp("scroll-1");

    expect(grantItem).toHaveBeenCalledWith("scripture-fragment", 1);
  });

  it("invokes grantReward when the collectible has a reward bundle", () => {
    const grantReward = vi.fn();
    const manager = new CollectibleManager(createGameplayEventBus(), { grantReward });
    const bundle = createRewardBundle("bundle-1", [createReward(RewardType.COINS, 5)]);
    manager.register(
      createCollectible({
        id: "coin-1",
        category: CollectibleCategory.COIN,
        name: "Coin",
        position: { x: 0, y: 0, z: 0 },
        effects: createCollectibleEffects({ rewardBundle: bundle }),
      })
    );

    manager.pickUp("coin-1");

    expect(grantReward).toHaveBeenCalledWith(bundle);
  });

  it("throws when picking up an unknown collectible", () => {
    const manager = new CollectibleManager(createGameplayEventBus());
    expect(() => manager.pickUp("missing")).toThrow(UnknownCollectibleError);
  });
});
