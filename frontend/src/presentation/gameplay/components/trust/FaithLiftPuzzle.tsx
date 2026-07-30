import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { TeleportRequest } from "@/presentation/character/components/CharacterController";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { FaithLift } from "./FaithLift";
import { VisibleToPlayer } from "./VisibleToPlayer";
import {
  PUZZLE_THREE_STAIRCASE_STEP_COUNT,
  getPuzzleThreeStaircaseStepPosition,
} from "@/presentation/levels/trust/trustLevelContent";

export interface FaithLiftPuzzleProps {
  readonly leverPosition: readonly [number, number, number];
  readonly liftBasePosition: readonly [number, number, number];
  readonly liftTopY: number;
  readonly liftTravelSeconds: number;
  readonly destinationPosition: readonly [number, number, number];
  readonly playerBReadyRadius: number;
  readonly goalPosition: readonly [number, number, number];
  readonly goalRadius?: number;
  readonly objectiveId: string;
  readonly playerBEntity: CharacterEntity | null;
  readonly playerBTeleportRequestRef: React.RefObject<TeleportRequest | null>;
  readonly puzzleManager: CoopPuzzleManager;
  readonly isActiveStage: boolean;
  readonly onStageProgressChanged: () => void;
}

const LEVER_ID = "interactable:trust:faith-lift-lever";

/**
 * "Player B cannot see whether the lift is safe" — the lever and the
 * lift mechanism itself are visible to Player A only. "Player A
 * cannot see where the lift goes" — the destination platform is
 * visible to Player B only. Genuine mutual asymmetry: neither player
 * has the full picture, matching the puzzle's own stated lesson.
 */
export function FaithLiftPuzzle({
  leverPosition,
  liftBasePosition,
  liftTopY,
  liftTravelSeconds,
  destinationPosition,
  playerBReadyRadius,
  goalPosition,
  goalRadius = 2.5,
  objectiveId,
  playerBEntity,
  playerBTeleportRequestRef,
  puzzleManager,
  isActiveStage,
  onStageProgressChanged,
}: FaithLiftPuzzleProps) {
  const [isLiftActivated, setIsLiftActivated] = useState(false);
  const hasCompletedRef = useRef(false);
  const teleportRequestIdRef = useRef(0);
  const arrivalTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    hasCompletedRef.current = false;
    setIsLiftActivated(false);
    return () => {
      if (arrivalTimeoutRef.current !== null) {
        window.clearTimeout(arrivalTimeoutRef.current);
      }
    };
  }, [isActiveStage]);

  const handleActivate = () => {
    if (!isActiveStage || isLiftActivated || !playerBEntity) {
      return;
    }
    const position = playerBEntity.getPosition();
    const dx = position.x - liftBasePosition[0];
    const dz = position.z - liftBasePosition[2];
    const isPlayerBReady = Math.hypot(dx, dz) <= playerBReadyRadius;

    setIsLiftActivated(true);

    arrivalTimeoutRef.current = window.setTimeout(() => {
      if (isPlayerBReady) {
        teleportRequestIdRef.current += 1;
        playerBTeleportRequestRef.current = {
          position: {
            x: destinationPosition[0],
            y: destinationPosition[1],
            z: destinationPosition[2],
          },
          requestId: teleportRequestIdRef.current,
        };
      }
      // Lift lowers again, ready for another attempt if the timing
      // wasn't right — "if timing fails: reset... No instant death."
      // Nothing about progress or state is punished, only the
      // opportunity to ride is missed.
      setIsLiftActivated(false);
    }, liftTravelSeconds * 1000);
  };

  useFrame(() => {
    if (!isActiveStage || hasCompletedRef.current || !playerBEntity) {
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
      <VisibleToPlayer player="A">
        <InteractableObject
          id={LEVER_ID}
          position={leverPosition}
          promptText="Activate Lift"
          color="#c98a4c"
          radius={2.5}
          onInteract={handleActivate}
        />
        <FaithLift
          basePosition={liftBasePosition}
          topY={liftTopY}
          travelSeconds={liftTravelSeconds}
          isActivated={isLiftActivated}
        />
      </VisibleToPlayer>

      <VisibleToPlayer player="B">
        <RigidBody type="fixed" colliders="cuboid" position={destinationPosition}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[5, 0.5, 5]} />
            <meshStandardMaterial color="#6b8f5a" roughness={0.9} />
          </mesh>
        </RigidBody>
      </VisibleToPlayer>

      {Array.from({ length: PUZZLE_THREE_STAIRCASE_STEP_COUNT }, (_, stepIndex) => (
        <RigidBody
          key={`stair-${stepIndex.toString()}`}
          type="fixed"
          colliders="cuboid"
          position={getPuzzleThreeStaircaseStepPosition(stepIndex)}
        >
          <mesh receiveShadow castShadow>
            <boxGeometry args={[3, 0.4, 1.6]} />
            <meshStandardMaterial color="#6b6050" roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
