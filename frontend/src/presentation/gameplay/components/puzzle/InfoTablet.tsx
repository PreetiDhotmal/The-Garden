import { Text } from "@react-three/drei";

export interface InfoTabletProps {
  readonly position: readonly [number, number, number];
  readonly digits: readonly number[];
  readonly label: string;
}

export function InfoTablet({ position, digits, label }: InfoTabletProps) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 1.6, 0.3]} />
        <meshStandardMaterial color="#6b5a42" roughness={0.85} />
      </mesh>
      <Text
        position={[0, 0.25, 0.18]}
        fontSize={0.5}
        color="#f0e0b8"
        anchorX="center"
        anchorY="middle"
      >
        {digits.join(" ")}
      </Text>
      <Text
        position={[0, -0.45, 0.18]}
        fontSize={0.14}
        color="#c9b890"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}
