import {
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  SphereGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * These are procedurally composed from Three.js primitives (cones,
 * cylinders, icosahedra), not hand-modeled 3D art assets — no such
 * assets were provided for this milestone's environment (unlike the
 * character models in Milestone 3). This is a deliberate, documented
 * limitation: primitive composition + correct PBR materials/lighting
 * is the best approximation achievable without actual art assets or a
 * DCC/visual-feedback pipeline. See the Milestone 5 report.
 */

export function createLowPolyTreeGeometry(): BufferGeometry {
  const trunk = new CylinderGeometry(0.15, 0.22, 1.6, 6);
  trunk.translate(0, 0.8, 0);

  const foliageBottom = new ConeGeometry(1.1, 1.6, 7);
  foliageBottom.translate(0, 2.1, 0);
  const foliageMiddle = new ConeGeometry(0.85, 1.3, 7);
  foliageMiddle.translate(0, 2.8, 0);
  const foliageTop = new ConeGeometry(0.55, 1, 7);
  foliageTop.translate(0, 3.5, 0);

  return mergeGeometries([trunk, foliageBottom, foliageMiddle, foliageTop], false);
}

export function createBushGeometry(): BufferGeometry {
  const a = new IcosahedronGeometry(0.5, 0);
  a.translate(-0.2, 0.4, 0);
  const b = new IcosahedronGeometry(0.55, 0);
  b.translate(0.2, 0.45, 0.1);
  const c = new IcosahedronGeometry(0.45, 0);
  c.translate(0, 0.55, -0.2);

  return mergeGeometries([a, b, c], false);
}

export function createRockGeometry(): BufferGeometry {
  const geometry = new IcosahedronGeometry(0.6, 1);
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const jitter = 0.85 + Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719)) * 0.3;
    position.setXYZ(i, x * jitter, y * jitter * 0.7, z * jitter);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createGrassBladeGeometry(): BufferGeometry {
  const geometry = new ConeGeometry(0.05, 0.6, 3);
  geometry.translate(0, 0.3, 0);
  return geometry;
}

export function createFlowerGeometry(): BufferGeometry {
  const stem = new CylinderGeometry(0.02, 0.02, 0.35, 5);
  stem.translate(0, 0.175, 0);
  const bloom = new SphereGeometry(0.06, 6, 6);
  bloom.translate(0, 0.37, 0);

  return mergeGeometries([stem, bloom], false);
}
