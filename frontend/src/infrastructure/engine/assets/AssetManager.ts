import { AssetType } from "@/domain/engine/assets/AssetType";
import type { AssetDescriptor } from "@/domain/engine/assets/AssetDescriptor";
import type { AssetRegistry } from "@/domain/engine/assets/AssetRegistry";
import type { AssetConfig } from "@/domain/engine/config/AssetConfig";
import { DEFAULT_ASSET_CONFIG } from "@/domain/engine/config/AssetConfig";
import type { EngineEventBus } from "@/domain/engine/events/EngineEventBus";
import { AssetCache } from "./AssetCache";
import { loadModel } from "./loaders/ModelLoader";
import { loadTexture } from "./loaders/TextureLoader";
import { loadHdri } from "./loaders/HdriLoader";
import { loadAudio } from "./loaders/AudioLoader";
import { loadAnimationClips } from "./loaders/AnimationLoader";
import { LoadingManager } from "../loading/LoadingManager";

const RETRY_BACKOFF_MS = 250;

async function loadByType(descriptor: AssetDescriptor): Promise<unknown> {
  switch (descriptor.type) {
    case AssetType.MODEL:
      return loadModel(descriptor.url);
    case AssetType.TEXTURE:
      return loadTexture(descriptor.url);
    case AssetType.HDRI:
      return loadHdri(descriptor.url);
    case AssetType.AUDIO:
      return loadAudio(descriptor.url);
    case AssetType.ANIMATION:
      return loadAnimationClips(descriptor.url);
    default: {
      // Exhaustiveness check: if a new AssetType is ever added without
      // a case above, this line fails to compile.
      const exhaustiveCheck: never = descriptor.type;
      throw new Error(`Unhandled asset type: ${String(exhaustiveCheck)}`);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Orchestrates the full asset lifecycle: registry lookup, loader
 * dispatch by type, caching, retry-on-failure, and progress events.
 * This is the single entry point the presentation layer should use —
 * it should never call an individual loader directly.
 */
export class AssetManager {
  private readonly cache = new AssetCache();
  private readonly inFlightLoads = new Map<string, Promise<unknown>>();

  constructor(
    private readonly registry: AssetRegistry,
    private readonly eventBus: EngineEventBus,
    private readonly config: AssetConfig = DEFAULT_ASSET_CONFIG,
    private readonly loadingManager = new LoadingManager(eventBus)
  ) {}

  /**
   * Loads a single asset (or returns the cached result / an in-flight
   * promise if already loading). Retries up to `config.retryAttempts`
   * times on failure before rejecting.
   */
  async load<TResource = unknown>(id: string): Promise<TResource> {
    const cached = this.cache.get<TResource>(id);
    if (cached !== undefined) {
      return cached;
    }

    const inFlight = this.inFlightLoads.get(id);
    if (inFlight) {
      return inFlight as Promise<TResource>;
    }

    const descriptor = this.registry.get(id);
    const loadPromise = this.loadWithRetry(descriptor).finally(() => {
      this.inFlightLoads.delete(id);
    });
    this.inFlightLoads.set(id, loadPromise);
    return loadPromise as Promise<TResource>;
  }

  /** Loads every asset matching the given ids, reporting aggregate progress. */
  /**
   * Deliberately never rejects, even if every single asset in the
   * batch fails — a loading screen gating on "preload finished" must
   * always be able to finish, or it hangs forever. Per-asset success/
   * failure is still fully visible via the asset:load-completed /
   * asset:load-failed events this already emits; preload() itself
   * only promises "I attempted every id and reported on each one."
   */
  async preload(ids: readonly string[]): Promise<void> {
    this.loadingManager.beginBatch(ids.length);
    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          await this.load(id);
        } catch {
          // Already reported via asset:load-failed inside loadWithRetry —
          // swallowed here only so this item still counts toward the
          // batch's completion instead of leaving it permanently stuck.
        } finally {
          this.loadingManager.reportItemLoaded(id);
        }
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- deliberate call-site-inferred generic; see AssetCache.get.
  getCached<TResource>(id: string): TResource | undefined {
    return this.cache.get<TResource>(id);
  }

  isCached(id: string): boolean {
    return this.cache.has(id);
  }

  evict(id: string): void {
    this.cache.evict(id);
  }

  /**
   * Releases every cached resource this manager holds. Intended for
   * EngineProvider to call on unmount — without this, every route
   * navigation leaked whatever the previous route had loaded (the
   * cache had no owner responsible for freeing it). Genuinely
   * disposable resources (textures, audio buffers that implement
   * `.dispose()`) are freed; resources this cache can't determine how
   * to free (see AssetCache's own isDisposable check) are still
   * dropped from the map so they become eligible for JS garbage
   * collection, even though their own internal GPU buffers (if any)
   * won't be explicitly released — a real, stated limitation, not
   * something this method claims to fully solve.
   */
  dispose(): void {
    this.cache.clear();
    this.inFlightLoads.clear();
  }

  private async loadWithRetry(descriptor: AssetDescriptor, attempt = 0): Promise<unknown> {
    this.eventBus.emit("asset:load-started", { descriptor });
    try {
      const resource = await loadByType(descriptor);
      this.cache.set(descriptor.id, resource);
      this.eventBus.emit("asset:load-completed", { descriptor });
      return resource;
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        await delay(RETRY_BACKOFF_MS * (attempt + 1));
        return this.loadWithRetry(descriptor, attempt + 1);
      }
      const message = error instanceof Error ? error.message : String(error);
      this.eventBus.emit("asset:load-failed", { descriptor, error: message });
      throw error instanceof Error ? error : new Error(message);
    }
  }
}
