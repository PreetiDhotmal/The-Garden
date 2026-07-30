import { useEffect, useState } from "react";
import { Text } from "@react-three/drei";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { DIGIT_BASE_GEOMETRY, DIGIT_FACE_GEOMETRY } from "./puzzleGeometry";

export interface DigitPostProps {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly onChanged: (digit: number) => void;
  readonly resetSignal: number;
}

export function DigitPost({ id, position, onChanged, resetSignal }: DigitPostProps) {
  const [digit, setDigit] = useState(0);

  useEffect(() => {
    setDigit(0);
  }, [resetSignal]);

  return (
    <group position={position}>
      <mesh geometry={DIGIT_BASE_GEOMETRY} position={[0, -0.9, 0]} castShadow>
        <meshStandardMaterial color="#4a5a6b" roughness={0.85} />
      </mesh>
      <mesh geometry={DIGIT_FACE_GEOMETRY} castShadow>
        <meshStandardMaterial color="#8fb0e0" emissive="#8fb0e0" emissiveIntensity={0.2} />
      </mesh>
      <Text
        position={[0, 0, 0.12]}
        fontSize={0.35}
        color="#0a1420"
        anchorX="center"
        anchorY="middle"
      >
        {digit.toString()}
      </Text>
      <InteractableObject
        id={id}
        position={[0, 0, 0]}
        promptText="Cycle Digit"
        radius={2}
        color="#8fb0e0"
        onInteract={() => {
          const next = (digit + 1) % 10;
          setDigit(next);
          onChanged(next);
        }}
      />
    </group>
  );
}
