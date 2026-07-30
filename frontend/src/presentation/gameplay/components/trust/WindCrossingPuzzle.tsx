import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import { progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";

export interface WindCrossingPuzzleProps {
  readonly zoneStartZ: number;
  readonly zoneEndZ: number;
  readonly togetherDistance: number;
  readonly maxWindSpeed: number;
  readonly goalPosition: readonly [number, number, number];
  readonly goalRadius: number;
  readonly objectiveId: string;
  readonly playerAEntity: CharacterEntity | null;
  readonly playerBEntity: CharacterEntity | null;
  readonly playerAExternalVelocityRef: React.RefObject<{ x: number; z: number } | null>;
  readonly playerBExternalVelocityRef: React.RefObject<{ x: number; z: number } | null>;
  readonly puzzleManager: CoopPuzzleManager;
  readonly isActiveStage: boolean;
  readonly onStageProgressChanged: () => void;
}

function isInsideZone(z: number, zoneStartZ: number, zoneEndZ: number): boolean {
  // zoneStartZ > zoneEndZ (crossing moves toward more negative Z), so
  // "inside" means between the two regardless of which is numerically larger.
  return z <= zoneStartZ && z >= zoneEndZ;
}

/**
 * "Cooperation directly affects physics" implemented literally: wind
 * strength is a continuous function of the live distance between the
 * two players, recomputed every single frame, not a one-time check.
 * Walking apart mid-crossing genuinely increases the push immediately;
 * closing the gap immediately reduces it. Only players currently
 * inside the zone are pushed — someone who has already crossed
 * doesn't get blown backward by a partner still struggling behind.
 */
export function WindCrossingPuzzle({
  zoneStartZ,
  zoneEndZ,
  togetherDistance,
  maxWindSpeed,
  goalPosition,
  goalRadius,
  objectiveId,
  playerAEntity,
  playerBEntity,
  playerAExternalVelocityRef,
  playerBExternalVelocityRef,
  puzzleManager,
  isActiveStage,
  onStageProgressChanged,
}: WindCrossingPuzzleProps) {
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    hasCompletedRef.current = false;
  }, [isActiveStage]);

  useFrame(() => {
    if (!isActiveStage || !playerAEntity || !playerBEntity) {
      playerAExternalVelocityRef.current = null;
      playerBExternalVelocityRef.current = null;
      return;
    }

    const posA = playerAEntity.getPosition();
    const posB = playerBEntity.getPosition();
    const distance = Math.hypot(posA.x - posB.x, posA.z - posB.z);
    const excessDistance = Math.max(0, distance - togetherDistance);
    // Scales up to maxWindSpeed over a 6-unit excess-distance band —
    // arbitrary but reasonable: fully "together" (at or under
    // togetherDistance) means effectively no wind, fully separated
    // (6+ units past that) means full strength.
    const windStrength = Math.min(maxWindSpeed, (excessDistance / 6) * maxWindSpeed);

    playerAExternalVelocityRef.current = isInsideZone(posA.z, zoneStartZ, zoneEndZ)
      ? { x: 0, z: windStrength }
      : null;
    playerBExternalVelocityRef.current = isInsideZone(posB.z, zoneStartZ, zoneEndZ)
      ? { x: 0, z: windStrength }
      : null;

    if (hasCompletedRef.current) {
      return;
    }
    const dxA = posA.x - goalPosition[0];
    const dzA = posA.z - goalPosition[2];
    const dxB = posB.x - goalPosition[0];
    const dzB = posB.z - goalPosition[2];
    const bothAtGoal = Math.hypot(dxA, dzA) <= goalRadius && Math.hypot(dxB, dzB) <= goalRadius;

    if (bothAtGoal) {
      hasCompletedRef.current = true;
      const objectiveManager = puzzleManager.getObjectiveManager();
      const objective = objectiveManager.listAll().find((entry) => entry.id === objectiveId);
      if (objective) {
        objectiveManager.sync([progressObjective(objective, 1)]);
      }
      puzzleManager.checkStageCompletion();
      onStageProgressChanged();
    }
  });

  return null;
}
