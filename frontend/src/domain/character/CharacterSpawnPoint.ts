export interface Vector3Tuple {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface CharacterSpawnPoint {
  readonly id: string;
  readonly position: Vector3Tuple;
  /** Yaw in radians, 0 = facing -Z (Three.js/glTF forward convention). */
  readonly facingYaw: number;
}

export class InvalidSpawnPointError extends Error {
  constructor(reason: string) {
    super(`Invalid spawn point: ${reason}`);
    this.name = "InvalidSpawnPointError";
  }
}

export interface CreateSpawnPointInput {
  readonly id: string;
  readonly position: Vector3Tuple;
  readonly facingYaw?: number;
}

export function createSpawnPoint(input: CreateSpawnPointInput): CharacterSpawnPoint {
  if (input.id.trim().length === 0) {
    throw new InvalidSpawnPointError("id must not be empty");
  }
  return {
    id: input.id,
    position: input.position,
    facingYaw: input.facingYaw ?? 0,
  };
}
