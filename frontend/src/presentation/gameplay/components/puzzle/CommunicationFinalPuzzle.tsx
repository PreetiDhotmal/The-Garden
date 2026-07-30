import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import {
  simulateLightBeam,
  type MirrorOrientation,
} from "@/domain/game/puzzle/LightBeamSimulator";
import { SymbolTotem } from "./SymbolTotem";
import { SwitchPost } from "./SwitchPost";
import { MirrorPost } from "./MirrorPost";
import { TargetCrystal } from "./TargetCrystal";
import { LightBeamVisualization } from "./LightBeamVisualization";
import { InfoTablet } from "./InfoTablet";
import { DigitPost } from "./DigitPost";
import { SightBlockingWall } from "./SightBlockingWall";
import {
  FINAL_PUZZLE_COMMIT_LEVER_POSITION,
  FINAL_PUZZLE_DIGIT_POST_POSITIONS,
  FINAL_PUZZLE_LIGHT_SOURCE,
  FINAL_PUZZLE_MIRROR_POSITION,
  FINAL_PUZZLE_OBJECTIVE_ID,
  FINAL_PUZZLE_SIGHT_WALL_POSITION,
  FINAL_PUZZLE_SWITCH_POSITION,
  FINAL_PUZZLE_SYMBOL_TOTEM_POSITION,
  FINAL_PUZZLE_TABLET_A_POSITION,
  FINAL_PUZZLE_TARGET,
  PuzzleSymbol,
} from "@/presentation/levels/communication/communicationLevelContent";

export interface CommunicationFinalPuzzleProps {
  readonly targetSymbol: PuzzleSymbol;
  readonly targetCode: readonly number[];
  readonly puzzleManager: CoopPuzzleManager;
  readonly isActiveStage: boolean;
  readonly onStageProgressChanged: () => void;
  readonly onMissedAttempt: () => void;
  readonly onTimeRemainingChanged: (secondsRemaining: number | null) => void;
}

function toVector2D(position: readonly [number, number, number]): { x: number; z: number } {
  return { x: position[0], z: position[2] };
}

export function CommunicationFinalPuzzle({
  targetSymbol,
  targetCode,
  puzzleManager,
  isActiveStage,
  onStageProgressChanged,
  onMissedAttempt,
  onTimeRemainingChanged,
}: CommunicationFinalPuzzleProps) {
  const [switchSymbol, setSwitchSymbol] = useState<PuzzleSymbol | null>(null);
  const [mirrorOrientation, setMirrorOrientation] = useState<MirrorOrientation>("BACK_SLASH");
  const [enteredDigits, setEnteredDigits] = useState<readonly (number | null)[]>([null, null]);
  const [resetSignal, setResetSignal] = useState(0);
  const elapsedRef = useRef(0);
  const hasBecomeAvailableRef = useRef(false);
  const hasHandledExpiryRef = useRef(false);

  const beamResult = useMemo(() => {
    const mirrors = [
      {
        id: "final-mirror",
        position: toVector2D(FINAL_PUZZLE_MIRROR_POSITION),
        orientation: mirrorOrientation,
      },
    ];
    return simulateLightBeam(
      {
        position: toVector2D(FINAL_PUZZLE_LIGHT_SOURCE.position),
        direction: FINAL_PUZZLE_LIGHT_SOURCE.direction,
      },
      mirrors,
      { position: toVector2D(FINAL_PUZZLE_TARGET), radius: 0.6 }
    );
  }, [mirrorOrientation]);

  const resetAttempt = () => {
    setSwitchSymbol(null);
    setMirrorOrientation("BACK_SLASH");
    setEnteredDigits([null, null]);
    setResetSignal((count) => count + 1);
  };

  useFrame((_, delta) => {
    if (!isActiveStage) {
      return;
    }
    elapsedRef.current += delta;
    if (!hasBecomeAvailableRef.current) {
      hasBecomeAvailableRef.current = true;
      puzzleManager
        .getObjectiveManager()
        .isAvailable(FINAL_PUZZLE_OBJECTIVE_ID, elapsedRef.current);
    }
    const remaining = puzzleManager
      .getObjectiveManager()
      .getTimeRemainingSeconds(FINAL_PUZZLE_OBJECTIVE_ID, elapsedRef.current);
    onTimeRemainingChanged(remaining);

    if (
      !hasHandledExpiryRef.current &&
      puzzleManager
        .getObjectiveManager()
        .isExpired(FINAL_PUZZLE_OBJECTIVE_ID, elapsedRef.current)
    ) {
      hasHandledExpiryRef.current = true;
      puzzleManager.recordMissedAttempt();
      resetAttempt();
      onMissedAttempt();
      elapsedRef.current = 0;
      hasBecomeAvailableRef.current = false;
      hasHandledExpiryRef.current = false;
    }
  });

  useEffect(() => {
    if (!isActiveStage) {
      onTimeRemainingChanged(null);
    }
  }, [isActiveStage, onTimeRemainingChanged]);

  const handleCommit = () => {
    const switchCorrect = switchSymbol === targetSymbol;
    const beamCorrect = beamResult.hitsTarget;
    const codeCorrect = targetCode.every((digit, index) => enteredDigits[index] === digit);
    const isCorrect = switchCorrect && beamCorrect && codeCorrect;

    if (!isCorrect) {
      puzzleManager.recordMissedAttempt();
      resetAttempt();
      onMissedAttempt();
      return;
    }

    const objectiveManager = puzzleManager.getObjectiveManager();
    const objective = objectiveManager
      .listAll()
      .find((entry) => entry.id === FINAL_PUZZLE_OBJECTIVE_ID);
    if (objective) {
      objectiveManager.sync([progressObjective(objective, 1)]);
    }
    puzzleManager.checkStageCompletion();
    onTimeRemainingChanged(null);
    onStageProgressChanged();
  };

  return (
    <>
      <SymbolTotem position={FINAL_PUZZLE_SYMBOL_TOTEM_POSITION} symbol={targetSymbol} />
      <SwitchPost
        id="interactable:communication:final-switch"
        position={FINAL_PUZZLE_SWITCH_POSITION}
        resetSignal={resetSignal}
        onChanged={setSwitchSymbol}
      />

      <MirrorPost
        id="interactable:communication:final-mirror"
        position={FINAL_PUZZLE_MIRROR_POSITION}
        orientation={mirrorOrientation}
        onRotate={() => {
          setMirrorOrientation((current) =>
            current === "FORWARD_SLASH" ? "BACK_SLASH" : "FORWARD_SLASH"
          );
        }}
      />
      <TargetCrystal position={FINAL_PUZZLE_TARGET} isActivated={beamResult.hitsTarget} />
      <LightBeamVisualization
        path={beamResult.path}
        height={2}
        hitsTarget={beamResult.hitsTarget}
      />

      <InfoTablet
        position={FINAL_PUZZLE_TABLET_A_POSITION}
        digits={targetCode}
        label="The final code"
      />
      {FINAL_PUZZLE_DIGIT_POST_POSITIONS.map((position, index) => (
        <DigitPost
          key={`final-digit-${index.toString()}`}
          id={`interactable:communication:final-digit-${index.toString()}`}
          position={position}
          resetSignal={resetSignal}
          onChanged={(digit) => {
            setEnteredDigits((current) => {
              const next = [...current];
              next[index] = digit;
              return next;
            });
          }}
        />
      ))}

      <InteractableObject
        id="interactable:communication:final-commit-lever"
        position={FINAL_PUZZLE_COMMIT_LEVER_POSITION}
        promptText="Pull Lever"
        color="#c98a4c"
        radius={2.5}
        onInteract={handleCommit}
      />

      <SightBlockingWall
        position={FINAL_PUZZLE_SIGHT_WALL_POSITION}
        width={20}
        height={4.5}
        rotationY={Math.PI / 2}
      />
    </>
  );
}
