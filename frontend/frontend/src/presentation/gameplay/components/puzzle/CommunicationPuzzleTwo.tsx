import { useEffect, useMemo, useState } from "react";
import {
  simulateLightBeam,
  type MirrorOrientation,
} from "@/domain/game/puzzle/LightBeamSimulator";
import { progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { MirrorPost } from "./MirrorPost";
import { TargetCrystal } from "./TargetCrystal";
import { LightBeamVisualization } from "./LightBeamVisualization";
import { SightBlockingWall } from "./SightBlockingWall";
import {
  PUZZLE_TWO_BEAM_HEIGHT,
  PUZZLE_TWO_LIGHT_SOURCE,
  PUZZLE_TWO_MIRROR_IDS,
  PUZZLE_TWO_MIRROR_POSITIONS,
  PUZZLE_TWO_OBJECTIVE_ID,
  PUZZLE_TWO_SIGHT_WALL_POSITION,
  PUZZLE_TWO_TARGET,
} from "@/presentation/levels/communication/communicationLevelContent";

export interface CommunicationPuzzleTwoProps {
  readonly puzzleManager: CoopPuzzleManager;
  readonly isActiveStage: boolean;
  readonly onStageProgressChanged: () => void;
}

function toVector2D(position: readonly [number, number, number]): { x: number; z: number } {
  return { x: position[0], z: position[2] };
}

export function CommunicationPuzzleTwo({
  puzzleManager,
  isActiveStage,
  onStageProgressChanged,
}: CommunicationPuzzleTwoProps) {
  const [orientations, setOrientations] = useState<Record<string, MirrorOrientation>>(() =>
    Object.fromEntries(PUZZLE_TWO_MIRROR_IDS.map((id) => [id, "BACK_SLASH" as const]))
  );
  const [hasCompletedThisStage, setHasCompletedThisStage] = useState(false);

  const beamResult = useMemo(() => {
    const mirrors = PUZZLE_TWO_MIRROR_IDS.map((id, index) => ({
      id,
      position: toVector2D(PUZZLE_TWO_MIRROR_POSITIONS[index] ?? [0, 0, 0]),
      orientation: orientations[id] ?? ("BACK_SLASH" as const),
    }));
    return simulateLightBeam(
      {
        position: toVector2D(PUZZLE_TWO_LIGHT_SOURCE.position),
        direction: PUZZLE_TWO_LIGHT_SOURCE.direction,
      },
      mirrors,
      { position: toVector2D(PUZZLE_TWO_TARGET), radius: 0.6 }
    );
  }, [orientations]);

  useEffect(() => {
    if (!isActiveStage || !beamResult.hitsTarget || hasCompletedThisStage) {
      return;
    }
    setHasCompletedThisStage(true);
    const objectiveManager = puzzleManager.getObjectiveManager();
    const objective = objectiveManager
      .listAll()
      .find((entry) => entry.id === PUZZLE_TWO_OBJECTIVE_ID);
    if (objective) {
      objectiveManager.sync([progressObjective(objective, 1)]);
    }
    puzzleManager.checkStageCompletion();
    onStageProgressChanged();
  }, [
    beamResult.hitsTarget,
    isActiveStage,
    hasCompletedThisStage,
    puzzleManager,
    onStageProgressChanged,
  ]);

  return (
    <>
      {PUZZLE_TWO_MIRROR_POSITIONS.map((position, index) => {
        const id = PUZZLE_TWO_MIRROR_IDS[index];
        if (!id) {
          return null;
        }
        return (
          <MirrorPost
            key={id}
            id={id}
            position={position}
            orientation={orientations[id] ?? "BACK_SLASH"}
            onRotate={() => {
              setOrientations((current) => ({
                ...current,
                [id]:
                  current[id] === "FORWARD_SLASH"
                    ? ("BACK_SLASH" as const)
                    : ("FORWARD_SLASH" as const),
              }));
            }}
          />
        );
      })}

      <TargetCrystal position={PUZZLE_TWO_TARGET} isActivated={beamResult.hitsTarget} />

      <LightBeamVisualization
        path={beamResult.path}
        height={PUZZLE_TWO_BEAM_HEIGHT}
        hitsTarget={beamResult.hitsTarget}
      />

      <SightBlockingWall
        position={PUZZLE_TWO_SIGHT_WALL_POSITION}
        width={12}
        height={4.5}
        rotationY={Math.PI / 2}
      />
    </>
  );
}
