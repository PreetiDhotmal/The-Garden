import type { PerspectiveCamera, OrthographicCamera } from "three";

export type EngineCamera = PerspectiveCamera | OrthographicCamera;

export class CameraNotRegisteredError extends Error {
  constructor(readonly id: string) {
    super(`No camera is registered with id "${id}".`);
    this.name = "CameraNotRegisteredError";
  }
}

/**
 * Tracks every camera registered with the engine (gameplay cameras,
 * cinematic cameras, debug free-cam, etc.) and which one is active.
 * This class holds no opinion on *how* a camera moves — it is purely
 * a registry + active-selection, matching SceneManager's shape.
 */
export class CameraManager {
  private readonly camerasById = new Map<string, EngineCamera>();
  private activeCameraId: string | null = null;

  register(id: string, camera: EngineCamera): void {
    this.camerasById.set(id, camera);
    this.activeCameraId ??= id;
  }

  unregister(id: string): void {
    this.camerasById.delete(id);
    if (this.activeCameraId === id) {
      this.activeCameraId = null;
    }
  }

  get(id: string): EngineCamera {
    const camera = this.camerasById.get(id);
    if (!camera) {
      throw new CameraNotRegisteredError(id);
    }
    return camera;
  }

  setActive(id: string): void {
    if (!this.camerasById.has(id)) {
      throw new CameraNotRegisteredError(id);
    }
    this.activeCameraId = id;
  }

  getActiveId(): string | null {
    return this.activeCameraId;
  }

  getActiveCamera(): EngineCamera | null {
    return this.activeCameraId ? this.get(this.activeCameraId) : null;
  }

  listIds(): readonly string[] {
    return Array.from(this.camerasById.keys());
  }
}
