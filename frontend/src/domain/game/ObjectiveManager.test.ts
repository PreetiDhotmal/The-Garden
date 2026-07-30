import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { createQuestObjective, progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import { ObjectiveManager, UnknownObjectiveError } from "./ObjectiveManager";

function buildManager() {
  const eventBus = createGameplayEventBus();
  const first = createQuestObjective({ id: "obj:first", description: "First" });
  const second = createQuestObjective({
    id: "obj:second",
    description: "Second",
    dependsOnObjectiveIds: ["obj:first"],
  });
  const timed = createQuestObjective({
    id: "obj:timed",
    description: "Timed",
    timeLimitSeconds: 10,
  });
  const hidden = createQuestObjective({
    id: "obj:hidden",
    description: "Hidden",
    isHidden: true,
    dependsOnObjectiveIds: ["obj:first"],
  });
  const manager = new ObjectiveManager("level:test", [first, second, timed, hidden], eventBus);
  return { manager, eventBus, first, second, timed, hidden };
}

describe("ObjectiveManager", () => {
  it("an objective with no dependencies is available immediately", () => {
    const { manager } = buildManager();
    expect(manager.isAvailable("obj:first", 0)).toBe(true);
  });

  it("an objective with an unmet dependency is not available", () => {
    const { manager } = buildManager();
    expect(manager.isAvailable("obj:second", 0)).toBe(false);
  });

  it("becomes available once its dependency completes", () => {
    const { manager, first } = buildManager();
    manager.sync([progressObjective(first, 1)]);
    expect(manager.isAvailable("obj:second", 0)).toBe(true);
  });

  it("throws UnknownObjectiveError for an untracked id", () => {
    const { manager } = buildManager();
    expect(() => {
      manager.isAvailable("obj:does-not-exist", 0);
    }).toThrow(UnknownObjectiveError);
  });

  it("emits objective:completed exactly once when an objective transitions to complete", () => {
    const { manager, eventBus, first } = buildManager();
    const listener = vi.fn();
    eventBus.on("objective:completed", listener);

    manager.sync([progressObjective(first, 1)]);
    manager.sync([progressObjective(first, 1)]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ objectiveId: "obj:first", levelId: "level:test" });
  });

  it("untimed objectives report null time remaining", () => {
    const { manager } = buildManager();
    expect(manager.getTimeRemainingSeconds("obj:first", 0)).toBeNull();
  });

  it("a timed objective's clock starts when it first becomes available, not before", () => {
    const { manager } = buildManager();
    expect(manager.getTimeRemainingSeconds("obj:timed", 5)).toBeNull();
    manager.isAvailable("obj:timed", 5);
    expect(manager.getTimeRemainingSeconds("obj:timed", 8)).toBe(7);
  });

  it("isExpired is true once time remaining reaches zero", () => {
    const { manager } = buildManager();
    manager.isAvailable("obj:timed", 0);
    expect(manager.isExpired("obj:timed", 5)).toBe(false);
    expect(manager.isExpired("obj:timed", 10)).toBe(true);
    expect(manager.isExpired("obj:timed", 20)).toBe(true);
  });

  it("hidden objectives are excluded from listVisible until their dependency is met", () => {
    const { manager } = buildManager();
    const visibleIds = manager.listVisible(0).map((o) => o.id);
    expect(visibleIds).not.toContain("obj:hidden");
    expect(visibleIds).toContain("obj:first");
  });

  it("hidden objectives appear in listVisible once revealed", () => {
    const { manager, first } = buildManager();
    manager.sync([progressObjective(first, 1)]);
    const visibleIds = manager.listVisible(0).map((o) => o.id);
    expect(visibleIds).toContain("obj:hidden");
  });

  it("listAll always returns every tracked objective regardless of visibility", () => {
    const { manager } = buildManager();
    expect(manager.listAll()).toHaveLength(4);
  });
});
