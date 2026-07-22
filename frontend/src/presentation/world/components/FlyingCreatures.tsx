import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { DoubleSide, type Object3D } from "three";
import {
  computeFlightPosition,
  type FlightPathParams,
} from "@/infrastructure/world/particles/FlightPath";

export type FlyingCreatureKind = "bird" | "butterfly";

export interface FlyingCreaturesProps {
  readonly kind: FlyingCreatureKind;
  readonly center: readonly [number, number, number];
  readonly count?: number;
  readonly radius?: number;
}

const KIND_PRESETS: Record<
  FlyingCreatureKind,
  { color: string; size: number; speed: number; bobSpeed: number }
> = {
  bird: { color: "#4a4a4a", size: 0.18, speed: 0.6, bobSpeed: 1.2 },
  butterfly: { color: "#e8a13c", size: 0.06, speed: 1.4, bobSpeed: 3 },
};

/**
 * A single reusable flock component for both birds and butterflies —
 * only the visual preset and flight radius differ per call site,
 * satisfying "no duplicate code" for what would otherwise be two
 * near-identical particle systems.
 */
export function FlyingCreatures({ kind, center, count = 6, radius = 8 }: FlyingCreaturesProps) {
  const preset = KIND_PRESETS[kind];
  const instanceRefs = useRef<(Object3D | null)[]>([]);

  const paramsList = useMemo<FlightPathParams[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        centerX: center[0],
        centerY: center[1],
        centerZ: center[2],
        radius: radius * (0.7 + (i / count) * 0.6),
        speed: preset.speed * (0.8 + (i % 3) * 0.15),
        bobHeight: kind === "butterfly" ? 0.6 : 0.3,
        bobSpeed: preset.bobSpeed,
        phaseOffset: (i / count) * Math.PI * 2,
      })),
    [count, center, radius, kind, preset.speed, preset.bobSpeed]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    paramsList.forEach((params, i) => {
      const object = instanceRefs.current[i];
      if (!object) {
        return;
      }
      const position = computeFlightPosition(params, t);
      object.position.set(position.x, position.y, position.z);
      object.rotation.y = position.headingRadians;
    });
  });

  return (
    <Instances limit={count} range={count}>
      {kind === "bird" ? (
        <coneGeometry args={[preset.size, preset.size * 2, 4]} />
      ) : (
        <planeGeometry args={[preset.size * 2, preset.size]} />
      )}
      <meshStandardMaterial color={preset.color} side={DoubleSide} />
      {paramsList.map((_, i) => (
        <Instance
          key={i.toString()}
          ref={(object: Object3D | null) => {
            instanceRefs.current[i] = object;
          }}
        />
      ))}
    </Instances>
  );
}
