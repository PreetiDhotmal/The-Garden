import { describe, expect, it } from "vitest";
import { createAssetDescriptor, InvalidAssetDescriptorError } from "./AssetDescriptor";
import { AssetType } from "./AssetType";

describe("createAssetDescriptor", () => {
  it("creates a descriptor with sensible defaults", () => {
    const descriptor = createAssetDescriptor({
      id: "oak-tree",
      type: AssetType.MODEL,
      url: "/models/oak-tree.glb",
    });

    expect(descriptor).toEqual({
      id: "oak-tree",
      type: AssetType.MODEL,
      url: "/models/oak-tree.glb",
      priority: "normal",
      tags: [],
    });
  });

  it("preserves explicit priority and tags", () => {
    const descriptor = createAssetDescriptor({
      id: "hero-mesh",
      type: AssetType.MODEL,
      url: "/models/hero.glb",
      priority: "critical",
      tags: ["character", "playable"],
    });

    expect(descriptor.priority).toBe("critical");
    expect(descriptor.tags).toEqual(["character", "playable"]);
  });

  it("rejects an empty id", () => {
    expect(() =>
      createAssetDescriptor({ id: "  ", type: AssetType.TEXTURE, url: "/tex/grass.png" })
    ).toThrow(InvalidAssetDescriptorError);
  });

  it("rejects an empty url", () => {
    expect(() =>
      createAssetDescriptor({ id: "grass", type: AssetType.TEXTURE, url: "  " })
    ).toThrow(InvalidAssetDescriptorError);
  });

  it("rejects a url whose extension does not match the asset type", () => {
    expect(() =>
      createAssetDescriptor({ id: "grass", type: AssetType.TEXTURE, url: "/models/grass.glb" })
    ).toThrow(InvalidAssetDescriptorError);
  });

  it.each([
    [AssetType.MODEL, "/a.glb"],
    [AssetType.MODEL, "/a.gltf"],
    [AssetType.TEXTURE, "/a.png"],
    [AssetType.TEXTURE, "/a.jpg"],
    [AssetType.TEXTURE, "/a.ktx2"],
    [AssetType.HDRI, "/a.hdr"],
    [AssetType.HDRI, "/a.exr"],
    [AssetType.AUDIO, "/a.mp3"],
    [AssetType.AUDIO, "/a.ogg"],
    [AssetType.ANIMATION, "/a.glb"],
  ])("accepts %s asset with extension in %s", (type, url) => {
    expect(() => createAssetDescriptor({ id: "x", type, url })).not.toThrow();
  });
});
