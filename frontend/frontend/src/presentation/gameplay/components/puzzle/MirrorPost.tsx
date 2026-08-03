import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import type { MirrorOrientation } from "@/domain/game/puzzle/LightBeamSimulator";
import { MIRROR_BASE_GEOMETRY, MIRROR_PANE_GEOMETRY } from "./puzzleGeometry";

export interface MirrorPostProps {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly orientation: MirrorOrientation;
  readonly onRotate: () => void;
}

const FORWARD_SLASH_Y_ROTATION = Math.PI / 4;
const BACK_SLASH_Y_ROTATION = -Math.PI / 4;

/** Visual rotation smoothly eases toward the target angle each frame rather than snapping — real per-frame interpolation, not an instant flip. */
export function MirrorPost({ id, position, orientation, onRotate }: MirrorPostProps) {
  const meshRef = useRef<Mesh>(null);
  const targetRotationY = useMemo(
    () => (orientation === "FORWARD_SLASH" ? FORWARD_SLASH_Y_ROTATION : BACK_SLASH_Y_ROTATION),
    [orientation]
  );

  useFrame((_, delta) => {
    if (!meshRef.current) {
      return;
    }
    const current = meshRef.current.rotation.y;
    const step = Math.min(1, delta * 6);
    meshRef.current.rotation.y = current + (targetRotationY - current) * step;
  });

  return (
    <group position={position}>
      <mesh geometry={MIRROR_BASE_GEOMETRY} position={[0, -0.9, 0]} castShadow>
        <meshStandardMaterial color="#5a5248" roughness={0.85} />
      </mesh>
      <mesh ref={meshRef} geometry={MIRROR_PANE_GEOMETRY} castShadow>
        <meshStandardMaterial
          color="#cfe8ff"
          metalness={0.9}
          roughness={0.1}
          emissive="#cfe8ff"
          emissiveIntensity={0.15}
        />
      </mesh>
      <InteractableObject
        id={id}
        position={[0, 0, 0]}
        promptText="Rotate Mirror"
        radius={2.5}
        color="#cfe8ff"
        onInteract={onRotate}
      />
    </group>
  );
}
