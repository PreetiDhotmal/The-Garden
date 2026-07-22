import type { BoundingBox } from "./BoundingBox";

export interface WorldRegion {
  readonly id: string;
  readonly name: string;
  readonly bounds: BoundingBox;
  /** Asset ids (models, textures, HDRIs) this region needs loaded before it's shown — fed to AssetManager.preload. */
  readonly assetIds: readonly string[];
  /** Higher-priority regions stream in first when several become eligible simultaneously. */
  readonly streamingPriority: number;
}

export class InvalidWorldRegionError extends Error {
  constructor(reason: string) {
    super(`Invalid world region: ${reason}`);
    this.name = "InvalidWorldRegionError";
  }
}

export interface CreateWorldRegionInput {
  readonly id: string;
  readonly name: string;
  readonly bounds: BoundingBox;
  readonly assetIds?: readonly string[];
  readonly streamingPriority?: number;
}

export function createWorldRegion(input: CreateWorldRegionInput): WorldRegion {
  if (input.id.trim().length === 0) {
    throw new InvalidWorldRegionError("id must not be empty");
  }
  return {
    id: input.id,
    name: input.name,
    bounds: input.bounds,
    assetIds: input.assetIds ?? [],
    streamingPriority: input.streamingPriority ?? 0,
  };
}
