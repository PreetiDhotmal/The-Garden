import { useState } from "react";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { InfoTablet } from "./InfoTablet";
import { DigitPost } from "./DigitPost";
import { SightBlockingWall } from "./SightBlockingWall";
import {
  PUZZLE_THREE_COMMIT_LEVER_POSITION,
  PUZZLE_THREE_DIGIT_POST_POSITIONS,
  PUZZLE_THREE_OBJECTIVE_ID,
  PUZZLE_THREE_PLAYER_A_TABLET_POSITION,
  PUZZLE_THREE_PLAYER_B_TABLET_POSITION,
  PUZZLE_THREE_SIGHT_WALL_POSITION,
} from "@/presentation/levels/communication/communicationLevelContent";

export interface CommunicationPuzzleThreeProps {
  readonly code: readonly number[];
  readonly puzzleManager: CoopPuzzleManager;
  readonly onStageProgressChanged: () => void;
  readonly onMissedAttempt: () => void;
}

const COMMIT_LEVER_ID = "interactable:communication:code-commit-lever";

export function CommunicationPuzzleThree({
  code,
  puzzleManager,
  onStageProgressChanged,
  onMissedAttempt,
}: CommunicationPuzzleThreeProps) {
  const [enteredDigits, setEnteredDigits] = useState<readonly number[]>([0, 0, 0, 0]);
  const [resetSignal, setResetSignal] = useState(0);

  const handleDigitChanged = (index: number, digit: number) => {
    setEnteredDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
  };

  const handleCommit = () => {
    const isCorrect = code.every((digit, index) => enteredDigits[index] === digit);

    if (!isCorrect) {
      puzzleManager.recordMissedAttempt();
      setEnteredDigits([0, 0, 0, 0]);
      setResetSignal((count) => count + 1);
      onMissedAttempt();
      return;
    }

    const objectiveManager = puzzleManager.getObjectiveManager();
    const objective = objectiveManager
      .listAll()
      .find((entry) => entry.id === PUZZLE_THREE_OBJECTIVE_ID);
    if (objective) {
      objectiveManager.sync([progressObjective(objective, 1)]);
    }
    puzzleManager.checkStageCompletion();
    onStageProgressChanged();
  };

  return (
    <>
      <InfoTablet
        position={PUZZLE_THREE_PLAYER_A_TABLET_POSITION}
        digits={code.slice(0, 2)}
        label="First two digits"
      />
      <InfoTablet
        position={PUZZLE_THREE_PLAYER_B_TABLET_POSITION}
        digits={code.slice(2, 4)}
        label="Last two digits"
      />

      {PUZZLE_THREE_DIGIT_POST_POSITIONS.map((position, index) => (
        <DigitPost
          key={`digit-${index.toString()}`}
          id={`interactable:communication:digit-${index.toString()}`}
          position={position}
          resetSignal={resetSignal}
          onChanged={(digit) => {
            handleDigitChanged(index, digit);
          }}
        />
      ))}

      <InteractableObject
        id={COMMIT_LEVER_ID}
        position={PUZZLE_THREE_COMMIT_LEVER_POSITION}
        promptText="Pull Lever"
        color="#c98a4c"
        radius={2.5}
        onInteract={handleCommit}
      />

      <SightBlockingWall position={PUZZLE_THREE_SIGHT_WALL_POSITION} width={14} rotationY={Math.PI / 2} />
    </>
  );
}
