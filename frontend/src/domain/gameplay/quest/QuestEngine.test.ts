import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { createReward, RewardType } from "@/domain/gameplay/reward/Reward";
import { createRewardBundle } from "@/domain/gameplay/reward/RewardBundle";
import { RewardEngine } from "@/domain/gameplay/reward/RewardEngine";
import { createQuest } from "./Quest";
import { createQuestObjective } from "./QuestObjective";
import { QuestEngine, QuestNotActiveError, QuestNotAvailableError } from "./QuestEngine";
import { QuestRegistry } from "./QuestRegistry";
import { QuestStatus, QuestType } from "./QuestTypes";

function buildEngine() {
  const eventBus = createGameplayEventBus();
  const registry = new QuestRegistry();
  const rewardEngine = new RewardEngine(eventBus);
  const engine = new QuestEngine(registry, eventBus, rewardEngine);
  return { eventBus, registry, rewardEngine, engine };
}

function simpleQuest(id = "quest-1") {
  return createQuest({
    id,
    type: QuestType.SIDE,
    title: "Tend the Garden",
    description: "Water the seedlings.",
    objectives: [createQuestObjective({ id: "water", description: "Water 3 seedlings", targetCount: 3 })],
    rewardBundle: createRewardBundle(`${id}-reward`, [createReward(RewardType.EXPERIENCE, 20)]),
  });
}

describe("QuestEngine", () => {
  it("starts an AVAILABLE quest", () => {
    const { registry, engine, eventBus } = buildEngine();
    registry.register(simpleQuest());
    const started = vi.fn();
    eventBus.on("quest:started", started);

    const quest = engine.start("quest-1");

    expect(quest.status).toBe(QuestStatus.ACTIVE);
    expect(started).toHaveBeenCalledWith({ questId: "quest-1" });
  });

  it("throws when starting a quest that is not AVAILABLE", () => {
    const { registry, engine } = buildEngine();
    registry.register(simpleQuest());
    engine.start("quest-1");

    expect(() => engine.start("quest-1")).toThrow(QuestNotAvailableError);
  });

  it("throws when progressing an objective on a non-ACTIVE quest", () => {
    const { registry, engine } = buildEngine();
    registry.register(simpleQuest());

    expect(() => engine.progressObjective("quest-1", "water")).toThrow(QuestNotActiveError);
  });

  it("progresses an objective and emits the event", () => {
    const { registry, engine, eventBus } = buildEngine();
    registry.register(simpleQuest());
    engine.start("quest-1");
    const progressed = vi.fn();
    eventBus.on("quest:objective-progressed", progressed);

    engine.progressObjective("quest-1", "water", 1);

    expect(progressed).toHaveBeenCalledWith({
      questId: "quest-1",
      objectiveId: "water",
      currentCount: 1,
      targetCount: 3,
    });
  });

  it("completes the quest once all required objectives are done, and grants the reward", () => {
    const { registry, engine, eventBus } = buildEngine();
    registry.register(simpleQuest());
    engine.start("quest-1");
    const completed = vi.fn();
    const rewardGranted = vi.fn();
    eventBus.on("quest:completed", completed);
    eventBus.on("reward:granted", rewardGranted);

    const quest = engine.progressObjective("quest-1", "water", 3);

    expect(quest.status).toBe(QuestStatus.COMPLETED);
    expect(completed).toHaveBeenCalledWith({ questId: "quest-1" });
    expect(rewardGranted).toHaveBeenCalled();
  });

  it("unlocks a dependent quest once its dependency completes", () => {
    const { registry, engine } = buildEngine();
    const first = simpleQuest("quest-1");
    const second = createQuest({
      id: "quest-2",
      type: QuestType.SIDE,
      title: "Second quest",
      description: "Depends on the first.",
      objectives: [createQuestObjective({ id: "obj", description: "Do a thing" })],
      dependencies: [{ requiredQuestId: "quest-1", requiredStatus: QuestStatus.COMPLETED }],
      rewardBundle: createRewardBundle("quest-2-reward", []),
    });
    registry.register(first);
    registry.register(second);

    expect(registry.get("quest-2").status).toBe(QuestStatus.LOCKED);

    engine.start("quest-1");
    engine.progressObjective("quest-1", "water", 3);

    expect(registry.get("quest-2").status).toBe(QuestStatus.AVAILABLE);
  });

  it("emits checkpoint-reached when a checkpointed objective completes", () => {
    const { registry, engine, eventBus } = buildEngine();
    const quest = createQuest({
      id: "quest-1",
      type: QuestType.MAIN,
      title: "Main quest",
      description: "...",
      objectives: [
        createQuestObjective({ id: "first", description: "First step" }),
        createQuestObjective({ id: "second", description: "Second step" }),
      ],
      checkpoints: [{ id: "checkpoint-1", description: "Halfway", reachedAtObjectiveId: "first" }],
      isSequential: true,
      rewardBundle: createRewardBundle("reward", []),
    });
    registry.register(quest);
    engine.start("quest-1");
    const checkpointReached = vi.fn();
    eventBus.on("quest:checkpoint-reached", checkpointReached);

    engine.progressObjective("quest-1", "first", 1);

    expect(checkpointReached).toHaveBeenCalledWith({
      questId: "quest-1",
      checkpointId: "checkpoint-1",
    });
  });

  it("fails a quest and emits the event", () => {
    const { registry, engine, eventBus } = buildEngine();
    registry.register(simpleQuest());
    engine.start("quest-1");
    const failed = vi.fn();
    eventBus.on("quest:failed", failed);

    const quest = engine.fail("quest-1", "Ran out of time.");

    expect(quest.status).toBe(QuestStatus.FAILED);
    expect(failed).toHaveBeenCalledWith({ questId: "quest-1", reason: "Ran out of time." });
  });

  it("ignores optional objectives when determining completion", () => {
    const { registry, engine } = buildEngine();
    const quest = createQuest({
      id: "quest-1",
      type: QuestType.SIDE,
      title: "Optional test",
      description: "...",
      objectives: [
        createQuestObjective({ id: "required", description: "Required" }),
        createQuestObjective({ id: "optional", description: "Optional", isOptional: true }),
      ],
      rewardBundle: createRewardBundle("reward", []),
    });
    registry.register(quest);
    engine.start("quest-1");

    const updated = engine.progressObjective("quest-1", "required", 1);

    expect(updated.status).toBe(QuestStatus.COMPLETED);
  });

  it("accept() moves an AVAILABLE quest to ACCEPTED and emits the event", () => {
    const { registry, engine, eventBus } = buildEngine();
    registry.register(simpleQuest());
    const accepted = vi.fn();
    eventBus.on("quest:accepted", accepted);

    const quest = engine.accept("quest-1");

    expect(quest.status).toBe(QuestStatus.ACCEPTED);
    expect(accepted).toHaveBeenCalledWith({ questId: "quest-1" });
  });

  it("start() also works from ACCEPTED, not just AVAILABLE", () => {
    const { registry, engine } = buildEngine();
    registry.register(simpleQuest());
    engine.accept("quest-1");

    const quest = engine.start("quest-1");

    expect(quest.status).toBe(QuestStatus.ACTIVE);
  });

  it("start() still works directly from AVAILABLE (Milestone 4 behavior unchanged)", () => {
    const { registry, engine } = buildEngine();
    registry.register(simpleQuest());

    const quest = engine.start("quest-1");

    expect(quest.status).toBe(QuestStatus.ACTIVE);
  });

  it("claimReward() moves a COMPLETED quest to REWARD_CLAIMED without granting a second reward", () => {
    const { registry, engine, eventBus, rewardEngine } = buildEngine();
    registry.register(simpleQuest());
    engine.start("quest-1");
    engine.progressObjective("quest-1", "water", 3);
    const totalsAfterCompletion = rewardEngine.getTotals();

    const claimed = vi.fn();
    eventBus.on("quest:reward-claimed", claimed);
    const quest = engine.claimReward("quest-1");

    expect(quest.status).toBe(QuestStatus.REWARD_CLAIMED);
    expect(claimed).toHaveBeenCalledWith({ questId: "quest-1" });
    expect(rewardEngine.getTotals()).toEqual(totalsAfterCompletion);
  });

  it("claimReward() throws if the quest is not COMPLETED", () => {
    const { registry, engine } = buildEngine();
    registry.register(simpleQuest());

    expect(() => engine.claimReward("quest-1")).toThrow(QuestNotActiveError);
  });
});
