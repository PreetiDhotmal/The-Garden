import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, Points } from "three";
import { BufferGeometry, Float32BufferAttribute } from "three";
import {
  InteractionPriority,
  InteractionTrigger,
  InteractionType,
} from "@/domain/gameplay/interaction/InteractionTypes";
import type { Vector3Like } from "@/domain/gameplay/interaction/InteractionTarget";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { useEngine } from "@/presentation/engine/hooks/useEngine";

export interface GlowingSeedProps {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly onCollected?: (id: string) => void;
}

const COLLECT_SFX_ASSET_ID = "audio:sfx:seed-collect";
const COLLECTION_ANIMATION_DURATION_SECONDS = 0.6;

/** No seed-collect sound asset exists yet — same honest "wired but silent" pattern used throughout this project (footsteps, landing). */
export function GlowingSeed({ id, position, onCollected }: GlowingSeedProps) {
  const { interactionManager, collectibleManager } = useGameplay();
  const { assetManager, sfxManager } = useEngine();
  const meshRef = useRef<Mesh>(null);
  const particlesRef = useRef<Points>(null);
  const collectionElapsedRef = useRef<number | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [isFullyGone, setIsFullyGone] = useState(() => !collectibleManager.has(id));

  const worldPosition: Vector3Like = useMemo(
    () => ({ x: position[0], y: position[1], z: position[2] }),
    [position]
  );

  const sparkleGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    const points: number[] = [];
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 0.15 + Math.random() * 0.1;
      points.push(Math.cos(angle) * radius, Math.random() * 0.2, Math.sin(angle) * radius);
    }
    geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  useEffect(() => {
    if (isFullyGone) {
      // Already collected in a previous session (restored from save) — never register as interactable.
      return;
    }

    interactionManager.register({
      id,
      type: InteractionType.PROXIMITY,
      priority: InteractionPriority.NORMAL,
      trigger: InteractionTrigger.PRESS,
      interactionRadius: 1.8,
      holdDurationSeconds: 0,
      promptText: "Collect Seed",
      getPosition: () => worldPosition,
      canInteract: () => collectionElapsedRef.current === null,
      onInteract: () => {
        collectibleManager.pickUp(id);
        collectionElapsedRef.current = 0;
        setIsCollecting(true);
        onCollected?.(id);
        const collectBuffer = assetManager.isCached(COLLECT_SFX_ASSET_ID)
          ? assetManager.getCached<AudioBuffer>(COLLECT_SFX_ASSET_ID)
          : undefined;
        if (collectBuffer) {
          sfxManager.play(collectBuffer, { volume: 0.7 });
        }
      },
    });
    return () => {
      interactionManager.unregister(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, interactionManager, collectibleManager, worldPosition, isFullyGone]);

  useFrame((state, delta) => {
    if (isFullyGone) {
      return;
    }

    if (collectionElapsedRef.current !== null) {
      collectionElapsedRef.current += delta;
      const progress = collectionElapsedRef.current / COLLECTION_ANIMATION_DURATION_SECONDS;
      if (progress >= 1) {
        setIsFullyGone(true);
        return;
      }
      if (meshRef.current) {
        meshRef.current.position.y = position[1] + progress * 1.5;
        meshRef.current.scale.setScalar(Math.max(0, 1 - progress));
      }
      if (particlesRef.current) {
        particlesRef.current.scale.setScalar(1 + progress * 2);
      }
      return;
    }

    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.08;
      meshRef.current.rotation.y += delta * 1.2;
    }
  });

  if (isFullyGone) {
    return null;
  }

  return (
    <group>
      <mesh ref={meshRef} position={position} castShadow>
        <icosahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color="#d4c85a"
          emissive="#f0e070"
          emissiveIntensity={isCollecting ? 2 : 0.8}
          roughness={0.3}
        />
      </mesh>
      <pointLight position={position} color="#f0e070" intensity={1.2} distance={3} />
      {isCollecting && (
        <points ref={particlesRef} position={position} geometry={sparkleGeometry}>
          <pointsMaterial color="#fff6c8" size={0.06} transparent opacity={0.8} />
        </points>
      )}
    </group>
  );
}
