import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";
import type { WorldEventBus } from "@/domain/world/events/WorldEventBus";
import { distanceToBoundingBox } from "./BoundingBox";
import type { WorldRegion } from "./WorldRegion";
import type { WorldRegionRegistry } from "./WorldRegionRegistry";

/**
 * Decides which regions should currently be streamed in. This is the
 * "architecture" the milestone asks for — a pluggable strategy
 * interface with one concrete distance-based implementation. A future
 * milestone could add a frustum-aware or budget-aware strategy without
 * touching WorldStreamingCoordinator.
 */
export interface WorldStreamingStrategy {
  selectEligibleRegions: (
    regions: readonly WorldRegion[],
    playerPosition: Vector3Tuple
  ) => readonly WorldRegion[];
}

/** Streams in any region within `streamInDistance` of the player, ordered by streamingPriority then proximity. */
export class DistanceBasedStreamingStrategy implements WorldStreamingStrategy {
  constructor(private readonly streamInDistance: number) {
    if (streamInDistance <= 0) {
      throw new RangeError("streamInDistance must be greater than zero");
    }
  }

  selectEligibleRegions(
    regions: readonly WorldRegion[],
    playerPosition: Vector3Tuple
  ): readonly WorldRegion[] {
    return regions
      .map((region) => ({ region, distance: distanceToBoundingBox(region.bounds, playerPosition) }))
      .filter(({ distance }) => distance <= this.streamInDistance)
      .sort(
        (a, b) => b.region.streamingPriority - a.region.streamingPriority || a.distance - b.distance
      )
      .map(({ region }) => region);
  }
}

/**
 * Tracks which regions are currently streamed in, re-evaluated each
 * time `update` is called (typically once per frame or on a throttled
 * interval — the caller decides). Emits region-streamed-in/out events
 * on transitions only, not every call.
 */
export class WorldStreamingCoordinator {
  private streamedInIds = new Set<string>();

  constructor(
    private readonly registry: WorldRegionRegistry,
    private readonly strategy: WorldStreamingStrategy,
    private readonly eventBus: WorldEventBus
  ) {}

  update(playerPosition: Vector3Tuple): void {
    const eligible = this.strategy.selectEligibleRegions(this.registry.list(), playerPosition);
    const eligibleIds = new Set(eligible.map((region) => region.id));

    for (const id of eligibleIds) {
      if (!this.streamedInIds.has(id)) {
        this.eventBus.emit("world:region-streamed-in", { regionId: id });
      }
    }
    for (const id of this.streamedInIds) {
      if (!eligibleIds.has(id)) {
        this.eventBus.emit("world:region-streamed-out", { regionId: id });
      }
    }
    this.streamedInIds = eligibleIds;
  }

  getStreamedInRegionIds(): readonly string[] {
    return Array.from(this.streamedInIds);
  }
}
