import type { WorldRegion } from "./WorldRegion";

export class DuplicateWorldRegionError extends Error {
  constructor(readonly id: string) {
    super(`A world region with id "${id}" is already registered.`);
    this.name = "DuplicateWorldRegionError";
  }
}

export class UnknownWorldRegionError extends Error {
  constructor(readonly id: string) {
    super(`No world region is registered with id "${id}".`);
    this.name = "UnknownWorldRegionError";
  }
}

export class WorldRegionRegistry {
  private readonly regionsById = new Map<string, WorldRegion>();

  register(region: WorldRegion): void {
    if (this.regionsById.has(region.id)) {
      throw new DuplicateWorldRegionError(region.id);
    }
    this.regionsById.set(region.id, region);
  }

  registerAll(regions: readonly WorldRegion[]): void {
    for (const region of regions) {
      this.register(region);
    }
  }

  get(id: string): WorldRegion {
    const region = this.regionsById.get(id);
    if (!region) {
      throw new UnknownWorldRegionError(id);
    }
    return region;
  }

  list(): readonly WorldRegion[] {
    return Array.from(this.regionsById.values());
  }
}
