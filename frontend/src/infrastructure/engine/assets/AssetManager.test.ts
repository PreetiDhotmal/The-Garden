import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Texture } from "three";
import { createAssetDescriptor } from "@/domain/engine/assets/AssetDescriptor";
import { AssetRegistry } from "@/domain/engine/assets/AssetRegistry";
import { AssetType } from "@/domain/engine/assets/AssetType";
import { createAssetConfig } from "@/domain/engine/config/AssetConfig";
import { createEngineEventBus } from "@/domain/engine/events/EngineEventBus";
import { AssetManager } from "./AssetManager";
import { loadTexture } from "./loaders/TextureLoader";

vi.mock("./loaders/TextureLoader", () => ({
  loadTexture: vi.fn(),
}));
vi.mock("./loaders/ModelLoader", () => ({ loadModel: vi.fn() }));
vi.mock("./loaders/HdriLoader", () => ({ loadHdri: vi.fn() }));
vi.mock("./loaders/AudioLoader", () => ({ loadAudio: vi.fn() }));
vi.mock("./loaders/AnimationLoader", () => ({ loadAnimationClips: vi.fn() }));

const mockedLoadTexture = vi.mocked(loadTexture);

/** A minimal stand-in for a loaded Texture, sufficient for identity checks in these tests. */
function fakeTexture(): Texture {
  return { id: Math.floor(Math.random() * 1_000_000) } as unknown as Texture;
}

function buildManager() {
  const registry = new AssetRegistry();
  registry.register(
    createAssetDescriptor({ id: "grass", type: AssetType.TEXTURE, url: "/grass.png" })
  );
  const eventBus = createEngineEventBus();
  const config = createAssetConfig({ retryAttempts: 1 });
  const manager = new AssetManager(registry, eventBus, config);
  return { registry, eventBus, manager };
}

describe("AssetManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads an asset via the correct loader and caches the result", async () => {
    const texture = fakeTexture();
    mockedLoadTexture.mockResolvedValueOnce(texture);
    const { manager } = buildManager();

    const result = await manager.load("grass");

    expect(result).toBe(texture);
    expect(mockedLoadTexture).toHaveBeenCalledTimes(1);
    expect(manager.isCached("grass")).toBe(true);
  });

  it("returns the cached result on subsequent loads without reloading", async () => {
    mockedLoadTexture.mockResolvedValueOnce(fakeTexture());
    const { manager } = buildManager();

    await manager.load("grass");
    await manager.load("grass");

    expect(mockedLoadTexture).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent in-flight loads of the same asset", async () => {
    let resolveLoad!: (value: Texture) => void;
    mockedLoadTexture.mockReturnValueOnce(
      new Promise<Texture>((resolve) => {
        resolveLoad = resolve;
      })
    );
    const { manager } = buildManager();

    const first = manager.load("grass");
    const second = manager.load("grass");
    resolveLoad(fakeTexture());
    await Promise.all([first, second]);

    expect(mockedLoadTexture).toHaveBeenCalledTimes(1);
  });

  it("emits load-started and load-completed events", async () => {
    mockedLoadTexture.mockResolvedValueOnce(fakeTexture());
    const { manager, eventBus } = buildManager();
    const started = vi.fn();
    const completed = vi.fn();
    eventBus.on("asset:load-started", started);
    eventBus.on("asset:load-completed", completed);

    await manager.load("grass");

    expect(started).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it("retries up to the configured attempt count before failing", async () => {
    mockedLoadTexture.mockRejectedValue(new Error("network error"));
    const { manager } = buildManager();

    await expect(manager.load("grass")).rejects.toThrow("network error");
    // retryAttempts: 1 means 1 initial attempt + 1 retry = 2 calls.
    expect(mockedLoadTexture).toHaveBeenCalledTimes(2);
  });

  it("emits load-failed after exhausting retries", async () => {
    mockedLoadTexture.mockRejectedValue(new Error("network error"));
    const { manager, eventBus } = buildManager();
    const failed = vi.fn();
    eventBus.on("asset:load-failed", failed);

    await expect(manager.load("grass")).rejects.toThrow();

    expect(failed).toHaveBeenCalledTimes(1);
  });

  it("reports aggregate preload progress", async () => {
    mockedLoadTexture.mockResolvedValue(fakeTexture());
    const registry = new AssetRegistry();
    registry.registerAll([
      createAssetDescriptor({ id: "a", type: AssetType.TEXTURE, url: "/a.png" }),
      createAssetDescriptor({ id: "b", type: AssetType.TEXTURE, url: "/b.png" }),
    ]);
    const eventBus = createEngineEventBus();
    const manager = new AssetManager(registry, eventBus);
    const progressEvents: Array<{ loaded: number; total: number }> = [];
    eventBus.on("asset:preload-progress", (payload) => progressEvents.push(payload));
    const completed = vi.fn();
    eventBus.on("asset:preload-completed", completed);

    await manager.preload(["a", "b"]);

    expect(progressEvents.at(-1)).toEqual({ loaded: 2, total: 2 });
    expect(completed).toHaveBeenCalledTimes(1);
  });
});
