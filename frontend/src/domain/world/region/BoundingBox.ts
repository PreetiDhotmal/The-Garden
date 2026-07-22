import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";

export interface BoundingBox {
  readonly min: Vector3Tuple;
  readonly max: Vector3Tuple;
}

export function createBoundingBox(center: Vector3Tuple, halfExtents: Vector3Tuple): BoundingBox {
  return {
    min: { x: center.x - halfExtents.x, y: center.y - halfExtents.y, z: center.z - halfExtents.z },
    max: { x: center.x + halfExtents.x, y: center.y + halfExtents.y, z: center.z + halfExtents.z },
  };
}

export function boundingBoxContains(box: BoundingBox, point: Vector3Tuple): boolean {
  return (
    point.x >= box.min.x &&
    point.x <= box.max.x &&
    point.y >= box.min.y &&
    point.y <= box.max.y &&
    point.z >= box.min.z &&
    point.z <= box.max.z
  );
}

export function boundingBoxCenter(box: BoundingBox): Vector3Tuple {
  return {
    x: (box.min.x + box.max.x) / 2,
    y: (box.min.y + box.max.y) / 2,
    z: (box.min.z + box.max.z) / 2,
  };
}

/** Euclidean distance from `point` to the nearest point on/in the box — 0 if the point is inside. */
export function distanceToBoundingBox(box: BoundingBox, point: Vector3Tuple): number {
  const dx = Math.max(box.min.x - point.x, 0, point.x - box.max.x);
  const dy = Math.max(box.min.y - point.y, 0, point.y - box.max.y);
  const dz = Math.max(box.min.z - point.z, 0, point.z - box.max.z);
  return Math.hypot(dx, dy, dz);
}
