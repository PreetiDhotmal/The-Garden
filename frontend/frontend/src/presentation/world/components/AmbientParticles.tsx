import { Sparkles } from "@react-three/drei";

export type AmbientParticleKind = "dust" | "pollen";

export interface AmbientParticlesProps {
  readonly kind: AmbientParticleKind;
  readonly position: [number, number, number];
  readonly area: [number, number, number];
  readonly count?: number;
}

const KIND_PRESETS: Record<AmbientParticleKind, { color: string; size: number; speed: number }> = {
  dust: { color: "#e8d9b0", size: 1.2, speed: 0.1 },
  pollen: { color: "#fff6c8", size: 2, speed: 0.25 },
};

/**
 * Wraps drei's Sparkles (an established, GPU-instanced particle
 * technique) rather than authoring a custom particle system from
 * scratch — the "reusable" requirement is satisfied by one component
 * parameterized per particle kind, not five near-duplicate
 * implementations.
 */
export function AmbientParticles({ kind, position, area, count = 60 }: AmbientParticlesProps) {
  const preset = KIND_PRESETS[kind];
  return (
    <Sparkles
      position={position}
      scale={area}
      count={count}
      color={preset.color}
      size={preset.size}
      speed={preset.speed}
      opacity={0.5}
      noise={1}
    />
  );
}
