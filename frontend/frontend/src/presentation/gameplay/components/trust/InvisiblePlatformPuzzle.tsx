import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { TeleportRequest } from "@/presentation/character/components/CharacterController";
import { progressObjective } from "@/domain/gameplay/quest/QuestObjective";
import type { CoopPuzzleManager } from "@/domain/game/puzzle/CoopPuzzleManager";
import { GlowingPlatform } from "./GlowingPlatform";
import { VisibleToPlayer } from "./VisibleToPlayer";
import {
  PUZZLE_TWO_RAMP_LENGTH,
  PUZZLE_TWO_RAMP_POSITION,
  PUZZLE_TWO_RAMP_ROTATION_X,
} from "@/presentation/levels/trust/trustLevelContent";

export interface InvisiblePlatformPuzzleProps {
  readonly platformPositions: readonly (readonly [number, number, number])[];
  readonly respawnPosition: readonly [number, number, number];
  readonly fallYThreshold: number;
  readonly goalPosition: readonly [number, number, number];
  readonly goalRadius?: number;
  readonly objectiveId: string;
  readonly playerBEntity: CharacterEntity | null;
  readonly playerBTeleportRequestRef: React.RefObject<TeleportRequest | null>;
  readonly puzzleManager: CoopPuzzleManager;
  readonly isActiveStage: boolean;
  readonly onStageProgressChanged: () => void;
  readonly onPlayerBFell: () => void;
}

/**
 * "If Player B steps incorrectly they safely fall and respawn nearby.
 * No punishment." — implemented literally: falling below
 * fallYThreshold triggers an actual teleport back to the start ledge
 * via the new CharacterController teleport channel, with velocity
 * zeroed so no fall momentum carries into the respawn. Nothing about
 * progress, health, or puzzle state changes when this happens — it's
 * purely positional.
 */
export function InvisiblePlatformPuzzle({
  platformPositions,
  respawnPosition,
  fallYThreshold,
  goalPosition,
  goalRadius = 2,
  objectiveId,
  playerBEntity,
  playerBTeleportRequestRef,
  puzzleManager,
  isActiveStage,
  onStageProgressChanged,
  onPlayerBFell,
}: InvisiblePlatformPuzzleProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const hasCompletedRef = useRef(false);
  const teleportRequestIdRef = useRef(0);

  useEffect(() => {
    hasCompletedRef.current = false;
    setHasStarted(isActiveStage);
  }, [isActiveStage]);

  useFrame(() => {
    if (!hasStarted || !isActiveStage || hasCompletedRef.current || !playerBEntity) {
      return;
    }
    const position = playerBEntity.getPosition();

    if (position.y < fallYThreshold) {
      teleportRequestIdRef.current += 1;
      playerBTeleportRequestRef.current = {
        position: { x: respawnPosition[0], y: respawnPosition[1], z: respawnPosition[2] },
        requestId: teleportRequestIdRef.current,
      };
      onPlayerBFell();
      return;
    }

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
      <RigidBody type="fixed" colliders="cuboid" position={PUZZLE_TWO_RAMP_POSITION}>
        <mesh rotation={[-PUZZLE_TWO_RAMP_ROTATION_X, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[2, 0.2, PUZZLE_TWO_RAMP_LENGTH + 1]} />
          <meshStandardMaterial color="#7a6a52" roughness={0.9} />
        </mesh>
      </RigidBody>
      <VisibleToPlayer player="A">
        {platformPositions.map((position, index) => (
          <GlowingPlatform key={`platform-${index.toString()}`} position={position} />
        ))}
      </VisibleToPlayer>
    </>
  );
}
