import { describe, expect, it, vi } from "vitest";
import { AssetCache } from "./AssetCache";

function fakeDisposable() {
  return { dispose: vi.fn() };
}

describe("AssetCache", () => {
  it("stores and retrieves a resource by id", () => {
    const cache = new AssetCache();
    const texture = { width: 512 };
    cache.set("grass-texture", texture);

    expect(cache.get("grass-texture")).toBe(texture);
    expect(cache.has("grass-texture")).toBe(true);
  });

  it("returns undefined for a missing id", () => {
    const cache = new AssetCache();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("disposes a disposable resource on evict", () => {
    const cache = new AssetCache();
    const resource = fakeDisposable();
    cache.set("model", resource);

    cache.evict("model");

    expect(resource.dispose).toHaveBeenCalledTimes(1);
    expect(cache.has("model")).toBe(false);
  });

  it("disposes the previous resource when overwritten with a new one", () => {
    const cache = new AssetCache();
    const first = fakeDisposable();
    const second = fakeDisposable();

    cache.set("model", first);
    cache.set("model", second);

    expect(first.dispose).toHaveBeenCalledTimes(1);
    expect(second.dispose).not.toHaveBeenCalled();
    expect(cache.get("model")).toBe(second);
  });

  it("does not throw when disposing a non-disposable resource", () => {
    const cache = new AssetCache();
    cache.set("plain-data", { foo: "bar" });

    expect(() => {
      cache.evict("plain-data");
    }).not.toThrow();
  });

  it("clear() disposes every resource and empties the cache", () => {
    const cache = new AssetCache();
    const a = fakeDisposable();
    const b = fakeDisposable();
    cache.set("a", a);
    cache.set("b", b);

    cache.clear();

    expect(a.dispose).toHaveBeenCalledTimes(1);
    expect(b.dispose).toHaveBeenCalledTimes(1);
    expect(cache.size()).toBe(0);
  });
});
