import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import { progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { PressurePlate } from "./PressurePlate";
import { HiddenBridge } from "./HiddenBridge";
import { VisibleToPlayer } from "./VisibleToPlayer";
import {
  PUZZLE_ONE_RAMP_LENGTH,
  PUZZLE_ONE_RAMP_POSITION,
  PUZZLE_ONE_RAMP_ROTATION_X,
  PUZZLE_ONE_GOAL_PLATFORM_POSITION,
} from "@/presentation/levels/trust/trustLevelContent";

export interface HiddenBridgePuzzleProps {
  readonly platePosition: readonly [number, number, number];
  readonly bridgePosition: readonly [number, number, number];
  readonly bridgeLength: number;
  readonly goalPosition: readonly [number, number, number];
  readonly goalRadius?: number;
  readonly objectiveId: string;
  readonly playerAEntity: CharacterEntity | null;
  readonly playerBEntity: CharacterEntity | null;
  readonly puzzleManager: CoopPuzzleManager;
  readonly isActiveStage: boolean;
  readonly onStageProgressChanged: () => void;
}

/**
 * "Player A cannot see it. Player B must trust Player A." — enforced
 * as a genuine visibility restriction (VisibleToPlayer, Three.js
 * camera layers), not a wall or a room boundary: both players stand
 * in the same open space, and the bridge simply never renders on
 * Player A's camera. There is nothing for A to look at that would
 * confirm the bridge exists — the only confirmation is B saying so.
 */
export function HiddenBridgePuzzle({
  platePosition,
  bridgePosition,
  bridgeLength,
  goalPosition,
  goalRadius = 1.5,
  objectiveId,
  playerAEntity,
  playerBEntity,
  puzzleManager,
  isActiveStage,
  onStageProgressChanged,
}: HiddenBridgePuzzleProps) {
  const [isPlateActive, setIsPlateActive] = useState(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    hasCompletedRef.current = false;
    setIsPlateActive(false);
  }, [isActiveStage]);

  useFrame(() => {
    if (!isPlateActive || !isActiveStage || hasCompletedRef.current || !playerBEntity) {
      return;
    }
    const position = playerBEntity.getPosition();
    const dx = position.x - goalPosition[0];
    const dz = position.z - goalPosition[2];
    if (Math.hypot(dx, dz) <= goalRadius) {
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

  return (
    <>
      <PressurePlate
        position={platePosition}
        watchedEntity={playerAEntity}
        isActive={isPlateActive}
        onActivated={() => {
          setIsPlateActive(true);
        }}
      />
      <VisibleToPlayer player="B">
        <HiddenBridge position={bridgePosition} length={bridgeLength} isActive={isPlateActive} />
      </VisibleToPlayer>

      <RigidBody type="fixed" colliders="cuboid" position={PUZZLE_ONE_RAMP_POSITION}>
        <mesh rotation={[-PUZZLE_ONE_RAMP_ROTATION_X, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[2, 0.2, PUZZLE_ONE_RAMP_LENGTH + 1]} />
          <meshStandardMaterial color="#7a6a52" roughness={0.9} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" position={PUZZLE_ONE_GOAL_PLATFORM_POSITION}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[6, 0.5, 6]} />
          <meshStandardMaterial color="#6b8f5a" roughness={0.9} />
        </mesh>
      </RigidBody>
    </>
  );
}
