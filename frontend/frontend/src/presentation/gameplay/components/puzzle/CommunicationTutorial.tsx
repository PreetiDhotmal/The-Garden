import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";

export type TutorialStep = "MOVE" | "TALK" | "OBJECTIVE" | "DONE" | null;

export interface CommunicationTutorialProps {
  readonly entityOne: CharacterEntity | null;
  readonly entityTwo: CharacterEntity | null;
  readonly onStepChanged: (step: TutorialStep) => void;
}

const TUTORIAL_SEEN_FLAG = "tutorial-seen:communication";
const MOVE_DISTANCE_THRESHOLD = 1.5;
const TALK_STEP_HOLD_SECONDS = 4;
const OBJECTIVE_STEP_HOLD_SECONDS = 5;

/**
 * "Teach by interaction. No pop-up manuals." — the MOVE step is
 * detected from real player movement (both characters genuinely
 * displaced from their spawn position), not a timer or a dismiss
 * button. TALK has no detectable game action to hook into — it's a
 * design cue ("you'll need to talk to each other"), not a mechanic —
 * so it honestly just holds a moment before fading, rather than
 * inventing a fake detection condition for something that isn't
 * actually a game action.
 *
 * Renders nothing itself — useFrame only runs inside the Canvas, but
 * the actual prompt text is a DOM overlay that must render outside
 * it, so this component's only job is computing the step and
 * reporting it upward via onStepChanged, exactly like the Final
 * Puzzle's timer already does for the same structural reason.
 */
export function CommunicationTutorial({
  entityOne,
  entityTwo,
  onStepChanged,
}: CommunicationTutorialProps) {
  const { storyFlags } = useGameplay();
  const stepRef = useRef<TutorialStep>(null);
  const startPositionsRef = useRef<{
    one: { x: number; z: number };
    two: { x: number; z: number };
  } | null>(null);
  const talkStepStartedAtRef = useRef<number | null>(null);
  const objectiveStepStartedAtRef = useRef<number | null>(null);
  const hasFinishedRef = useRef(false);

  const setStep = (next: TutorialStep) => {
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
        talkStepStartedAtRef.current = state.clock.elapsedTime;
        setStep("TALK");
      }
      return;
    }
    if (stepRef.current === "TALK" && talkStepStartedAtRef.current !== null) {
      if (state.clock.elapsedTime - talkStepStartedAtRef.current >= TALK_STEP_HOLD_SECONDS) {
        objectiveStepStartedAtRef.current = state.clock.elapsedTime;
        setStep("OBJECTIVE");
      }
      return;
    }
    if (stepRef.current === "OBJECTIVE" && objectiveStepStartedAtRef.current !== null) {
      if (
        state.clock.elapsedTime - objectiveStepStartedAtRef.current >=
        OBJECTIVE_STEP_HOLD_SECONDS
      ) {
        storyFlags.set(TUTORIAL_SEEN_FLAG);
        hasFinishedRef.current = true;
        setStep("DONE");
      }
    }
  });

  return null;
}
