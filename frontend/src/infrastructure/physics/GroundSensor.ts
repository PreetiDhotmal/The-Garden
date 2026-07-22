import { Ray, type World } from "@dimforge/rapier3d-compat";
import type { MovementTuning } from "@/domain/character/movement/MovementTuning";
import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";

export interface GroundSensorResult {
  readonly isGrounded: boolean;
  readonly groundDistance: number | null;
  readonly groundNormal: Vector3Tuple | null;
  readonly slopeAngleDegrees: number | null;
  readonly isSlopeTooSteep: boolean;
}

const UP: Vector3Tuple = { x: 0, y: 1, z: 0 };

function dot(a: Vector3Tuple, b: Vector3Tuple): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Casts a ray straight down from just above the capsule's feet to
 * determine grounded state, distance to ground, and slope angle.
 * Excludes the character's own rigid body from the raycast so it
 * doesn't hit its own collider.
 */
export class GroundSensor {
  constructor(private readonly world: World) {}

  sense(
    footPosition: Vector3Tuple,
    tuning: Pick<MovementTuning, "groundCheckDistance" | "slopeLimitDegrees">,
    excludeRigidBodyHandle?: number
  ): GroundSensorResult {
    // Cast from slightly above the foot to reliably catch the ground
    // even when the capsule is resting exactly on the surface.
    const castOriginHeight = 0.1;
    const ray = new Ray(
      { x: footPosition.x, y: footPosition.y + castOriginHeight, z: footPosition.z },
      { x: 0, y: -1, z: 0 }
    );
    const maxToi = castOriginHeight + tuning.groundCheckDistance;

    const hit = this.world.castRayAndGetNormal(
      ray,
      maxToi,
      true,
      undefined,
      undefined,
      undefined,
      excludeRigidBodyHandle !== undefined
        ? this.world.getRigidBody(excludeRigidBodyHandle)
        : undefined
    );

    if (!hit) {
      return {
        isGrounded: false,
        groundDistance: null,
        groundNormal: null,
        slopeAngleDegrees: null,
        isSlopeTooSteep: false,
      };
    }

    const groundDistance = hit.timeOfImpact - castOriginHeight;
    const normal: Vector3Tuple = { x: hit.normal.x, y: hit.normal.y, z: hit.normal.z };
    const slopeAngleDegrees = radiansToDegrees(Math.acos(Math.min(1, Math.max(-1, dot(normal, UP)))));

    return {
      isGrounded: groundDistance <= tuning.groundCheckDistance,
      groundDistance,
      groundNormal: normal,
      slopeAngleDegrees,
      isSlopeTooSteep: slopeAngleDegrees > tuning.slopeLimitDegrees,
    };
  }
}
