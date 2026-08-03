import { useEffect, useRef, useState } from "react";
import { CharacterState } from "@/domain/character/CharacterState";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import { TUTORIAL_STEPS, type TutorialStep } from "@/domain/gameplay/tutorial/TutorialStep";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { useTutorialStore } from "@/presentation/gameplay/stores/tutorialStore";
import type { ThirdPersonCameraController } from "@/infrastructure/camera/ThirdPersonCameraController";

const MOVE_DISTANCE_THRESHOLD = 1;
const LOOK_YAW_THRESHOLD_RADIANS = 0.2;
const POLL_INTERVAL_MS = 150;

export interface UseTutorialFlowInput {
  readonly entity: CharacterEntity | null;
  readonly cameraControllerRef: React.RefObject<ThirdPersonCameraController | null>;
  readonly isJournalOpen: boolean;
  readonly isInventoryOpen: boolean;
  readonly isPaused: boolean;
}

export interface TutorialFlow {
  readonly isActive: boolean;
  readonly currentStep: TutorialStep | null;
  readonly skip: () => void;
}

export function useTutorialFlow({
  entity,
  cameraControllerRef,
  isJournalOpen,
  isInventoryOpen,
  isPaused,
}: UseTutorialFlowInput): TutorialFlow {
  const { eventBus } = useGameplay();
  const hasCompletedTutorial = useTutorialStore((state) => state.hasCompletedTutorial);
  const markCompleted = useTutorialStore((state) => state.markCompleted);
  const [stepIndex, setStepIndex] = useState(0);
  const stepStartPositionRef = useRef<{ x: number; z: number } | null>(null);
  const stepStartYawRef = useRef<number | null>(null);

  const isActive = !hasCompletedTutorial && entity !== null && stepIndex < TUTORIAL_STEPS.length;
  const currentStep = isActive ? (TUTORIAL_STEPS[stepIndex] ?? null) : null;

  const advance = () => {
    setStepIndex((index) => index + 1);
  };

  // Reset per-step tracking baselines whenever the step changes.
  useEffect(() => {
    if (!entity || !currentStep) {
      return;
    }
    if (currentStep.id === "MOVE") {
      const position = entity.getPosition();
      stepStartPositionRef.current = { x: position.x, z: position.z };
    }
    if (currentStep.id === "LOOK") {
      stepStartYawRef.current = cameraControllerRef.current?.getOrbitState().yaw ?? null;
    }
  }, [currentStep, entity, cameraControllerRef]);

  // Polling-based detection for move/look/jump/sprint — no dedicated event for these, mirrors the debug panels' established polling pattern.
  useEffect(() => {
    if (!isActive || !currentStep) {
      return;
    }
    if (
      currentStep.id !== "MOVE" &&
      currentStep.id !== "LOOK" &&
      currentStep.id !== "JUMP" &&
      currentStep.id !== "SPRINT"
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      if (currentStep.id === "MOVE" && stepStartPositionRef.current) {
        const position = entity.getPosition();
        const distance = Math.hypot(
          position.x - stepStartPositionRef.current.x,
          position.z - stepStartPositionRef.current.z
        );
        if (distance >= MOVE_DISTANCE_THRESHOLD) {
          advance();
        }
      } else if (currentStep.id === "LOOK" && stepStartYawRef.current !== null) {
        const yaw = cameraControllerRef.current?.getOrbitState().yaw;
        if (yaw !== undefined && Math.abs(yaw - stepStartYawRef.current) >= LOOK_YAW_THRESHOLD_RADIANS) {
          advance();
        }
      } else if (currentStep.id === "JUMP" && entity.getLocomotionState() === CharacterState.JUMPING) {
        advance();
      } else if (currentStep.id === "SPRINT" && entity.getLocomotionState() === CharacterState.SPRINTING) {
        advance();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [isActive, currentStep, entity, cameraControllerRef]);

  // Event-based detection for interact/scripture/save.
  useEffect(() => {
    if (!isActive || !currentStep) {
      return;
    }
    if (currentStep.id === "INTERACT") {
      return eventBus.on("interaction:finished", () => {
        advance();
      });
    }
    if (currentStep.id === "READ_SCRIPTURE") {
      return eventBus.on("scripture:collected", () => {
        advance();
      });
    }
    if (currentStep.id === "SAVE") {
      return eventBus.on("save:completed", () => {
        advance();
      });
    }
  }, [isActive, currentStep, eventBus]);

  // Prop-driven detection for journal/inventory/pause.
  useEffect(() => {
    if (!isActive || !currentStep) {
      return;
    }
    if (currentStep.id === "OPEN_JOURNAL" && isJournalOpen) {
      advance();
    } else if (currentStep.id === "OPEN_INVENTORY" && isInventoryOpen) {
      advance();
    } else if (currentStep.id === "PAUSE" && isPaused) {
      advance();
    }
  }, [isActive, currentStep, isJournalOpen, isInventoryOpen, isPaused]);

  // Mark fully completed once every step has been passed.
  useEffect(() => {
    if (stepIndex >= TUTORIAL_STEPS.length && !hasCompletedTutorial) {
      markCompleted();
    }
  }, [stepIndex, hasCompletedTutorial, markCompleted]);

  const skip = () => {
    markCompleted();
  };

  return { isActive, currentStep, skip };
}
