import { describe, expect, it, vi } from "vitest";
import { createWorldEventBus } from "@/domain/world/events/WorldEventBus";
import { createBoxTrigger, createSphereTrigger, triggerShapeContains } from "./TriggerShape";
import { DuplicateTriggerVolumeError, TriggerVolumeManager } from "./TriggerVolumeManager";

describe("triggerShapeContains", () => {
  it("checks containment for a box shape", () => {
    const box = createBoxTrigger({ x: 0, y: 0, z: 0 }, { x: 5, y: 5, z: 5 });
    expect(triggerShapeContains(box, { x: 1, y: 1, z: 1 })).toBe(true);
    expect(triggerShapeContains(box, { x: 10, y: 0, z: 0 })).toBe(false);
  });

  it("checks containment for a sphere shape", () => {
    const sphere = createSphereTrigger({ x: 0, y: 0, z: 0 }, 5);
    expect(triggerShapeContains(sphere, { x: 3, y: 0, z: 4 })).toBe(true); // distance 5
    expect(triggerShapeContains(sphere, { x: 6, y: 0, z: 0 })).toBe(false);
  });

  it("rejects a non-positive sphere radius", () => {
    expect(() => createSphereTrigger({ x: 0, y: 0, z: 0 }, 0)).toThrow(RangeError);
  });
});

describe("TriggerVolumeManager", () => {
  it("emits trigger:entered and calls onEnter when the player enters", () => {
    const eventBus = createWorldEventBus();
    const manager = new TriggerVolumeManager(eventBus);
    const onEnter = vi.fn();
    manager.register({ id: "clearing", shape: createSphereTrigger({ x: 0, y: 0, z: 0 }, 5), onEnter });
    const entered = vi.fn();
    eventBus.on("trigger:entered", entered);

    manager.update({ x: 1, y: 0, z: 0 });

    expect(entered).toHaveBeenCalledWith({ triggerId: "clearing" });
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(manager.isInside("clearing")).toBe(true);
  });

  it("emits trigger:exited and calls onExit when the player leaves", () => {
    const eventBus = createWorldEventBus();
    const manager = new TriggerVolumeManager(eventBus);
    const onExit = vi.fn();
    manager.register({ id: "clearing", shape: createSphereTrigger({ x: 0, y: 0, z: 0 }, 5), onExit });
    manager.update({ x: 1, y: 0, z: 0 });
    const exited = vi.fn();
    eventBus.on("trigger:exited", exited);

    manager.update({ x: 100, y: 0, z: 0 });

    expect(exited).toHaveBeenCalledWith({ triggerId: "clearing" });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("does not re-fire while the player stays inside", () => {
    const eventBus = createWorldEventBus();
    const manager = new TriggerVolumeManager(eventBus);
    manager.register({ id: "clearing", shape: createSphereTrigger({ x: 0, y: 0, z: 0 }, 5) });
    manager.update({ x: 1, y: 0, z: 0 });
    const entered = vi.fn();
    eventBus.on("trigger:entered", entered);

    manager.update({ x: 2, y: 0, z: 0 });

    expect(entered).not.toHaveBeenCalled();
  });

  it("throws when registering a duplicate trigger id", () => {
    const manager = new TriggerVolumeManager(createWorldEventBus());
    manager.register({ id: "clearing", shape: createSphereTrigger({ x: 0, y: 0, z: 0 }, 5) });
    expect(() => {
      manager.register({ id: "clearing", shape: createSphereTrigger({ x: 0, y: 0, z: 0 }, 5) });
    }).toThrow(DuplicateTriggerVolumeError);
  });

  it("supports multiple simultaneously-occupied triggers", () => {
    const manager = new TriggerVolumeManager(createWorldEventBus());
    manager.register({ id: "a", shape: createSphereTrigger({ x: 0, y: 0, z: 0 }, 10) });
    manager.register({ id: "b", shape: createSphereTrigger({ x: 0, y: 0, z: 0 }, 20) });

    manager.update({ x: 5, y: 0, z: 0 });

    expect([...manager.listInside()].sort()).toEqual(["a", "b"]);
  });
});
