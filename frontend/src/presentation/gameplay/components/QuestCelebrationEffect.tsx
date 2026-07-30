import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Points, PointLight, Material } from "three";
import { BufferGeometry, Float32BufferAttribute } from "three";

export interface QuestCelebrationEffectProps {
  readonly position: readonly [number, number, number];
  readonly onFinished: () => void;
}

const DURATION_SECONDS = 2.5;
const PARTICLE_COUNT = 60;

export function QuestCelebrationEffect({ position, onFinished }: QuestCelebrationEffectProps) {
  const pointsRef = useRef<Points>(null);
  const lightRef = useRef<PointLight>(null);
  const elapsedRef = useRef(0);
  const hasFinishedRef = useRef(false);

  const { geometry, velocities } = useMemo(() => {
    const positions: number[] = [];
    const velocityList: [number, number, number][] = [];
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      positions.push(0, 0, 0);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      velocityList.push([Math.cos(angle) * speed, 2 + Math.random() * 3, Math.sin(angle) * speed]);
    }
    const geom = new BufferGeometry();
    geom.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return { geometry: geom, velocities: velocityList };
  }, []);

  useFrame((_, delta) => {
    if (hasFinishedRef.current) {
      return;
    }
    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;

    if (elapsed >= DURATION_SECONDS) {
      hasFinishedRef.current = true;
      onFinished();
      return;
    }

    const fadeProgress = Math.max(0, 1 - elapsed / DURATION_SECONDS);

    if (pointsRef.current) {
      const positionAttribute = pointsRef.current.geometry.getAttribute("position");
      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        const velocity = velocities[i];
        if (!velocity) {
          continue;
        }
        const gravity = -4 * elapsed;
        positionAttribute.setXYZ(
          i,
          velocity[0] * elapsed,
          velocity[1] * elapsed + 0.5 * gravity * elapsed,
          velocity[2] * elapsed
        );
      }
      positionAttribute.needsUpdate = true;
      const material = pointsRef.current.material as Material & { opacity: number };
      material.opacity = fadeProgress;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 8 * fadeProgress;
    }
  });

  return (
    <group position={position}>
      <pointLight ref={lightRef} color="#ffe9a8" intensity={8} distance={12} />
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial color="#ffe9a8" size={0.15} transparent opacity={1} />
      </points>
    </group>
  );
}
