import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";
import type { CollectibleCategory } from "./CollectibleCategory";
import type { CollectibleEffects } from "./CollectibleEffects";

export interface CollectibleEntity {
  readonly id: string;
  readonly category: CollectibleCategory;
  readonly name: string;
  readonly position: Vector3Tuple;
  readonly effects: CollectibleEffects;
}

export class InvalidCollectibleError extends Error {
  constructor(reason: string) {
    super(`Invalid collectible: ${reason}`);
    this.name = "InvalidCollectibleError";
  }
}

export interface CreateCollectibleInput {
  readonly id: string;
  readonly category: CollectibleCategory;
  readonly name: string;
  readonly position: Vector3Tuple;
  readonly effects: CollectibleEffects;
}

export function createCollectible(input: CreateCollectibleInput): CollectibleEntity {
  if (input.id.trim().length === 0) {
    throw new InvalidCollectibleError("id must not be empty");
  }
  return { ...input };
}
