import { useState } from "react";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { SymbolTotem } from "./SymbolTotem";
import { SwitchPost } from "./SwitchPost";
import { SightBlockingWall } from "./SightBlockingWall";
import {
  PuzzleSymbol,
  SIGHT_WALL_POSITION,
  SWITCH_OBJECTIVE_IDS,
  SWITCH_POSITIONS,
  SYMBOL_TOTEM_POSITIONS,
} from "@/presentation/levels/communication/communicationLevelContent";

export interface CommunicationPuzzleOneProps {
  readonly targetOrder: readonly PuzzleSymbol[];
  readonly puzzleManager: CoopPuzzleManager;
  readonly onStageProgressChanged: () => void;
  readonly onMissedAttempt: () => void;
}

const COMMIT_LEVER_ID = "interactable:communication:commit-lever";

export function CommunicationPuzzleOne({
  targetOrder,
  puzzleManager,
  onStageProgressChanged,
  onMissedAttempt,
}: CommunicationPuzzleOneProps) {
  const [switchValues, setSwitchValues] = useState<readonly (PuzzleSymbol | null)[]>([
    null,
    null,
    null,
  ]);
  const [resetSignal, setResetSignal] = useState(0);

  const handleSwitchChanged = (index: number, symbol: PuzzleSymbol) => {
    setSwitchValues((current) => {
      const next = [...current];
      next[index] = symbol;
      return next;
    });
  };

  const handleCommit = () => {
    const isCorrect = targetOrder.every((symbol, index) => switchValues[index] === symbol);

    if (!isCorrect) {
      puzzleManager.recordMissedAttempt();
      setSwitchValues([null, null, null]);
      setResetSignal((count) => count + 1);
      onMissedAttempt();
      return;
    }

    const objectiveManager = puzzleManager.getObjectiveManager();
    const updated = objectiveManager
      .listAll()
      .filter((objective) => SWITCH_OBJECTIVE_IDS.includes(objective.id))
      .map((objective) => progressObjective(objective, 1));
    objectiveManager.sync(updated);
    puzzleManager.checkStageCompletion();
    onStageProgressChanged();
  };

  return (
    <>
      {SYMBOL_TOTEM_POSITIONS.map((position, index) => {
        const symbol = targetOrder[index];
        if (!symbol) {
          return null;
        }
        return (
          <SymbolTotem key={`totem-${index.toString()}`} position={position} symbol={symbol} />
        );
      })}

      {SWITCH_POSITIONS.map((position, index) => (
        <SwitchPost
          key={`switch-${index.toString()}`}
          id={`interactable:communication:switch-${index.toString()}`}
          position={position}
          resetSignal={resetSignal}
          onChanged={(symbol) => {
            handleSwitchChanged(index, symbol);
          }}
        />
      ))}

      <InteractableObject
        id={COMMIT_LEVER_ID}
        position={[6, 1, 6]}
        promptText="Pull Lever"
        color="#c98a4c"
        radius={2.5}
        onInteract={handleCommit}
      />

      <SightBlockingWall position={SIGHT_WALL_POSITION} width={12} rotationY={Math.PI / 2} />
    </>
  );
}
