import type { CharacterSpawnPoint } from "@/domain/character/CharacterSpawnPoint";

export class DuplicateSpawnPointError extends Error {
  constructor(readonly id: string) {
    super(`A spawn point with id "${id}" is already registered.`);
    this.name = "DuplicateSpawnPointError";
  }
}

export class UnknownSpawnPointError extends Error {
  constructor(readonly id: string) {
    super(`No spawn point is registered with id "${id}".`);
    this.name = "UnknownSpawnPointError";
  }
}

export class NoDefaultSpawnPointError extends Error {
  constructor() {
    super("No default spawn point has been registered.");
    this.name = "NoDefaultSpawnPointError";
  }
}

/**
 * Registry of every named spawn point in a world, plus resolution
 * logic for "where should the player appear". Reuses
 * CharacterSpawnPoint (Milestone 3) rather than defining a new
 * position/facing type.
 */
export class SpawnManager {
  private readonly spawnPointsById = new Map<string, CharacterSpawnPoint>();
  private defaultSpawnPointId: string | null = null;

  register(spawnPoint: CharacterSpawnPoint, isDefault = false): void {
    if (this.spawnPointsById.has(spawnPoint.id)) {
      throw new DuplicateSpawnPointError(spawnPoint.id);
    }
    this.spawnPointsById.set(spawnPoint.id, spawnPoint);
    if (isDefault || this.defaultSpawnPointId === null) {
      this.defaultSpawnPointId = spawnPoint.id;
    }
  }

  get(id: string): CharacterSpawnPoint {
    const spawnPoint = this.spawnPointsById.get(id);
    if (!spawnPoint) {
      throw new UnknownSpawnPointError(id);
    }
    return spawnPoint;
  }

  /** Resolves the spawn point to use: `preferredId` if given and registered, else the default. */
  resolveSpawnPoint(preferredId?: string | null): CharacterSpawnPoint {
    if (preferredId && this.spawnPointsById.has(preferredId)) {
      return this.get(preferredId);
    }
    if (!this.defaultSpawnPointId) {
      throw new NoDefaultSpawnPointError();
    }
    return this.get(this.defaultSpawnPointId);
  }

  list(): readonly CharacterSpawnPoint[] {
    return Array.from(this.spawnPointsById.values());
  }
}
