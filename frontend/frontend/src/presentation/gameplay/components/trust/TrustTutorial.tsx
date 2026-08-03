import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";

export type TrustTutorialStep = "MOVE" | "TRUST" | "DONE" | null;

export interface TrustTutorialProps {
  readonly entityOne: CharacterEntity | null;
  readonly entityTwo: CharacterEntity | null;
  readonly onStepChanged: (step: TrustTutorialStep) => void;
}

const TUTORIAL_SEEN_FLAG = "tutorial-seen:trust";
const MOVE_DISTANCE_THRESHOLD = 1.5;
const TRUST_STEP_HOLD_SECONDS = 4;

/**
 * Same detection-based approach as Communication's tutorial, adapted
 * for Trust's theme: MOVE is detected from real player movement (both
 * characters genuinely displaced from spawn), not a timer. TRUST has
 * no detectable game action — it's the chapter's central design cue,
 * not a mechanic — so it honestly holds briefly before fading rather
 * than inventing a fake detection condition.
 */
export function TrustTutorial({ entityOne, entityTwo, onStepChanged }: TrustTutorialProps) {
  const { storyFlags } = useGameplay();
  const stepRef = useRef<TrustTutorialStep>(null);
  const startPositionsRef = useRef<{
    one: { x: number; z: number };
    two: { x: number; z: number };
  } | null>(null);
  const trustStepStartedAtRef = useRef<number | null>(null);
  const hasFinishedRef = useRef(false);

  const setStep = (next: TrustTutorialStep) => {
    if (stepRef.current === next) {
      return;
    }
    stepRef.current = next;
    onStepChanged(next);
  };

  useEffect(() => {
    if (storyFlags.has(TUTORIAL_SEEN_FLAG)) {
      hasFinishedRef.current = true;
      return;
    }
    if (entityOne && entityTwo && !startPositionsRef.current) {
      const posOne = entityOne.getPosition();
      const posTwo = entityTwo.getPosition();
      startPositionsRef.current = {
        one: { x: posOne.x, z: posOne.z },
        two: { x: posTwo.x, z: posTwo.z },
      };
      setStep("MOVE");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityOne, entityTwo]);

  useFrame((state) => {
    if (hasFinishedRef.current || !entityOne || !entityTwo || !startPositionsRef.current) {
      return;
    }
    if (stepRef.current === "MOVE") {
      const posOne = entityOne.getPosition();
      const posTwo = entityTwo.getPosition();
      const distOne = Math.hypot(
        posOne.x - startPositionsRef.current.one.x,
        posOne.z - startPositionsRef.current.one.z
      );
      const distTwo = Math.hypot(
        posTwo.x - startPositionsRef.current.two.x,
        posTwo.z - startPositionsRef.current.two.z
      );
      if (distOne >= MOVE_DISTANCE_THRESHOLD && distTwo >= MOVE_DISTANCE_THRESHOLD) {
        trustStepStartedAtRef.current = state.clock.elapsedTime;
        setStep("TRUST");
      }
      return;
    }
    if (stepRef.current === "TRUST" && trustStepStartedAtRef.current !== null) {
      if (state.clock.elapsedTime - trustStepStartedAtRef.current >= TRUST_STEP_HOLD_SECONDS) {
        storyFlags.set(TUTORIAL_SEEN_FLAG);
        hasFinishedRef.current = true;
        setStep("DONE");
      }
    }
  });

  return null;
}
