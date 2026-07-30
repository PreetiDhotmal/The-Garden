import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { TeleportRequest } from "@/presentation/character/components/CharacterController";
import { InteractableObject } from "@/presentation/gameplay/components/InteractableObject";
import { progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { PressurePlate } from "./PressurePlate";
import { HiddenBridge } from "./HiddenBridge";
import { GlowingPlatform } from "./GlowingPlatform";
import { FaithLift } from "./FaithLift";
import { VisibleToPlayer } from "./VisibleToPlayer";
import {
  FINAL_PUZZLE_PLATFORM_POSITIONS,
  FINAL_PUZZLE_PLATFORM_RESPAWN_POSITION,
  FINAL_PUZZLE_PLATFORM_FALL_Y_THRESHOLD,
  FINAL_PUZZLE_LEVER_POSITION,
  FINAL_PUZZLE_LIFT_BASE_POSITION,
  FINAL_PUZZLE_LIFT_TOP_Y,
  FINAL_PUZZLE_LIFT_TRAVEL_SECONDS,
  FINAL_PUZZLE_LIFT_DESTINATION_POSITION,
  FINAL_PUZZLE_LIFT_READY_RADIUS,
  FINAL_PUZZLE_STAIRCASE_STEP_COUNT,
  getFinalPuzzleStaircaseStepPosition,
} from "@/presentation/levels/trust/trustLevelContent";

export interface TrustFinalPuzzleProps {
  readonly platePosition: readonly [number, number, number];
  readonly bridgePosition: readonly [number, number, number];
  readonly bridgeLength: number;
  readonly windZoneStartZ: number;
  readonly windZoneEndZ: number;
  readonly togetherDistance: number;
  readonly maxWindSpeed: number;
  readonly goalPosition: readonly [number, number, number];
  readonly goalRadius: number;
  readonly objectiveId: string;
  readonly playerAEntity: CharacterEntity | null;
  readonly playerBEntity: CharacterEntity | null;
  readonly playerBTeleportRequestRef: React.RefObject<TeleportRequest | null>;
  readonly playerAExternalVelocityRef: React.RefObject<{ x: number; z: number } | null>;
  readonly playerBExternalVelocityRef: React.RefObject<{ x: number; z: number } | null>;
  readonly puzzleManager: CoopPuzzleManager;
  readonly isActiveStage: boolean;
  readonly onStageProgressChanged: () => void;
  readonly onTimeRemainingChanged: (secondsRemaining: number | null) => void;
}

function isInsideZone(z: number, zoneStartZ: number, zoneEndZ: number): boolean {
  return z <= zoneStartZ && z >= zoneEndZ;
}

const LEVER_ID = "interactable:trust:final-lever";

/**
 * "The chapter's mastery challenge" — genuinely combines all five
 * mechanics in one continuous, timed sequence, reusing the exact same
 * components each earlier puzzle already proved: PressurePlate +
 * HiddenBridge (Puzzle 1), GlowingPlatform + fall-and-teleport-respawn
 * (Puzzle 2), FaithLift + lever + arrival teleport (Puzzle 3), and
 * distance-scaled wind (Puzzle 4). No new mechanic is introduced —
 * only the sequencing (bridge -> platforms -> lift -> wind -> goal)
 * and the single shared timer are new.
 */
export function TrustFinalPuzzle({
  platePosition,
  bridgePosition,
  bridgeLength,
  windZoneStartZ,
  windZoneEndZ,
  togetherDistance,
  maxWindSpeed,
  goalPosition,
  goalRadius,
  objectiveId,
  playerAEntity,
  playerBEntity,
  playerBTeleportRequestRef,
  playerAExternalVelocityRef,
  playerBExternalVelocityRef,
  puzzleManager,
  isActiveStage,
  onStageProgressChanged,
  onTimeRemainingChanged,
}: TrustFinalPuzzleProps) {
  const [isPlateActive, setIsPlateActive] = useState(false);
  const [isLiftActivated, setIsLiftActivated] = useState(false);
  const hasCompletedRef = useRef(false);
  const platformTeleportIdRef = useRef(0);
  const liftTeleportIdRef = useRef(0);
  const liftArrivalTimeoutRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const hasBecomeAvailableRef = useRef(false);
  const hasHandledExpiryRef = useRef(false);

  const resetAll = () => {
    hasCompletedRef.current = false;
    setIsPlateActive(false);
    setIsLiftActivated(false);
    elapsedRef.current = 0;
    hasBecomeAvailableRef.current = false;
    hasHandledExpiryRef.current = false;
    if (liftArrivalTimeoutRef.current !== null) {
      window.clearTimeout(liftArrivalTimeoutRef.current);
      liftArrivalTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    resetAll();
    return () => {
      if (liftArrivalTimeoutRef.current !== null) {
        window.clearTimeout(liftArrivalTimeoutRef.current);
      }
    };
  }, [isActiveStage]);

  const handleActivateLift = () => {
    if (!isActiveStage || isLiftActivated || !playerBEntity) {
      return;
    }
    const position = playerBEntity.getPosition();
    const dx = position.x - FINAL_PUZZLE_LIFT_BASE_POSITION[0];
    const dz = position.z - FINAL_PUZZLE_LIFT_BASE_POSITION[2];
    const isPlayerBReady = Math.hypot(dx, dz) <= FINAL_PUZZLE_LIFT_READY_RADIUS;

    setIsLiftActivated(true);
    liftArrivalTimeoutRef.current = window.setTimeout(() => {
      if (isPlayerBReady) {
        liftTeleportIdRef.current += 1;
        playerBTeleportRequestRef.current = {
          position: {
            x: FINAL_PUZZLE_LIFT_DESTINATION_POSITION[0],
            y: FINAL_PUZZLE_LIFT_DESTINATION_POSITION[1],
            z: FINAL_PUZZLE_LIFT_DESTINATION_POSITION[2],
          },
          requestId: 1_000_000 + liftTeleportIdRef.current,
        };
      }
      setIsLiftActivated(false);
    }, FINAL_PUZZLE_LIFT_TRAVEL_SECONDS * 1000);
  };

  useFrame((_, delta) => {
    if (!isActiveStage || !playerAEntity || !playerBEntity) {
      playerAExternalVelocityRef.current = null;
      playerBExternalVelocityRef.current = null;
      return;
    }

    elapsedRef.current += delta;
    if (!hasBecomeAvailableRef.current) {
      hasBecomeAvailableRef.current = true;
      puzzleManager.getObjectiveManager().isAvailable(objectiveId, elapsedRef.current);
    }
    onTimeRemainingChanged(
      puzzleManager.getObjectiveManager().getTimeRemainingSeconds(objectiveId, elapsedRef.current)
    );

    if (
      !hasHandledExpiryRef.current &&
      !hasCompletedRef.current &&
      puzzleManager.getObjectiveManager().isExpired(objectiveId, elapsedRef.current)
    ) {
      hasHandledExpiryRef.current = true;
      puzzleManager.recordMissedAttempt();
      resetAll();
      return;
    }

    // Segment 2: invisible platforms — fall-and-respawn, same pattern as Puzzle 2.
    const posB = playerBEntity.getPosition();
    if (posB.y < FINAL_PUZZLE_PLATFORM_FALL_Y_THRESHOLD) {
      platformTeleportIdRef.current += 1;
      playerBTeleportRequestRef.current = {
        position: {
          x: FINAL_PUZZLE_PLATFORM_RESPAWN_POSITION[0],
          y: FINAL_PUZZLE_PLATFORM_RESPAWN_POSITION[1],
          z: FINAL_PUZZLE_PLATFORM_RESPAWN_POSITION[2],
        },
        requestId: 2_000_000 + platformTeleportIdRef.current,
      };
    }

    // Segment 4: wind — distance-scaled, same pattern as Puzzle 4.
    const posA = playerAEntity.getPosition();
    const distance = Math.hypot(posA.x - posB.x, posA.z - posB.z);
    const excessDistance = Math.max(0, distance - togetherDistance);
    const windStrength = Math.min(maxWindSpeed, (excessDistance / 6) * maxWindSpeed);
    playerAExternalVelocityRef.current = isInsideZone(posA.z, windZoneStartZ, windZoneEndZ)
      ? { x: 0, z: windStrength }
      : null;
    playerBExternalVelocityRef.current = isInsideZone(posB.z, windZoneStartZ, windZoneEndZ)
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
      onTimeRemainingChanged(null);
      onStageProgressChanged();
    }
  });

  return (
    <>
      {/* Segment 1: pressure plate + hidden bridge (Puzzle 1). */}
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

      {/* Segment 2: invisible platforms (Puzzle 2) — visible to A only, guiding B across. */}
      <VisibleToPlayer player="A">
        {FINAL_PUZZLE_PLATFORM_POSITIONS.map((position, index) => (
          <GlowingPlatform key={`final-platform-${index.toString()}`} position={position} />
        ))}
      </VisibleToPlayer>

      {/* Segment 3: faith lift (Puzzle 3) — lever + lift visible to A only, destination visible to B only. */}
      <VisibleToPlayer player="A">
        <InteractableObject
          id={LEVER_ID}
          position={FINAL_PUZZLE_LEVER_POSITION}
          promptText="Activate Lift"
          color="#c98a4c"
          radius={2.5}
          onInteract={handleActivateLift}
        />
        <FaithLift
          basePosition={FINAL_PUZZLE_LIFT_BASE_POSITION}
          topY={FINAL_PUZZLE_LIFT_TOP_Y}
          travelSeconds={FINAL_PUZZLE_LIFT_TRAVEL_SECONDS}
          isActivated={isLiftActivated}
        />
      </VisibleToPlayer>
      <VisibleToPlayer player="B">
        <RigidBody
          type="fixed"
          colliders="cuboid"
          position={FINAL_PUZZLE_LIFT_DESTINATION_POSITION}
        >
          <mesh receiveShadow castShadow>
            <boxGeometry args={[5, 0.5, 5]} />
            <meshStandardMaterial color="#6b8f5a" roughness={0.9} />
          </mesh>
        </RigidBody>
      </VisibleToPlayer>
      {Array.from({ length: FINAL_PUZZLE_STAIRCASE_STEP_COUNT }, (_, stepIndex) => (
        <RigidBody
          key={`final-stair-${stepIndex.toString()}`}
          type="fixed"
          colliders="cuboid"
          position={getFinalPuzzleStaircaseStepPosition(stepIndex)}
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
