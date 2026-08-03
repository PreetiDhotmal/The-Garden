import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, CatmullRomCurve3 } from "three";

export interface FlyoverWaypoint {
  readonly position: readonly [number, number, number];
  readonly lookAt: readonly [number, number, number];
}

export interface CinematicFlyoverCameraProps {
  readonly waypoints: readonly FlyoverWaypoint[];
  readonly durationSeconds: number;
  /** Loops back to the start once finished — used for the main menu's continuous background rotation, not the (one-shot) cutscene. */
  readonly loop?: boolean;
}

/**
 * Smoothly interpolates camera position along a Catmull-Rom curve
 * through `waypoints`, and look-at along a straight lerp between the
 * same waypoints' lookAt points, over `durationSeconds`.
 */
export function CinematicFlyoverCamera({
  waypoints,
  durationSeconds,
  loop = false,
}: CinematicFlyoverCameraProps) {
  const camera = useThree((state) => state.camera);
  const elapsedRef = useRef(0);

  const positionCurve = useMemo(
    () => new CatmullRomCurve3(waypoints.map((wp) => new Vector3(...wp.position))),
    [waypoints]
  );

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    let t = elapsedRef.current / durationSeconds;
    if (loop) {
      t %= 1;
    } else {
      t = Math.min(1, t);
    }

    const position = positionCurve.getPointAt(t);
    camera.position.copy(position);

    const lookAt = interpolateLookAt(waypoints, t);
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
  });

  return null;
}

function interpolateLookAt(waypoints: readonly FlyoverWaypoint[], t: number): Vector3 {
  const segmentCount = waypoints.length - 1;
  const scaledT = t * segmentCount;
  const index = Math.min(segmentCount - 1, Math.floor(scaledT));
  const localT = scaledT - index;

  const from = waypoints[index];
  const to = waypoints[index + 1];
  if (!from || !to) {
    const fallback = waypoints[waypoints.length - 1];
    return new Vector3(...(fallback?.lookAt ?? [0, 0, 0]));
  }

  return new Vector3(...from.lookAt).lerp(new Vector3(...to.lookAt), localT);
}
