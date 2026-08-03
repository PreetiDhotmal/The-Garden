import type { FaithWorld } from "@the-garden/shared-types";

/**
 * Identifies a single loadable scene within a faith world (a world may
 * be composed of multiple sub-scenes — e.g. distinct areas — even
 * though gameplay/world-unlock logic operates at the FaithWorld level).
 * Serializes to a stable string for use as a Map key / URL segment.
 */
export interface SceneId {
  readonly world: FaithWorld;
  readonly area: string;
}

export class InvalidSceneIdError extends Error {
  constructor(reason: string) {
    super(`Invalid scene id: ${reason}`);
    this.name = "InvalidSceneIdError";
  }
}

export function createSceneId(world: FaithWorld, area: string): SceneId {
  const trimmedArea = area.trim();
  if (trimmedArea.length === 0) {
    throw new InvalidSceneIdError("area must not be empty");
  }
  if (!/^[a-z0-9-]+$/.test(trimmedArea)) {
    throw new InvalidSceneIdError(
      `area "${trimmedArea}" must be lowercase kebab-case (letters, digits, hyphens only)`
    );
  }
  return { world, area: trimmedArea };
}

export function sceneIdToString(sceneId: SceneId): string {
  return `${sceneId.world}:${sceneId.area}`;
}

export function sceneIdsEqual(a: SceneId, b: SceneId): boolean {
  return a.world === b.world && a.area === b.area;
}
