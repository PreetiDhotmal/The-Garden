import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial } from "three";
import type { Vector2D } from "@/domain/game/puzzle/LightBeamSimulator";

export interface LightBeamVisualizationProps {
  readonly path: readonly Vector2D[];
  readonly height: number;
  readonly hitsTarget: boolean;
}

/**
 * Constructs a real THREE.Line object directly rather than using R3F's
 * <line> JSX intrinsic — this project's TypeScript setup resolves
 * <line> against the DOM/SVG element types instead of R3F's Three.js
 * extension (a known namespace collision), so <primitive> with a
 * manually built object is the robust way to render one here. The
 * geometry is rebuilt from the simulator's current path every time it
 * changes — the beam visibly redirects the instant a mirror rotates,
 * not a pre-baked animation.
 */
export function LightBeamVisualization({
  path,
  height,
  hitsTarget,
}: LightBeamVisualizationProps) {
  const line = useMemo(() => {
    const points = path.flatMap((point) => [point.x, height, point.z]);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
    const material = new LineBasicMaterial({
      color: hitsTarget ? "#8fe0d0" : "#fff2c0",
      transparent: true,
      opacity: 0.85,
    });
    return new Line(geometry, material);
  }, [path, height, hitsTarget]);

  if (path.length < 2) {
    return null;
  }

  return <primitive object={line} />;
}
