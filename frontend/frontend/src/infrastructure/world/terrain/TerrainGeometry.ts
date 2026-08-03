import { BufferGeometry, Float32BufferAttribute } from "three";

export interface TerrainGeometryOptions {
  readonly width: number;
  readonly depth: number;
  readonly widthSegments: number;
  readonly depthSegments: number;
  readonly heightFunction: (x: number, z: number) => number;
}

/**
 * Builds a displaced grid mesh from `heightFunction`. Deliberately a
 * plain function returning a BufferGeometry — not a React component —
 * so it can be unit-tested (vertex count, height sampling) without a
 * WebGL context, and reused by both the visible terrain mesh and (in
 * the future) a matching invisible collider mesh.
 */
export function createTerrainGeometry(options: TerrainGeometryOptions): BufferGeometry {
  const { width, depth, widthSegments, depthSegments, heightFunction } = options;
  if (widthSegments < 1 || depthSegments < 1) {
    throw new RangeError("widthSegments and depthSegments must be at least 1");
  }

  const geometry = new BufferGeometry();
  const vertexCountX = widthSegments + 1;
  const vertexCountZ = depthSegments + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let zIndex = 0; zIndex < vertexCountZ; zIndex += 1) {
    const z = (zIndex / depthSegments - 0.5) * depth;
    for (let xIndex = 0; xIndex < vertexCountX; xIndex += 1) {
      const x = (xIndex / widthSegments - 0.5) * width;
      const y = heightFunction(x, z);
      positions.push(x, y, z);
      uvs.push(xIndex / widthSegments, zIndex / depthSegments);
    }
  }

  for (let zIndex = 0; zIndex < depthSegments; zIndex += 1) {
    for (let xIndex = 0; xIndex < widthSegments; xIndex += 1) {
      const a = zIndex * vertexCountX + xIndex;
      const b = a + 1;
      const c = a + vertexCountX;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

/** Samples the same height function terrain geometry uses — for placing objects (trees, stones, the player spawn) exactly on the ground. */
export function sampleTerrainHeight(
  heightFunction: (x: number, z: number) => number,
  x: number,
  z: number
): number {
  return heightFunction(x, z);
}
