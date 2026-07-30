import { BoxGeometry, BufferGeometry, CylinderGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Procedurally composed from Three.js primitives, matching
 * ProceduralVegetationGeometry's approach — no hand-modeled art
 * assets exist for these structural props either. See Milestone 5's
 * documented limitation on this.
 */

export function createBridgePlankSpanGeometry(length: number, width: number): BufferGeometry {
  const plankCount = Math.max(4, Math.round(length / 0.6));
  const plankLength = length / plankCount;
  const planks: BufferGeometry[] = [];
  for (let i = 0; i < plankCount; i += 1) {
    const plank = new BoxGeometry(width, 0.12, plankLength * 0.92);
    plank.translate(0, 0, -length / 2 + plankLength * (i + 0.5));
    planks.push(plank);
  }
  return mergeGeometries(planks, false);
}

export function createBridgeRailGeometry(length: number): BufferGeometry {
  const rail = new CylinderGeometry(0.05, 0.05, length, 6);
  rail.rotateZ(Math.PI / 2);
  const postCount = Math.max(2, Math.round(length / 1.5));
  const posts: BufferGeometry[] = [rail];
  for (let i = 0; i < postCount; i += 1) {
    const post = new CylinderGeometry(0.06, 0.06, 0.9, 6);
    post.translate(0, -0.45, -length / 2 + (length / (postCount - 1)) * i);
    posts.push(post);
  }
  return mergeGeometries(posts, false);
}

export function createBenchGeometry(): BufferGeometry {
  const seat = new BoxGeometry(1.4, 0.08, 0.5);
  seat.translate(0, 0.45, 0);
  const back = new BoxGeometry(1.4, 0.5, 0.06);
  back.translate(0, 0.7, -0.22);
  const legGeometry = () => new BoxGeometry(0.08, 0.45, 0.08);
  const legPositions: readonly [number, number][] = [
    [-0.6, -0.2],
    [0.6, -0.2],
    [-0.6, 0.2],
    [0.6, 0.2],
  ];
  const legs = legPositions.map(([x, z]) => {
    const leg = legGeometry();
    leg.translate(x, 0.22, z);
    return leg;
  });
  return mergeGeometries([seat, back, ...legs], false);
}

/** One fence segment: two posts + two horizontal rails, tileable end-to-end along a path. */
export function createFenceSegmentGeometry(segmentLength: number): BufferGeometry {
  const postA = new BoxGeometry(0.1, 0.9, 0.1);
  postA.translate(-segmentLength / 2, 0.45, 0);
  const postB = new BoxGeometry(0.1, 0.9, 0.1);
  postB.translate(segmentLength / 2, 0.45, 0);
  const railTop = new BoxGeometry(segmentLength, 0.08, 0.06);
  railTop.translate(0, 0.7, 0);
  const railBottom = new BoxGeometry(segmentLength, 0.08, 0.06);
  railBottom.translate(0, 0.35, 0);
  return mergeGeometries([postA, postB, railTop, railBottom], false);
}

export function createPlanterGeometry(): BufferGeometry {
  const pot = new CylinderGeometry(0.35, 0.28, 0.4, 8);
  pot.translate(0, 0.2, 0);
  const soilMound = new CylinderGeometry(0.3, 0.3, 0.1, 8);
  soilMound.translate(0, 0.42, 0);
  return mergeGeometries([pot, soilMound], false);
}
