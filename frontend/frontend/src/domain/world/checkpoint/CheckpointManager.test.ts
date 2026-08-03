import { describe, expect, it, vi } from "vitest";
import { createWorldEventBus } from "@/domain/world/events/WorldEventBus";
import { CheckpointManager } from "./CheckpointManager";

describe("CheckpointManager", () => {
  it("records a checkpoint as reached and emits the event", () => {
    const eventBus = createWorldEventBus();
    const manager = new CheckpointManager(eventBus);
    const reached = vi.fn();
    eventBus.on("checkpoint:reached", reached);

    manager.reach("checkpoint-1");

    expect(manager.hasReached("checkpoint-1")).toBe(true);
    expect(reached).toHaveBeenCalledWith({ checkpointId: "checkpoint-1" });
  });

  it("does not re-emit for an already-reached checkpoint", () => {
    const eventBus = createWorldEventBus();
    const manager = new CheckpointManager(eventBus);
    manager.reach("checkpoint-1");
    const reached = vi.fn();
    eventBus.on("checkpoint:reached", reached);

    manager.reach("checkpoint-1");

    expect(reached).not.toHaveBeenCalled();
  });

  it("tracks the most recently reached checkpoint", () => {
    const manager = new CheckpointManager(createWorldEventBus());
    manager.reach("checkpoint-1");
    manager.reach("checkpoint-2");

    expect(manager.getMostRecentCheckpointId()).toBe("checkpoint-2");
  });

  it("lists all reached checkpoints", () => {
    const manager = new CheckpointManager(createWorldEventBus());
    manager.reach("checkpoint-1");
    manager.reach("checkpoint-2");

    expect(manager.listReached()).toHaveLength(2);
  });
});
