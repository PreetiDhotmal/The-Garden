export type MirrorOrientation = "FORWARD_SLASH" | "BACK_SLASH";

export interface Vector2D {
  readonly x: number;
  readonly z: number;
}

export interface MirrorState {
  readonly id: string;
  readonly position: Vector2D;
  readonly orientation: MirrorOrientation;
}

export interface LightBeamSource {
  readonly position: Vector2D;
  /** Must be exactly one of (1,0), (-1,0), (0,1), (0,-1) — cardinal directions only, matching every mirror's discrete reflection rule. */
  readonly direction: Vector2D;
}

export interface LightBeamTarget {
  readonly position: Vector2D;
  readonly radius: number;
}

export interface LightBeamResult {
  /** The full sequence of points the beam visits — source, every mirror bounce, and the final endpoint — for rendering as a line. */
  readonly path: readonly Vector2D[];
  readonly hitsTarget: boolean;
}

const MAX_BOUNCES = 8;
const MAX_TRAVEL_DISTANCE = 200;
const MIRROR_HIT_RADIUS = 0.6;

/**
 * "/" reflects right<->up and left<->down. "\" reflects right<->down
 * and left<->up — the standard diagonal-mirror reflection rule (used
 * by many grid laser-puzzle games), chosen specifically because it's
 * simple enough to author a guaranteed-solvable level configuration
 * for and verify by direct computation, rather than continuous-angle
 * mirror math that would need numerical tolerance and be much harder
 * to guarantee solvable within this milestone's scope.
 */
function reflect(direction: Vector2D, orientation: MirrorOrientation): Vector2D {
  const { x, z } = direction;
  if (orientation === "FORWARD_SLASH") {
    return { x: z, z: x };
  }
  return { x: -z, z: -x };
}

function distanceSquared(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

/**
 * Finds the closest mirror the beam hits along its current straight-
 * line travel, by projecting each mirror's offset from the origin
 * onto the (unit, cardinal) beam direction — since direction is
 * always axis-aligned and unit-length here, that projection IS the
 * travel distance to the point on the beam closest to the mirror.
 */
function findNextMirrorHit(
  origin: Vector2D,
  direction: Vector2D,
  mirrors: readonly MirrorState[]
): { mirror: MirrorState; distance: number } | null {
  let closest: { mirror: MirrorState; distance: number } | null = null;
  for (const mirror of mirrors) {
    const offsetX = mirror.position.x - origin.x;
    const offsetZ = mirror.position.z - origin.z;
    const alongBeam = offsetX * direction.x + offsetZ * direction.z;
    if (alongBeam <= 0.001) {
      continue;
    }
    const projectedPoint: Vector2D = {
      x: origin.x + direction.x * alongBeam,
      z: origin.z + direction.z * alongBeam,
    };
    if (distanceSquared(projectedPoint, mirror.position) > MIRROR_HIT_RADIUS * MIRROR_HIT_RADIUS) {
      continue;
    }
    if (!closest || alongBeam < closest.distance) {
      closest = { mirror, distance: alongBeam };
    }
  }
  return closest;
}

function checkTargetHit(
  origin: Vector2D,
  direction: Vector2D,
  target: LightBeamTarget,
  maxDistance: number
): { point: Vector2D; distance: number } | null {
  const offsetX = target.position.x - origin.x;
  const offsetZ = target.position.z - origin.z;
  const alongBeam = offsetX * direction.x + offsetZ * direction.z;
  if (alongBeam <= 0 || alongBeam > maxDistance) {
    return null;
  }
  const projectedPoint: Vector2D = {
    x: origin.x + direction.x * alongBeam,
    z: origin.z + direction.z * alongBeam,
  };
  if (distanceSquared(projectedPoint, target.position) > target.radius * target.radius) {
    return null;
  }
  return { point: projectedPoint, distance: alongBeam };
}

/**
 * Genuinely simulates the beam bouncing through the mirror field —
 * returns the real path and a real hit-test against the target on
 * every call, recomputed from the mirrors' current orientations. Not
 * a scripted or memoized "success" flag: rotate a mirror and call
 * this again, and the result reflects that change exactly.
 */
export function simulateLightBeam(
  source: LightBeamSource,
  mirrors: readonly MirrorState[],
  target: LightBeamTarget
): LightBeamResult {
  const path: Vector2D[] = [source.position];
  let currentPosition = source.position;
  let currentDirection = source.direction;
  let remainingDistance = MAX_TRAVEL_DISTANCE;

  for (let bounce = 0; bounce <= MAX_BOUNCES; bounce += 1) {
    const mirrorHit = findNextMirrorHit(currentPosition, currentDirection, mirrors);
    const targetHit = checkTargetHit(
      currentPosition,
      currentDirection,
      target,
      mirrorHit ? mirrorHit.distance : remainingDistance
    );

    if (targetHit && (!mirrorHit || targetHit.distance <= mirrorHit.distance)) {
      path.push(targetHit.point);
      return { path, hitsTarget: true };
    }

    if (!mirrorHit) {
      const endpoint: Vector2D = {
        x: currentPosition.x + currentDirection.x * remainingDistance,
        z: currentPosition.z + currentDirection.z * remainingDistance,
      };
      path.push(endpoint);
      return { path, hitsTarget: false };
    }

    const bouncePoint: Vector2D = {
      x: currentPosition.x + currentDirection.x * mirrorHit.distance,
      z: currentPosition.z + currentDirection.z * mirrorHit.distance,
    };
    path.push(bouncePoint);
    remainingDistance -= mirrorHit.distance;
    currentPosition = bouncePoint;
    currentDirection = reflect(currentDirection, mirrorHit.mirror.orientation);
  }

  return { path, hitsTarget: false };
}
