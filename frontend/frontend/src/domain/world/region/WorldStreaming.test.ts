import { describe, expect, it, vi } from "vitest";
import { createWorldEventBus } from "@/domain/world/events/WorldEventBus";
import { createBoundingBox } from "./BoundingBox";
import { createWorldRegion } from "./WorldRegion";
import { WorldRegionRegistry } from "./WorldRegionRegistry";
import { DistanceBasedStreamingStrategy, WorldStreamingCoordinator } from "./WorldStreaming";

function buildRegistry(): WorldRegionRegistry {
  const registry = new WorldRegionRegistry();
  registry.registerAll([
    createWorldRegion({
      id: "near",
      name: "Near Region",
      bounds: createBoundingBox({ x: 0, y: 0, z: 0 }, { x: 5, y: 5, z: 5 }),
    }),
    createWorldRegion({
      id: "far",
      name: "Far Region",
      bounds: createBoundingBox({ x: 100, y: 0, z: 100 }, { x: 5, y: 5, z: 5 }),
    }),
  ]);
  return registry;
}

describe("DistanceBasedStreamingStrategy", () => {
  it("selects only regions within the stream-in distance", () => {
    const strategy = new DistanceBasedStreamingStrategy(20);
    const registry = buildRegistry();

    const eligible = strategy.selectEligibleRegions(registry.list(), { x: 0, y: 0, z: 0 });

    expect(eligible.map((r) => r.id)).toEqual(["near"]);
  });

  it("orders by streaming priority before proximity", () => {
    const strategy = new DistanceBasedStreamingStrategy(1000);
    const registry = new WorldRegionRegistry();
    registry.registerAll([
      createWorldRegion({
        id: "low-priority-close",
        name: "A",
        bounds: createBoundingBox({ x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }),
        streamingPriority: 0,
      }),
      createWorldRegion({
        id: "high-priority-far",
        name: "B",
        bounds: createBoundingBox({ x: 50, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }),
        streamingPriority: 10,
      }),
    ]);

    const eligible = strategy.selectEligibleRegions(registry.list(), { x: 0, y: 0, z: 0 });

    expect(eligible[0]?.id).toBe("high-priority-far");
  });

  it("rejects a non-positive stream-in distance", () => {
    expect(() => new DistanceBasedStreamingStrategy(0)).toThrow(RangeError);
  });
});

describe("WorldStreamingCoordinator", () => {
  it("emits region-streamed-in when a region becomes eligible", () => {
    const eventBus = createWorldEventBus();
    const coordinator = new WorldStreamingCoordinator(
      buildRegistry(),
      new DistanceBasedStreamingStrategy(20),
      eventBus
    );
    const streamedIn = vi.fn();
    eventBus.on("world:region-streamed-in", streamedIn);

    coordinator.update({ x: 0, y: 0, z: 0 });

    expect(streamedIn).toHaveBeenCalledWith({ regionId: "near" });
    expect(coordinator.getStreamedInRegionIds()).toEqual(["near"]);
  });

  it("emits region-streamed-out when a region is no longer eligible", () => {
    const eventBus = createWorldEventBus();
    const coordinator = new WorldStreamingCoordinator(
      buildRegistry(),
      new DistanceBasedStreamingStrategy(20),
      eventBus
    );
    coordinator.update({ x: 0, y: 0, z: 0 });
    const streamedOut = vi.fn();
    eventBus.on("world:region-streamed-out", streamedOut);

    coordinator.update({ x: 1000, y: 0, z: 1000 });

    expect(streamedOut).toHaveBeenCalledWith({ regionId: "near" });
  });

  it("does not re-emit for a region that stays eligible", () => {
    const eventBus = createWorldEventBus();
    const coordinator = new WorldStreamingCoordinator(
      buildRegistry(),
      new DistanceBasedStreamingStrategy(20),
      eventBus
    );
    coordinator.update({ x: 0, y: 0, z: 0 });
    const streamedIn = vi.fn();
    eventBus.on("world:region-streamed-in", streamedIn);

    coordinator.update({ x: 1, y: 0, z: 0 });

    expect(streamedIn).not.toHaveBeenCalled();
  });
});
