import { describe, expect, it } from "vitest";
import { CollisionLayer, LayerMask } from "./CollisionLayer";

describe("LayerMask", () => {
  it("starts empty with none()", () => {
    const mask = LayerMask.none();
    expect(mask.has(CollisionLayer.PLAYER)).toBe(false);
    expect(mask.toLayerIndices()).toEqual([]);
  });

  it("builds a mask from multiple layers", () => {
    const mask = LayerMask.of(CollisionLayer.PLAYER, CollisionLayer.NPC);

    expect(mask.has(CollisionLayer.PLAYER)).toBe(true);
    expect(mask.has(CollisionLayer.NPC)).toBe(true);
    expect(mask.has(CollisionLayer.TERRAIN)).toBe(false);
  });

  it("with() adds a layer immutably", () => {
    const original = LayerMask.of(CollisionLayer.PLAYER);
    const extended = original.with(CollisionLayer.NPC);

    expect(original.has(CollisionLayer.NPC)).toBe(false);
    expect(extended.has(CollisionLayer.NPC)).toBe(true);
    expect(extended.has(CollisionLayer.PLAYER)).toBe(true);
  });

  it("without() removes a layer immutably", () => {
    const original = LayerMask.of(CollisionLayer.PLAYER, CollisionLayer.NPC);
    const reduced = original.without(CollisionLayer.NPC);

    expect(original.has(CollisionLayer.NPC)).toBe(true);
    expect(reduced.has(CollisionLayer.NPC)).toBe(false);
    expect(reduced.has(CollisionLayer.PLAYER)).toBe(true);
  });

  it("intersects() detects shared layers", () => {
    const a = LayerMask.of(CollisionLayer.PLAYER, CollisionLayer.NPC);
    const b = LayerMask.of(CollisionLayer.NPC, CollisionLayer.TERRAIN);
    const c = LayerMask.of(CollisionLayer.PROJECTILE);

    expect(a.intersects(b)).toBe(true);
    expect(a.intersects(c)).toBe(false);
  });

  it("toLayerIndices() returns the composing layers in canonical order", () => {
    const mask = LayerMask.of(CollisionLayer.NPC, CollisionLayer.TERRAIN);
    expect(mask.toLayerIndices()).toEqual([CollisionLayer.TERRAIN, CollisionLayer.NPC]);
  });

  it("rejects an out-of-range layer index", () => {
    expect(() => LayerMask.of(16 as CollisionLayer)).toThrow(RangeError);
    expect(() => LayerMask.of(-1 as CollisionLayer)).toThrow(RangeError);
  });
});
