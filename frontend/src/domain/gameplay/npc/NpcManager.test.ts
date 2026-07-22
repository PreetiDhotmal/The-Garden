import { describe, expect, it, vi } from "vitest";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { createNpcDefinition } from "./NpcDefinition";
import { NpcRegistry } from "./NpcRegistry";
import { NpcManager } from "./NpcManager";

function buildRegistry(): NpcRegistry {
  const registry = new NpcRegistry();
  registry.register(
    createNpcDefinition({
      id: "npc:elder",
      name: "The Elder",
      worldRegionId: "region:garden-of-beginnings",
      dialogueTreeId: "dialogue:elder-greeting",
      isQuestGiver: true,
      questIds: ["quest:garden-of-beginnings-shrines"],
      interactionRadius: 2.5,
      idleAnimationRole: "IDLE",
      talkAnimationRole: "TALK",
      walkAnimationRole: null,
      spawnPosition: { x: 0, y: 0, z: 0 },
      wanderRadius: null,
    })
  );
  return registry;
}

describe("NpcManager", () => {
  it("starts with initial (never-talked-to) state", () => {
    const manager = new NpcManager(buildRegistry(), createGameplayEventBus());
    const state = manager.getState("npc:elder");
    expect(state.hasBeenTalkedToOnce).toBe(false);
    expect(state.talkCount).toBe(0);
  });

  it("records an interaction and emits npc:interacted", () => {
    const eventBus = createGameplayEventBus();
    const manager = new NpcManager(buildRegistry(), eventBus);
    const interacted = vi.fn();
    eventBus.on("npc:interacted", interacted);

    manager.recordInteraction("npc:elder", "node:greeting");

    const state = manager.getState("npc:elder");
    expect(state.hasBeenTalkedToOnce).toBe(true);
    expect(state.talkCount).toBe(1);
    expect(state.lastDialogueNodeId).toBe("node:greeting");
    expect(interacted).toHaveBeenCalledWith({ npcId: "npc:elder", talkCount: 1 });
  });

  it("increments talk count across multiple interactions", () => {
    const manager = new NpcManager(buildRegistry(), createGameplayEventBus());
    manager.recordInteraction("npc:elder", "node:a");
    manager.recordInteraction("npc:elder", "node:b");

    expect(manager.getState("npc:elder").talkCount).toBe(2);
  });

  it("lists NPCs by world region", () => {
    const manager = new NpcManager(buildRegistry(), createGameplayEventBus());
    expect(manager.listByRegion("region:garden-of-beginnings")).toHaveLength(1);
    expect(manager.listByRegion("region:nowhere")).toHaveLength(0);
  });

  it("snapshots and restores state for save/load", () => {
    const manager = new NpcManager(buildRegistry(), createGameplayEventBus());
    manager.recordInteraction("npc:elder", "node:a");
    const snapshot = manager.snapshotState();

    const restored = new NpcManager(buildRegistry(), createGameplayEventBus());
    restored.restoreState(snapshot);

    expect(restored.getState("npc:elder").talkCount).toBe(1);
  });

  it("rejects a quest-giver NPC with no quest ids", () => {
    expect(() =>
      createNpcDefinition({
        id: "npc:bad",
        name: "Bad",
        worldRegionId: "region:x",
        dialogueTreeId: "dialogue:x",
        isQuestGiver: true,
        questIds: [],
        interactionRadius: 2,
        idleAnimationRole: "IDLE",
        talkAnimationRole: "TALK",
        walkAnimationRole: null,
        spawnPosition: { x: 0, y: 0, z: 0 },
        wanderRadius: null,
      })
    ).toThrow();
  });
});
