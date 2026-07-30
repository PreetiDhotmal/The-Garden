import { describe, expect, it, vi } from "vitest";
import { createSpawnPoint } from "@/domain/character/CharacterSpawnPoint";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { createQuestObjective, progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import { SpawnManager } from "@/domain/world/spawn/SpawnManager";
import type { WorldManager } from "@/infrastructure/world/WorldManager";
import { LevelManager, NoActiveLevelError, UnknownLevelDefinitionError } from "./LevelManager";

function buildWorldManagerStub(): WorldManager {
  const spawnManager = new SpawnManager();
  spawnManager.register(
    createSpawnPoint({ id: "spawn:level-one", position: { x: 1, y: 0, z: 1 } }),
    true
  );
  // LevelManager only ever touches .spawnManager — a minimal stand-in is
  // appropriate here rather than constructing a full WorldManager, which
  // needs a real AssetManager this test has no use for.
  return { spawnManager } as unknown as WorldManager;
}

function buildLevelManager() {
  const eventBus = createGameplayEventBus();
  const worldManager = buildWorldManagerStub();
  const manager = new LevelManager(worldManager, eventBus);
  manager.register({
    levelId: "level:communication",
    chapterId: "chapter:communication",
    worldRegionId: "region:aqueduct",
    spawnPointId: "spawn:level-one",
    createObjectives: () => [
      createQuestObjective({ id: "obj:gate-1", description: "Open gate one" }),
      createQuestObjective({ id: "obj:gate-2", description: "Open gate two" }),
      createQuestObjective({ id: "obj:optional-secret", description: "Secret", isOptional: true }),
    ],
  });
  return { manager, eventBus };
}

describe("LevelManager", () => {
  it("throws UnknownLevelDefinitionError entering an unregistered level", () => {
    const { manager } = buildLevelManager();
    expect(() => {
      manager.enterLevel("level:does-not-exist");
    }).toThrow(UnknownLevelDefinitionError);
  });

  it("throws NoActiveLevelError for level-scoped queries before enterLevel", () => {
    const { manager } = buildLevelManager();
    expect(() => manager.getObjectiveManager()).toThrow(NoActiveLevelError);
    expect(() => manager.resolveSpawnPoint()).toThrow(NoActiveLevelError);
  });

  it("emits level:started on enterLevel", () => {
    const { manager, eventBus } = buildLevelManager();
    const listener = vi.fn();
    eventBus.on("level:started", listener);

    manager.enterLevel("level:communication");

    expect(listener).toHaveBeenCalledWith({ levelId: "level:communication" });
    expect(manager.getCurrentLevelId()).toBe("level:communication");
  });

  it("resolveSpawnPoint reuses WorldManager.spawnManager correctly", () => {
    const { manager } = buildLevelManager();
    manager.enterLevel("level:communication");
    const spawnPoint = manager.resolveSpawnPoint();
    expect(spawnPoint.id).toBe("spawn:level-one");
    expect(spawnPoint.position).toEqual({ x: 1, y: 0, z: 1 });
  });

  it("a fresh attempt's objectives all start incomplete", () => {
    const { manager } = buildLevelManager();
    manager.enterLevel("level:communication");
    expect(manager.isLevelComplete()).toBe(false);
  });

  it("isLevelComplete becomes true once every required objective is complete, ignoring the optional one", () => {
    const { manager } = buildLevelManager();
    manager.enterLevel("level:communication");
    const objectiveManager = manager.getObjectiveManager();
    const [gateOne, gateTwo] = objectiveManager.listAll();
    if (!gateOne || !gateTwo) {
      throw new Error("Test fixture is missing expected objectives.");
    }

    objectiveManager.sync([progressObjective(gateOne, 1), progressObjective(gateTwo, 1)]);

    expect(manager.isLevelComplete()).toBe(true);
  });

  it("isLevelComplete stays false if only some required objectives are complete", () => {
    const { manager } = buildLevelManager();
    manager.enterLevel("level:communication");
    const objectiveManager = manager.getObjectiveManager();
    const [gateOne] = objectiveManager.listAll();
    if (!gateOne) {
      throw new Error("Test fixture is missing expected objective.");
    }

    objectiveManager.sync([progressObjective(gateOne, 1)]);

    expect(manager.isLevelComplete()).toBe(false);
  });

  it("restartLevel produces a genuinely fresh objective attempt", () => {
    const { manager, eventBus } = buildLevelManager();
    manager.enterLevel("level:communication");
    const objectiveManager = manager.getObjectiveManager();
    const [gateOne] = objectiveManager.listAll();
    if (!gateOne) {
      throw new Error("Test fixture is missing expected objective.");
    }
    objectiveManager.sync([progressObjective(gateOne, 1)]);

    const listener = vi.fn();
    eventBus.on("level:started", listener);
    manager.restartLevel();

    expect(listener).toHaveBeenCalledWith({ levelId: "level:communication" });
    const freshFirstObjective = manager.getObjectiveManager().listAll()[0];
    expect(freshFirstObjective?.currentCount).toBe(0);
  });

  it("exitLevel clears the current level entirely", () => {
    const { manager } = buildLevelManager();
    manager.enterLevel("level:communication");
    manager.exitLevel();
    expect(manager.getCurrentLevelId()).toBeNull();
    expect(() => manager.getObjectiveManager()).toThrow(NoActiveLevelError);
  });

  it("completeLevel emits level:completed for the current level", () => {
    const { manager, eventBus } = buildLevelManager();
    manager.enterLevel("level:communication");
    const listener = vi.fn();
    eventBus.on("level:completed", listener);

    manager.completeLevel();

    expect(listener).toHaveBeenCalledWith({ levelId: "level:communication" });
  });

  it("completeLevel throws NoActiveLevelError if no level is active", () => {
    const { manager } = buildLevelManager();
    expect(() => {
      manager.completeLevel();
    }).toThrow(NoActiveLevelError);
  });
});
