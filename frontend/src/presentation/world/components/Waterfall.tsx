import { RiverWater } from "./RiverWater";
import { AmbientParticles } from "./AmbientParticles";

export interface WaterfallProps {
  readonly position: readonly [number, number, number];
  readonly height: number;
  readonly width: number;
}

/**
 * The cascade itself reuses RiverWater's reflective material (drei's
 * MeshReflectorMaterial) tilted toward vertical, rather than a custom
 * flow-map shader that would need a flow-map texture asset that
 * doesn't exist — same honest reuse RiverWater itself documents for
 * its own animated-flow approximation.
 */
export function Waterfall({ position, height, width }: WaterfallProps) {
  const [x, y, z] = position;

  return (
    <group>
      {/* The falling cascade — RiverWater's plane is normally horizontal (rotated -90 deg around X); tilting further toward vertical gives a falling-water look without a new material. */}
      <group position={[x, y + height / 2, z]} rotation={[Math.PI * 0.42, 0, 0]}>
        <RiverWater position={[0, 0, 0]} width={width} length={height} />
      </group>

      {/* Splash pool at the base. */}
      <RiverWater position={[x, y + 0.05, z + height * 0.35]} width={width * 1.4} length={width * 1.4} />

      {/* Mist/spray at the base. */}
      <AmbientParticles
        kind="dust"
        position={[x, y + 0.5, z + height * 0.3]}
        area={[width, 1.5, width]}
        count={30}
      />
    </group>
  );
}
