import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { Group, Vector3 } from "three";
import type { AnimationClip } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { AnimationRole } from "@/domain/character/animation/AnimationRole";
import { AnimationStateMachine } from "@/domain/character/animation/AnimationStateMachine";
import { CharacterState } from "@/domain/character/CharacterState";
import { MovementStateMachine } from "@/domain/character/movement/MovementStateMachine";
import { FootstepDetector } from "@/domain/character/movement/FootstepDetector";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
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
import { computeFootPositionY } from "@/domain/character/movement/FootPosition";

export interface TeleportRequest {
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  /** Increment on every new request — the controller only acts when this changes, so re-rendering with the same request object is a no-op, not a repeated teleport. */
  readonly requestId: number;
}

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
  /**
   * Optional external teleport channel — e.g. a "safe fall" respawn
   * for a puzzle mechanic. Necessary because the rigid body drives the
   * domain entity's position every frame (read further down in this
   * same useFrame), not the reverse: calling entity.setPosition()
   * directly from outside this component would be silently overwritten
   * on the very next frame by the physics simulation's own translation.
   * Checked and applied first, before any movement integration, so a
   * teleport this frame is never partially overridden by the same
   * frame's movement step.
   */
  readonly teleportRequestRef?: React.RefObject<TeleportRequest | null>;
  /**
   * Optional continuous external velocity (e.g. wind) added on top of
   * the player's own movement, read fresh every frame — a puzzle
   * mechanic can update the ref's value each frame (e.g. based on
   * distance between two players) without needing its own render
   * cycle. Added directly to the horizontal velocity this component
   * already computes and owns, rather than via Rapier's addForce(),
   * since this component calls setLinvel() (which overwrites
   * velocity, not adds to it) every single frame regardless — an
   * external addForce() call from outside would have uncertain
   * interaction with that overwrite depending on physics step
   * ordering I have no way to verify without a live browser. Adding
   * the offset at the one place velocity is actually set is the
   * approach I can be certain is correct.
   */
  readonly externalVelocityRef?: React.RefObject<{ x: number; z: number } | null>;
}

const UP_AXIS = new Vector3(0, 1, 0);
/** No footstep audio asset has been provided yet — this id is checked via assetManager.isCached() before playing, so the feature activates automatically once one is registered under this id. */
const FOOTSTEP_SFX_ASSET_ID = "audio:sfx:footstep-grass";
const LANDING_SFX_ASSET_ID = "audio:sfx:landing";

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
  teleportRequestRef,
  externalVelocityRef,
}: CharacterControllerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const modelGroupRef = useRef<Group>(null);
  const lastHandledTeleportIdRef = useRef(0);
  const debugLogAccumulatorRef = useRef(0);
  const { world } = useRapier();
  const { assetManager, sfxManager } = useEngine();

  const clonedScene = useMemo(() => cloneCharacterScene(gltf.scene), [gltf.scene]);
  const groundSensor = useMemo(() => new GroundSensor(world), [world]);
  const movementStateMachine = useMemo(() => new MovementStateMachine(), []);
  const animationStateMachine = useMemo(() => new AnimationStateMachine(), []);
  const footstepDetector = useMemo(() => new FootstepDetector(), []);
  const previousLocomotionStateRef = useRef<CharacterState>(CharacterState.IDLE);
  const animationController = useMemo(
    () => new CharacterAnimationController(clonedScene, clips, animationConfig),
    [clonedScene, clips, animationConfig]
  );

  useEffect(() => {
    return () => {
      animationController.dispose();
    };
  }, [animationController]);

  useLayoutEffect(() => {
    animationController.forcePose(AnimationRole.IDLE);
  }, [animationController]);

  useFrame((_, rawDelta) => {
    const rigidBody = rigidBodyRef.current;
    if (!rigidBody) {
      return;
    }
    const deltaSeconds = Math.min(rawDelta, 1 / 30); // clamp to avoid huge steps on tab-refocus

    const teleportRequest = teleportRequestRef?.current;
    if (teleportRequest && teleportRequest.requestId !== lastHandledTeleportIdRef.current) {
      lastHandledTeleportIdRef.current = teleportRequest.requestId;
      rigidBody.setTranslation(teleportRequest.position, true);
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

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
    const footPositionY = computeFootPositionY(translation.y, entity.config.capsuleHeight);
    const groundResult = groundSensor.sense(
      { x: translation.x, y: footPositionY, z: translation.z },
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

    const externalVelocity = externalVelocityRef?.current;
    const finalVelocityX = horizontal.x + (externalVelocity?.x ?? 0);
    const finalVelocityZ = horizontal.z + (externalVelocity?.z ?? 0);
    rigidBody.setLinvel({ x: finalVelocityX, y: vertical.velocityY, z: finalVelocityZ }, true);

    const horizontalSpeed = Math.hypot(horizontal.x, horizontal.z);

    if (
      footstepDetector.update(horizontalSpeed * deltaSeconds, groundResult.isGrounded, movementInput.sprintHeld)
    ) {
      const footstepBuffer = assetManager.isCached(FOOTSTEP_SFX_ASSET_ID)
        ? assetManager.getCached<AudioBuffer>(FOOTSTEP_SFX_ASSET_ID)
        : undefined;
      if (footstepBuffer) {
        sfxManager.play(footstepBuffer, { volume: 0.5 });
      }
      // No footstep audio asset has been provided yet (see Milestone 2's
      // documented "AudioManager wired but silent" limitation) — the
      // detection/trigger logic is fully wired and ready the moment one is.
    }

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

    if (
      locomotionState === CharacterState.LANDING &&
      previousLocomotionStateRef.current !== CharacterState.LANDING
    ) {
      const landingBuffer = assetManager.isCached(LANDING_SFX_ASSET_ID)
        ? assetManager.getCached<AudioBuffer>(LANDING_SFX_ASSET_ID)
        : undefined;
      if (landingBuffer) {
        sfxManager.play(landingBuffer, { volume: 0.6 });
      }
      // No landing sound asset exists yet, same as footsteps — this
      // trigger is fully wired and ready the moment one is registered
      // under LANDING_SFX_ASSET_ID.
    }
    previousLocomotionStateRef.current = locomotionState;

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

    // TEMPORARY DEBUG LOGGING — remove once confirmed fixed in a live
    // browser. Throttled to ~once/sec (not every frame) to stay
    // readable. Covers exactly the diagnostic points requested:
    // ground-check result, locomotion/animation state, current clip,
    // and physics vs. visual position (should differ by exactly
    // capsuleHeight/2 now that both the ground-check and the model
    // offset use that same value).
    if (import.meta.env.DEV) {
      debugLogAccumulatorRef.current += deltaSeconds;
      if (debugLogAccumulatorRef.current >= 1) {
        debugLogAccumulatorRef.current = 0;
        console.log(`[CharacterDebug:${entity.config.id}]`, {
          isGrounded: groundResult.isGrounded,
          groundDistance: groundResult.groundDistance,
          locomotionState,
          animationRole: animationSnapshot.activeRole,
          justTransitioned: animationSnapshot.justTransitioned,
          currentClip: animationController.getCurrentClipName(),
          currentClipWeight: animationController.getActiveActionWeight(),
          physicsPositionY: translation.y,
          footPositionY,
          modelGroupWorldY: modelGroupRef.current?.getWorldPosition(new Vector3()).y ?? null,
          horizontalSpeed,
          verticalVelocity: vertical.velocityY,
        });
      }
    }

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
      <group ref={modelGroupRef} position={[0, -entity.config.capsuleHeight / 2, 0]}>
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
