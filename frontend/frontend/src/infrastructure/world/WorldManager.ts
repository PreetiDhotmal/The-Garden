import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";
import { createWorldEventBus, type WorldEventBus } from "@/domain/world/events/WorldEventBus";
import { WorldRegionRegistry } from "@/domain/world/region/WorldRegionRegistry";
import {
  DistanceBasedStreamingStrategy,
  WorldStreamingCoordinator,
} from "@/domain/world/region/WorldStreaming";
import { SpawnManager } from "@/domain/world/spawn/SpawnManager";
import { CheckpointManager } from "@/domain/world/checkpoint/CheckpointManager";
import { TriggerVolumeManager } from "@/domain/world/trigger/TriggerVolumeManager";
import { WeatherManager } from "@/domain/world/weather/WeatherManager";
import type { AssetManager } from "@/infrastructure/engine/assets/AssetManager";
import { WorldLoader } from "./WorldLoader";

const DEFAULT_STREAM_IN_DISTANCE = 60;

export interface WorldManagerOptions {
  readonly streamInDistance?: number;
}

/**
 * The facade every presentation-layer world component talks to.
 * Composes the domain world systems (region registry, streaming,
 * spawn, checkpoint, trigger, weather) with the existing AssetManager
 * (Milestone 2) via WorldLoader — this class does not implement asset
 * loading itself.
 */
export class WorldManager {
  readonly eventBus: WorldEventBus;
  readonly regionRegistry: WorldRegionRegistry;
  readonly streamingCoordinator: WorldStreamingCoordinator;
  readonly spawnManager: SpawnManager;
  readonly checkpointManager: CheckpointManager;
  readonly triggerVolumeManager: TriggerVolumeManager;
  readonly weatherManager: WeatherManager;
  readonly worldLoader: WorldLoader;

  constructor(assetManager: AssetManager, options: WorldManagerOptions = {}) {
    this.eventBus = createWorldEventBus();
    this.regionRegistry = new WorldRegionRegistry();
    this.streamingCoordinator = new WorldStreamingCoordinator(
      this.regionRegistry,
      new DistanceBasedStreamingStrategy(options.streamInDistance ?? DEFAULT_STREAM_IN_DISTANCE),
      this.eventBus
    );
    this.spawnManager = new SpawnManager();
    this.checkpointManager = new CheckpointManager(this.eventBus);
    this.triggerVolumeManager = new TriggerVolumeManager(this.eventBus);
    this.weatherManager = new WeatherManager(this.eventBus);
    this.worldLoader = new WorldLoader(assetManager, this.regionRegistry, this.eventBus);
  }

  /** Call once per frame (or on a throttled interval) with the player's world-space position. */
  update(playerPosition: Vector3Tuple): void {
    this.streamingCoordinator.update(playerPosition);
    this.triggerVolumeManager.update(playerPosition);
  }
}
