import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { createFenceSegmentGeometry } from "@/infrastructure/world/props/ProceduralPropGeometry";

export interface FenceProps {
  /** Consecutive points the fence line passes through — one segment is placed between each adjacent pair. */
  readonly points: readonly (readonly [number, number, number])[];
}

interface FenceSegmentSpec {
  readonly key: string;
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly length: number;
}

function buildSegments(points: readonly (readonly [number, number, number])[]): readonly FenceSegmentSpec[] {
  const built: FenceSegmentSpec[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) {
      continue;
    }
    const [ax, ay, az] = a;
    const [bx, , bz] = b;
    const dx = bx - ax;
    const dz = bz - az;
    built.push({
      key: `fence-segment-${i.toString()}`,
      position: [(ax + bx) / 2, ay, (az + bz) / 2],
      rotationY: Math.atan2(dx, dz),
      length: Math.hypot(dx, dz),
    });
  }
  return built;
}

export function Fence({ points }: FenceProps) {
  const segments = useMemo(() => buildSegments(points), [points]);

  return (
    <>
      {segments.map(({ key, ...segment }) => (
        <FenceSegment key={key} {...segment} />
      ))}
    </>
  );
}

function FenceSegment({
  position,
  rotationY,
  length,
}: {
  readonly position: readonly [number, number, number];
  readonly rotationY: number;
  readonly length: number;
}) {
  const geometry = useMemo(() => createFenceSegmentGeometry(length), [length]);

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#7a5c3e" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}
