import { describe, expect, it, vi } from "vitest";
import { createSceneId } from "@/domain/engine/world/SceneId";
import { createEngineEventBus } from "@/domain/engine/events/EngineEventBus";
import { SceneManager, SceneNotRegisteredError } from "./SceneManager";

describe("SceneManager", () => {
  it("registers a scene and retrieves it by id", () => {
    const manager = new SceneManager(createEngineEventBus());
    const sceneId = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");

    const scene = manager.register(sceneId);

    expect(manager.getScene(sceneId)).toBe(scene);
    expect(manager.isRegistered(sceneId)).toBe(true);
  });

  it("throws when getting an unregistered scene", () => {
    const manager = new SceneManager(createEngineEventBus());
    const sceneId = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");

    expect(() => manager.getScene(sceneId)).toThrow(SceneNotRegisteredError);
  });

  it("has no active scene before one is set", () => {
    const manager = new SceneManager(createEngineEventBus());
    expect(manager.getActiveSceneId()).toBeNull();
    expect(manager.getActiveScene()).toBeNull();
  });

  it("sets the active scene and emits transition events", () => {
    const eventBus = createEngineEventBus();
    const manager = new SceneManager(eventBus);
    const sceneId = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");
    manager.register(sceneId);

    const started = vi.fn();
    const completed = vi.fn();
    eventBus.on("scene:transition-started", started);
    eventBus.on("scene:transition-completed", completed);

    manager.setActiveScene(sceneId);

    expect(manager.getActiveSceneId()).toEqual(sceneId);
    expect(started).toHaveBeenCalledWith({
      fromSceneId: null,
      toSceneId: "GARDEN_OF_BEGINNINGS:eastern-grove",
    });
    expect(completed).toHaveBeenCalledWith({ sceneId: "GARDEN_OF_BEGINNINGS:eastern-grove" });
  });

  it("throws when activating an unregistered scene", () => {
    const manager = new SceneManager(createEngineEventBus());
    const sceneId = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");

    expect(() => {
      manager.setActiveScene(sceneId);
    }).toThrow(SceneNotRegisteredError);
  });

  it("is a no-op when re-activating the already-active scene", () => {
    const eventBus = createEngineEventBus();
    const manager = new SceneManager(eventBus);
    const sceneId = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");
    manager.register(sceneId);
    manager.setActiveScene(sceneId);

    const started = vi.fn();
    eventBus.on("scene:transition-started", started);
    manager.setActiveScene(sceneId);

    expect(started).not.toHaveBeenCalled();
  });

  it("clears the active scene when it is unregistered", () => {
    const manager = new SceneManager(createEngineEventBus());
    const sceneId = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");
    manager.register(sceneId);
    manager.setActiveScene(sceneId);

    manager.unregister(sceneId);

    expect(manager.getActiveSceneId()).toBeNull();
  });

  it("lists all registered scene ids", () => {
    const manager = new SceneManager(createEngineEventBus());
    const a = createSceneId("GARDEN_OF_BEGINNINGS", "eastern-grove");
    const b = createSceneId("GARDEN_OF_BEGINNINGS", "western-grove");
    manager.register(a);
    manager.register(b);

    expect(manager.listRegisteredSceneIds()).toHaveLength(2);
  });
});
