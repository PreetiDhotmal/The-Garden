import { useFrame } from "@react-three/fiber";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { InputFrameState } from "@/domain/input/InputFrameState";
import { useGameplay } from "../hooks/useGameplay";

export interface InteractionDriverProps {
  readonly player: CharacterEntity;
  readonly inputFrameRef: React.RefObject<InputFrameState>;
}

/**
 * Must be mounted inside `<Canvas>` (uses `useFrame`). Renders
 * nothing — it only ticks InteractionManager's proximity resolution
 * and forwards the press input, reusing the same shared input frame
 * ref the character controller and camera already read from (see
 * useInputFrame, Milestone 3) rather than sampling InputSystem again.
 */
export function InteractionDriver({ player, inputFrameRef }: InteractionDriverProps) {
  const { interactionManager } = useGameplay();

  useFrame(() => {
    interactionManager.updateProximityFocus(player.getPosition());

    if (inputFrameRef.current.interactPressed) {
      interactionManager.handlePressStart(performance.now() / 1000);
    }
  });

  return null;
}
