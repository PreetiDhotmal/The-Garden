import type { EngineEventBus } from "@/domain/engine/events/EngineEventBus";

/**
 * Tracks progress across a batch of concurrent asset loads and emits
 * aggregate `asset:preload-progress` / `asset:preload-completed`
 * events. This is deliberately not `THREE.LoadingManager` itself —
 * that class assumes all loading goes through THREE's loaders, which
 * isn't true here (Web Audio decoding doesn't). Instead this tracks
 * completion counts reported explicitly by AssetManager.
 */
export class LoadingManager {
  private total = 0;
  private loaded = 0;

  constructor(private readonly eventBus: EngineEventBus) {}

  beginBatch(total: number): void {
    this.total = total;
    this.loaded = 0;
  }

  reportItemLoaded(assetId: string): void {
    this.loaded += 1;
    this.eventBus.emit("asset:preload-progress", { loaded: this.loaded, total: this.total, assetId });
    if (this.loaded >= this.total) {
      this.eventBus.emit("asset:preload-completed", {});
    }
  }

  progress(): { loaded: number; total: number } {
    return { loaded: this.loaded, total: this.total };
  }

  isComplete(): boolean {
    return this.total > 0 && this.loaded >= this.total;
  }
}
