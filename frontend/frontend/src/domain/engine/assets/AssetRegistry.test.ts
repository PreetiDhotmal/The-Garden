import { describe, expect, it } from "vitest";
import { createAssetDescriptor } from "./AssetDescriptor";
import { AssetRegistry, DuplicateAssetIdError, UnknownAssetIdError } from "./AssetRegistry";
import { AssetType } from "./AssetType";

function descriptor(id: string, type: AssetType = AssetType.MODEL, url = "/a.glb") {
  return createAssetDescriptor({ id, type, url });
}

describe("AssetRegistry", () => {
  it("registers and retrieves a descriptor by id", () => {
    const registry = new AssetRegistry();
    registry.register(descriptor("oak-tree"));

    expect(registry.get("oak-tree").id).toBe("oak-tree");
    expect(registry.has("oak-tree")).toBe(true);
  });

  it("throws when registering a duplicate id", () => {
    const registry = new AssetRegistry();
    registry.register(descriptor("oak-tree"));

    expect(() => {
      registry.register(descriptor("oak-tree"));
    }).toThrow(DuplicateAssetIdError);
  });

  it("throws when looking up an unknown id", () => {
    const registry = new AssetRegistry();
    expect(() => registry.get("missing")).toThrow(UnknownAssetIdError);
  });

  it("registers multiple descriptors at once", () => {
    const registry = new AssetRegistry();
    registry.registerAll([descriptor("a"), descriptor("b")]);

    expect(registry.size()).toBe(2);
  });

  it("filters by type", () => {
    const registry = new AssetRegistry();
    registry.registerAll([
      descriptor("tree", AssetType.MODEL, "/tree.glb"),
      descriptor("grass", AssetType.TEXTURE, "/grass.png"),
    ]);

    expect(registry.listByType(AssetType.MODEL)).toHaveLength(1);
    expect(registry.listByType(AssetType.MODEL)[0]?.id).toBe("tree");
  });

  it("filters by tag", () => {
    const registry = new AssetRegistry();
    registry.register(
      createAssetDescriptor({
        id: "hero",
        type: AssetType.MODEL,
        url: "/hero.glb",
        tags: ["character"],
      })
    );

    expect(registry.listByTag("character")).toHaveLength(1);
    expect(registry.listByTag("environment")).toHaveLength(0);
  });

  it("unregisters a descriptor", () => {
    const registry = new AssetRegistry();
    registry.register(descriptor("oak-tree"));
    registry.unregister("oak-tree");

    expect(registry.has("oak-tree")).toBe(false);
  });

  it("clears all descriptors", () => {
    const registry = new AssetRegistry();
    registry.registerAll([descriptor("a"), descriptor("b")]);
    registry.clear();

    expect(registry.size()).toBe(0);
  });
});
