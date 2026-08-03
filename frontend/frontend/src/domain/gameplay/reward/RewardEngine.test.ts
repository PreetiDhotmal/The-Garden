import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { createReward, RewardType } from "./Reward";
import { createRewardBundle } from "./RewardBundle";
import { RewardEngine } from "./RewardEngine";

describe("RewardEngine", () => {
  it("applies an experience reward to totals", () => {
    const engine = new RewardEngine(createGameplayEventBus());
    const bundle = createRewardBundle("bundle-1", [createReward(RewardType.EXPERIENCE, 50)]);

    const result = engine.grant(bundle);

    expect(result.newTotalExperience).toBe(50);
    expect(engine.getTotals().experience).toBe(50);
  });

  it("applies multiple reward types from one bundle", () => {
    const engine = new RewardEngine(createGameplayEventBus());
    const bundle = createRewardBundle("bundle-1", [
      createReward(RewardType.EXPERIENCE, 30),
      createReward(RewardType.COINS, 10),
      createReward(RewardType.FAITH_POINTS, 5),
    ]);

    const result = engine.grant(bundle);

    expect(result.newTotalExperience).toBe(30);
    expect(result.newTotalCoins).toBe(10);
    expect(result.newTotalFaithPoints).toBe(5);
  });

  it("emits player:leveled-up when a grant crosses a level threshold", () => {
    const eventBus = createGameplayEventBus();
    const engine = new RewardEngine(eventBus);
    const leveledUp = vi.fn();
    eventBus.on("player:leveled-up", leveledUp);

    engine.grant(createRewardBundle("bundle-1", [createReward(RewardType.EXPERIENCE, 100)]));

    expect(leveledUp).toHaveBeenCalledWith({ newLevel: 2 });
  });

  it("does not emit leveled-up when no threshold is crossed", () => {
    const eventBus = createGameplayEventBus();
    const engine = new RewardEngine(eventBus);
    const leveledUp = vi.fn();
    eventBus.on("player:leveled-up", leveledUp);

    engine.grant(createRewardBundle("bundle-1", [createReward(RewardType.EXPERIENCE, 10)]));

    expect(leveledUp).not.toHaveBeenCalled();
  });

  it("emits achievement:unlocked for ACHIEVEMENT rewards", () => {
    const eventBus = createGameplayEventBus();
    const engine = new RewardEngine(eventBus);
    const unlocked = vi.fn();
    eventBus.on("achievement:unlocked", unlocked);

    engine.grant(
      createRewardBundle("bundle-1", [createReward(RewardType.ACHIEVEMENT, null, "first-verse")])
    );

    expect(unlocked).toHaveBeenCalledWith({ achievementId: "first-verse" });
  });

  it("emits reward:granted for every reward in the bundle", () => {
    const eventBus = createGameplayEventBus();
    const engine = new RewardEngine(eventBus);
    const granted = vi.fn();
    eventBus.on("reward:granted", granted);

    engine.grant(
      createRewardBundle("bundle-1", [
        createReward(RewardType.EXPERIENCE, 10),
        createReward(RewardType.COINS, 5),
      ])
    );

    expect(granted).toHaveBeenCalledTimes(2);
  });
});
