import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { Group, Vector3 } from "three";
import type { AnimationClip } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { AnimationStateMachine } from "@/domain/character/animation/AnimationStateMachine";
import { MovementStateMachine } from "@/domain/character/movement/MovementStateMachine";
import {
  integrateHorizontalVelocity,
  integrateVerticalVelocity,
  zeroHorizontalVelocity,
} from "@/domain/character/movement/MovementIntegrator";
import { hasMovementIntent, type MovementInput } from "@/domain/character/movement/MovementInput";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { CharacterAnimationConfig } from "@/domain/character/animation/CharacterAnimationConfig";
import { inputFrameToMoveVector, type InputFrameState } from "@/domain/input/InputFrameState";
import { CharacterAnimationController } from "@/infrastructure/character/CharacterAnimationController";
import { cloneCharacterScene } from "@/infrastructure/character/CharacterModelLoader";
import { GroundSensor } from "@/infrastructure/physics/GroundSensor";

export interface CharacterControllerProps {
  readonly entity: CharacterEntity;
  readonly gltf: GLTF;
  readonly clips: readonly AnimationClip[];
  readonly animationConfig: CharacterAnimationConfig;
  /** Populated once per frame by useInputFrame — read-only here. */
  readonly inputFrameRef: React.RefObject<InputFrameState>;
  /** Read each frame to get camera yaw for camera-relative movement; written by ThirdPersonCamera. */
  readonly cameraYawRef: React.RefObject<number>;
  /** Called each frame after the entity's transform/state is updated, so a camera or debug panel can follow without an extra render round-trip. */
  readonly onFrame?: (entity: CharacterEntity) => void;
}

const UP_AXIS = new Vector3(0, 1, 0);

/**
 * Spawns and drives one character. Reusable for any CharacterEntity —
 * nothing here is Boy/Girl-specific; the model, clips, and animation
 * config are all passed in as props, resolved upstream from the
 * character's CharacterConfig.
 */
export function CharacterController({
  entity,
  gltf,
  clips,
  animationConfig,
  inputFrameRef,
  cameraYawRef,
  onFrame,
}: CharacterControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelGroupRef = useRef<Group>(null);
  const { world } = useRapier();

  const clonedScene = useMemo(() => cloneCharacterScene(gltf.scene), [gltf.scene]);
  const groundSensor = useMemo(() => new GroundSensor(world), [world]);
  const movementStateMachine = useMemo(() => new MovementStateMachine(), []);
  const animationStateMachine = useMemo(() => new AnimationStateMachine(), []);
  const animationController = useMemo(
    () => new CharacterAnimationController(clonedScene, clips, animationConfig),
    [clonedScene, clips, animationConfig]
  );

  useEffect(() => {
    return () => {
      animationController.dispose();
    };
  }, [animationController]);

  useFrame((_, rawDelta) => {
    const rigidBody = rigidBodyRef.current;
    if (!rigidBody) {
      return;
    }
    const deltaSeconds = Math.min(rawDelta, 1 / 30); // clamp to avoid huge steps on tab-refocus

    const tuning = entity.config.movementTuning;
    const inputFrame = inputFrameRef.current;
    const rawMove = inputFrameToMoveVector(inputFrame);

    // Rotate the raw (screen-relative) move vector by camera yaw so "forward" means "away from camera".
    const cameraYaw = cameraYawRef.current;
    const sin = Math.sin(cameraYaw);
    const cos = Math.cos(cameraYaw);
    const movementInput: MovementInput = {
      moveX: rawMove.x * cos + rawMove.z * sin,
      moveZ: -rawMove.x * sin + rawMove.z * cos,
      sprintHeld: inputFrame.sprintHeld,
      jumpPressed: inputFrame.jumpPressed,
    };

    const translation = rigidBody.translation();
    const groundResult = groundSensor.sense(
      { x: translation.x, y: translation.y - tuning.groundCheckDistance, z: translation.z },
      tuning,
      rigidBody.handle
    );

    const currentLinvel = rigidBody.linvel();
    const vertical = integrateVerticalVelocity(
      currentLinvel.y,
      groundResult.isGrounded,
      movementInput.jumpPressed,
      tuning,
      deltaSeconds
    );

    const targetSpeed = movementInput.sprintHeld ? tuning.sprintSpeed : tuning.runSpeed;
    const moveMagnitude = Math.hypot(movementInput.moveX, movementInput.moveZ);
    const desiredDirection =
      moveMagnitude > 0
        ? { x: movementInput.moveX / moveMagnitude, z: movementInput.moveZ / moveMagnitude }
        : zeroHorizontalVelocity();

    const horizontal = integrateHorizontalVelocity(
      { x: currentLinvel.x, z: currentLinvel.z },
      desiredDirection,
      hasMovementIntent(movementInput) ? targetSpeed * moveMagnitude : 0,
      tuning,
      deltaSeconds
    );

    rigidBody.setLinvel({ x: horizontal.x, y: vertical.velocityY, z: horizontal.z }, true);

    const horizontalSpeed = Math.hypot(horizontal.x, horizontal.z);
    const desiredYaw = hasMovementIntent(movementInput)
      ? Math.atan2(movementInput.moveX, movementInput.moveZ)
      : entity.getYaw();
    const yawDelta = shortestAngleDelta(entity.getYaw(), desiredYaw);
    const isTurningInPlace = !hasMovementIntent(movementInput) && Math.abs(yawDelta) > 0.05;

    const locomotionState = movementStateMachine.update(
      {
        isGrounded: groundResult.isGrounded,
        horizontalSpeed,
        verticalVelocity: vertical.velocityY,
        sprintHeld: movementInput.sprintHeld,
        didJump: vertical.didJump,
        isTurningInPlace,
      },
      tuning,
      deltaSeconds
    );

    if (Math.abs(yawDelta) > 0.001) {
      const maxYawStep = tuning.rotationSpeedRadiansPerSecond * deltaSeconds;
      const step = Math.sign(yawDelta) * Math.min(Math.abs(yawDelta), maxYawStep);
      entity.setYaw(entity.getYaw() + step);
    }

    if (modelGroupRef.current) {
      modelGroupRef.current.quaternion.setFromAxisAngle(UP_AXIS, entity.getYaw());
    }

    const animationSnapshot = animationStateMachine.update(
      locomotionState,
      yawDelta >= 0 ? "left" : "right"
    );
    animationController.playRole(animationSnapshot.activeRole);
    animationController.update(deltaSeconds);

    entity.setPosition({ x: translation.x, y: translation.y, z: translation.z });
    entity.setVelocity({ x: horizontal.x, y: vertical.velocityY, z: horizontal.z });
    entity.setLocomotionState(locomotionState);

    onFrame?.(entity);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      enabledRotations={[false, false, false]}
      position={[entity.getPosition().x, entity.getPosition().y, entity.getPosition().z]}
      friction={0}
    >
      <CapsuleCollider
        args={[
          entity.config.capsuleHeight / 2 - entity.config.capsuleRadius,
          entity.config.capsuleRadius,
        ]}
      />
      <group ref={modelGroupRef}>
        <primitive object={clonedScene} />
      </group>
    </RigidBody>
  );
}

/** Shortest signed angle from `from` to `to`, wrapped to [-PI, PI]. */
function shortestAngleDelta(from: number, to: number): number {
  const delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) {
    return delta - Math.PI * 2;
  }
  if (delta < -Math.PI) {
    return delta + Math.PI * 2;
  }
  return delta;
}
