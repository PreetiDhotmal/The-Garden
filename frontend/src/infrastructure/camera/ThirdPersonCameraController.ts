import { Ray, type World } from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";
import { CameraOrbitState, type ThirdPersonCameraConfig } from "@/domain/camera/CameraOrbitState";
import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";

export interface ThirdPersonCameraFrame {
  readonly position: Vector3Tuple;
  readonly lookAt: Vector3Tuple;
}

const COLLISION_PADDING = 0.3;

/**
 * Reads the target's world position each tick, resolves the desired
 * orbit via CameraOrbitState, casts a ray from the pivot back toward
 * the camera to detect obstructions, and returns the final clamped
 * camera position + look-at point. Presentation-layer
 * `<ThirdPersonCamera>` applies this to the actual R3F camera object.
 */
export class ThirdPersonCameraController {
  private readonly orbit: CameraOrbitState;

  constructor(
    config: ThirdPersonCameraConfig,
    private readonly world: World
  ) {
    this.orbit = new CameraOrbitState(config);
  }

  applyLookDelta(deltaYaw: number, deltaPitch: number): void {
    this.orbit.applyLookDelta(deltaYaw, deltaPitch);
  }

  applyZoomDelta(delta: number): void {
    this.orbit.applyZoomDelta(delta);
  }

  getOrbitState() {
    return this.orbit.getState();
  }

  restoreOrbitState(state: ReturnType<CameraOrbitState["getState"]>): void {
    this.orbit.restoreState(state);
  }

  update(targetPosition: Vector3Tuple, deltaSeconds: number): ThirdPersonCameraFrame {
    const config = this.orbit.getConfig();
    const pivot: Vector3Tuple = {
      x: targetPosition.x + config.shoulderOffsetX,
      y: targetPosition.y + config.shoulderOffsetY,
      z: targetPosition.z,
    };

    // Preliminary desired direction (before collision clamp) to aim the obstruction raycast.
    const preliminary = this.orbit.tick(0, null);
    const direction = orbitToDirection(preliminary.yaw, preliminary.pitch);

    const obstructionDistance = this.castObstructionRay(pivot, direction, config.maxDistance);
    const resolved = this.orbit.tick(deltaSeconds, obstructionDistance);

    const finalDirection = orbitToDirection(resolved.yaw, resolved.pitch);
    const position: Vector3Tuple = {
      x: pivot.x + finalDirection.x * resolved.distance,
      y: pivot.y + finalDirection.y * resolved.distance,
      z: pivot.z + finalDirection.z * resolved.distance,
    };

    return { position, lookAt: pivot };
  }

  private castObstructionRay(
    from: Vector3Tuple,
    direction: Vector3Tuple,
    maxDistance: number
  ): number | null {
    const ray = new Ray(from, direction);
    const hit = this.world.castRay(ray, maxDistance, true);
    if (!hit) {
      return null;
    }
    return Math.max(0, hit.timeOfImpact - COLLISION_PADDING);
  }
}

/** Converts yaw/pitch into a unit direction vector pointing from the pivot toward the camera. */
function orbitToDirection(yaw: number, pitch: number): Vector3Tuple {
  const vector = new Vector3(0, 0, 1)
    .applyAxisAngle(new Vector3(1, 0, 0), pitch)
    .applyAxisAngle(new Vector3(0, 1, 0), yaw);
  return { x: vector.x, y: vector.y, z: vector.z };
}
