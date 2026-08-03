import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";
import {
  boundingBoxContains,
  createBoundingBox,
  type BoundingBox,
} from "@/domain/world/region/BoundingBox";

export interface BoxTriggerShape {
  readonly kind: "box";
  readonly bounds: BoundingBox;
}

export interface SphereTriggerShape {
  readonly kind: "sphere";
  readonly center: Vector3Tuple;
  readonly radius: number;
}

export type TriggerShape = BoxTriggerShape | SphereTriggerShape;

export function createBoxTrigger(center: Vector3Tuple, halfExtents: Vector3Tuple): BoxTriggerShape {
  return { kind: "box", bounds: createBoundingBox(center, halfExtents) };
}

export function createSphereTrigger(center: Vector3Tuple, radius: number): SphereTriggerShape {
  if (radius <= 0) {
    throw new RangeError("radius must be greater than zero");
  }
  return { kind: "sphere", center, radius };
}

export function triggerShapeContains(shape: TriggerShape, point: Vector3Tuple): boolean {
  if (shape.kind === "box") {
    return boundingBoxContains(shape.bounds, point);
  }
  const distance = Math.hypot(
    point.x - shape.center.x,
    point.y - shape.center.y,
    point.z - shape.center.z
  );
  return distance <= shape.radius;
}
