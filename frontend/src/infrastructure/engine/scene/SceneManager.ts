import { Scene } from "three";
import { sceneIdsEqual, sceneIdToString, type SceneId } from "@/domain/engine/world/SceneId";
import type { EngineEventBus } from "@/domain/engine/events/EngineEventBus";

export class SceneNotRegisteredError extends Error {
  constructor(sceneId: SceneId) {
    super(`Scene "${sceneIdToString(sceneId)}" has not been registered with SceneManager.`);
    this.name = "SceneNotRegisteredError";
  }
}

interface RegisteredScene {
  readonly sceneId: SceneId;
  readonly scene: Scene;
}

/**
 * Owns the set of loaded Three.js `Scene` instances and tracks which
 * one is currently active. Registering a scene does not load its
 * assets — pairing this with AssetManager.preload for the scene's
 * asset list is the caller's responsibility (typically a future
 * world-loading use-case in the application layer).
 */
export class SceneManager {
  private readonly scenesById = new Map<string, RegisteredScene>();
  private activeSceneId: SceneId | null = null;

  constructor(private readonly eventBus: EngineEventBus) {}

  register(sceneId: SceneId, scene: Scene = new Scene()): Scene {
    this.scenesById.set(sceneIdToString(sceneId), { sceneId, scene });
    return scene;
  }

  isRegistered(sceneId: SceneId): boolean {
    return this.scenesById.has(sceneIdToString(sceneId));
  }

  getScene(sceneId: SceneId): Scene {
    const entry = this.scenesById.get(sceneIdToString(sceneId));
    if (!entry) {
      throw new SceneNotRegisteredError(sceneId);
    }
    return entry.scene;
  }

  getActiveSceneId(): SceneId | null {
    return this.activeSceneId;
  }

  getActiveScene(): Scene | null {
    return this.activeSceneId ? this.getScene(this.activeSceneId) : null;
  }

  /**
   * Marks `sceneId` as active, emitting transition events so
   * presentation-layer components (e.g. a fade overlay) can react.
   * Does not itself perform any visual transition — see
   * SceneTransitionController for the fade timing state machine.
   */
  setActiveScene(sceneId: SceneId): void {
    if (!this.isRegistered(sceneId)) {
      throw new SceneNotRegisteredError(sceneId);
    }
    if (this.activeSceneId && sceneIdsEqual(this.activeSceneId, sceneId)) {
      return;
    }

    const fromSceneId = this.activeSceneId ? sceneIdToString(this.activeSceneId) : null;
    this.eventBus.emit("scene:transition-started", {
      fromSceneId,
      toSceneId: sceneIdToString(sceneId),
    });
    this.activeSceneId = sceneId;
    this.eventBus.emit("scene:transition-completed", { sceneId: sceneIdToString(sceneId) });
  }

  unregister(sceneId: SceneId): void {
    this.scenesById.delete(sceneIdToString(sceneId));
    if (this.activeSceneId && sceneIdsEqual(this.activeSceneId, sceneId)) {
      this.activeSceneId = null;
    }
  }

  listRegisteredSceneIds(): readonly SceneId[] {
    return Array.from(this.scenesById.values()).map((entry) => entry.sceneId);
  }
}
