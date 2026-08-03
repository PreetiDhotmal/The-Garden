import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { AnimationClip, Camera } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { CharacterAnimationConfig } from "@/domain/character/animation/CharacterAnimationConfig";
import type { InputFrameState } from "@/domain/input/InputFrameState";
import { createEnvironmentConfig } from "@/domain/engine/config/EnvironmentConfig";
import type { InputSystem } from "@/infrastructure/input/InputSystem";
import type { ThirdPersonCameraController } from "@/infrastructure/camera/ThirdPersonCameraController";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { useInputFrame } from "../hooks/useInputFrame";
import { CharacterController, type TeleportRequest } from "./CharacterController";
import { ThirdPersonCamera } from "./ThirdPersonCamera";

export interface CharacterSceneProps {
  readonly entity: CharacterEntity;
  readonly gltf: GLTF;
  readonly clips: readonly AnimationClip[];
  readonly animationConfig: CharacterAnimationConfig;
  readonly inputSystem: InputSystem;
  /** Extra Canvas content (e.g. interactable world objects) that needs the same shared input frame ref this scene already samples. */
  readonly children?: (context: { inputFrameRef: React.RefObject<InputFrameState> }) => React.ReactNode;
  /** Populated with the live camera controller instance, so a parent route can capture/restore camera orbit state for save/load. */
  readonly cameraControllerRef?: React.RefObject<ThirdPersonCameraController | null>;
  readonly invertY?: boolean;
  /** Explicit camera for this character's own viewport — split-screen co-op only. Omit for existing single-player behavior. */
  readonly cameraOverride?: Camera;
  /** Split-screen co-op: each player has their own ground plane already rendered by the shared world scene, so a second character shouldn't spawn a duplicate. */
  readonly skipGroundPlane?: boolean;
  /** Forwarded straight through to CharacterController — see its own docstring for why this exists. */
  readonly teleportRequestRef?: React.RefObject<TeleportRequest | null>;
  /** Forwarded straight through to CharacterController — see its own docstring for why this exists. */
  readonly externalVelocityRef?: React.RefObject<{ x: number; z: number } | null>;
}

export function CharacterScene({
  entity,
  gltf,
  clips,
  animationConfig,
  inputSystem,
  children,
  cameraControllerRef,
  invertY = false,
  cameraOverride,
  skipGroundPlane = false,
  teleportRequestRef,
  externalVelocityRef,
}: CharacterSceneProps) {
  const { lightingManager } = useEngine();
  const scene = useThree((state) => state.scene);
  const inputFrameRef = useInputFrame(inputSystem);
  const cameraYawRef = useRef(0);

  useEffect(() => {
    lightingManager.applyToScene(scene, createEnvironmentConfig({ id: "character-preview-day" }));
  }, [scene, lightingManager]);

  return (
    <>
      <CharacterController
        entity={entity}
        gltf={gltf}
        clips={clips}
        animationConfig={animationConfig}
        inputFrameRef={inputFrameRef}
        cameraYawRef={cameraYawRef}
        {...(teleportRequestRef ? { teleportRequestRef } : {})}
        {...(externalVelocityRef ? { externalVelocityRef } : {})}
      />
      <ThirdPersonCamera
        target={entity}
        inputFrameRef={inputFrameRef}
        cameraYawRef={cameraYawRef}
        invertY={invertY}
        {...(cameraControllerRef ? { controllerRef: cameraControllerRef } : {})}
        {...(cameraOverride ? { cameraOverride } : {})}
      />

      {!skipGroundPlane && (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh receiveShadow position={[0, -0.5, 0]}>
            <boxGeometry args={[100, 1, 100]} />
            <meshStandardMaterial color="#6f9b4f" roughness={0.9} />
          </mesh>
        </RigidBody>
      )}

      {children?.({ inputFrameRef })}
    </>
  );
}
