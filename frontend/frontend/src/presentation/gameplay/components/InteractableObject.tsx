import { useEffect, useMemo, useRef } from "react";
import { SphereGeometry, type Mesh } from "three";
import {
  InteractionPriority,
  InteractionTrigger,
  InteractionType,
} from "@/domain/gameplay/interaction/InteractionTypes";
import type { Vector3Like } from "@/domain/gameplay/interaction/InteractionTarget";
import { useGameplay } from "../hooks/useGameplay";

export interface InteractableObjectProps {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly promptText: string;
  readonly radius?: number;
  readonly color?: string;
  readonly canInteract?: () => boolean;
  readonly onInteract: () => void;
}

/**
 * Every InteractableObject marker uses the identical [0.4, 24, 24]
 * sphere — created once here and shared (via <primitive>) rather than
 * each of the dozens of simultaneously-mounted instances across a
 * scene (puzzle switches, levers, digit posts, NPCs, scripture
 * stones) creating its own separate 576-vertex geometry. Never
 * mutated per-instance, so sharing is safe.
 */
const SHARED_MARKER_GEOMETRY = new SphereGeometry(0.4, 24, 24);

/**
 * Any mesh wrapped in this component becomes interactable — this is
 * the concrete demonstration of "future objects should only implement
 * an interface to become interactable": this component is the only
 * place InteractionTarget gets implemented against a real mesh.
 */
export function InteractableObject({
  id,
  position,
  promptText,
  radius = 2.5,
  color = "#c9a84c",
  canInteract = () => true,
  onInteract,
}: InteractableObjectProps) {
  const { interactionManager } = useGameplay();
  const meshRef = useRef<Mesh>(null);

  const worldPosition: Vector3Like = useMemo(
    () => ({ x: position[0], y: position[1], z: position[2] }),
    [position]
  );

  useEffect(() => {
    interactionManager.register({
      id,
      type: InteractionType.PROXIMITY,
      priority: InteractionPriority.NORMAL,
      trigger: InteractionTrigger.PRESS,
      interactionRadius: radius,
      holdDurationSeconds: 0,
      promptText,
      getPosition: () => worldPosition,
      canInteract,
      onInteract,
    });
    return () => {
      interactionManager.unregister(id);
    };
    // Intentionally omits onInteract/canInteract from deps: callers
    // typically pass inline closures whose identity changes every
    // render, and re-registering on every render would thrash
    // InteractionManager (losing hold-progress state, etc.). Callers
    // should keep the *behavior* of these callbacks stable even if the
    // closure identity isn't memoized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, interactionManager, promptText, radius, worldPosition]);

  return (
    <mesh ref={meshRef} position={position} geometry={SHARED_MARKER_GEOMETRY} castShadow>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.3} />
    </mesh>
  );
}
