import type { WorldEventBus } from "@/domain/world/events/WorldEventBus";
import type { WorldRegionRegistry } from "@/domain/world/region/WorldRegionRegistry";
import type { AssetManager } from "@/infrastructure/engine/assets/AssetManager";

/**
 * Thin orchestration over AssetManager.preload for a region's asset
 * list. Deliberately does not duplicate any caching/retry/progress
 * logic — that all lives in AssetManager already.
 */
export class WorldLoader {
  constructor(
    private readonly assetManager: AssetManager,
    private readonly regionRegistry: WorldRegionRegistry,
    private readonly eventBus: WorldEventBus
  ) {}

  async loadRegion(regionId: string): Promise<void> {
    const region = this.regionRegistry.get(regionId);
    await this.assetManager.preload(region.assetIds);
  }

  async loadWorld(worldId: string, regionIds: readonly string[]): Promise<void> {
    for (const regionId of regionIds) {
      await this.loadRegion(regionId);
    }
    this.eventBus.emit("world:loaded", { worldId });
  }
}
