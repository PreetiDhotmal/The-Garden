import { describe, expect, it } from "vitest";
import { createTerrainGeometry } from "./TerrainGeometry";

describe("createTerrainGeometry", () => {
  it("produces the expected vertex count for the given segment counts", () => {
    const geometry = createTerrainGeometry({
      width: 10,
      depth: 10,
      widthSegments: 4,
      depthSegments: 4,
      heightFunction: () => 0,
    });

    const positionAttribute = geometry.getAttribute("position");
    expect(positionAttribute.count).toBe(5 * 5); // (segments + 1) squared
  });

  it("produces the expected triangle index count", () => {
    const geometry = createTerrainGeometry({
      width: 10,
      depth: 10,
      widthSegments: 4,
      depthSegments: 4,
      heightFunction: () => 0,
    });

    // 4x4 grid of quads, 2 triangles each, 3 indices per triangle.
    expect(geometry.getIndex()?.count).toBe(4 * 4 * 2 * 3);
  });

  it("displaces vertices according to the height function", () => {
    const geometry = createTerrainGeometry({
      width: 10,
      depth: 10,
      widthSegments: 2,
      depthSegments: 2,
      heightFunction: (x, z) => x + z,
    });

    const positionAttribute = geometry.getAttribute("position");
    for (let i = 0; i < positionAttribute.count; i += 1) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      expect(y).toBeCloseTo(x + z, 5);
    }
  });

  it("computes vertex normals", () => {
    const geometry = createTerrainGeometry({
      width: 10,
      depth: 10,
      widthSegments: 4,
      depthSegments: 4,
      heightFunction: (x, z) => Math.sin(x) + Math.cos(z),
    });

    expect(geometry.getAttribute("normal")).toBeDefined();
  });

  it("rejects fewer than 1 segment", () => {
    expect(() =>
      createTerrainGeometry({
        width: 10,
        depth: 10,
        widthSegments: 0,
        depthSegments: 4,
        heightFunction: () => 0,
      })
    ).toThrow(RangeError);
  });
});
