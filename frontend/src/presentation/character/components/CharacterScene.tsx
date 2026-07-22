import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { AnimationClip } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import type { CharacterAnimationConfig } from "@/domain/character/animation/CharacterAnimationConfig";
import type { InputFrameState } from "@/domain/input/InputFrameState";
import { createEnvironmentConfig } from "@/domain/engine/config/EnvironmentConfig";
import type { InputSystem } from "@/infrastructure/input/InputSystem";
import { useEngine } from "@/presentation/engine/hooks/useEngine";
import { useInputFrame } from "../hooks/useInputFrame";
import { CharacterController } from "./CharacterController";
import { ThirdPersonCamera } from "./ThirdPersonCamera";

export interface CharacterSceneProps {
  readonly entity: CharacterEntity;
  readonly gltf: GLTF;
  readonly clips: readonly AnimationClip[];
  readonly animationConfig: CharacterAnimationConfig;
  readonly inputSystem: InputSystem;
  /** Extra Canvas content (e.g. interactable world objects) that needs the same shared input frame ref this scene already samples. */
  readonly children?: (context: { inputFrameRef: React.RefObject<InputFrameState> }) => React.ReactNode;
}

export function CharacterScene({
  entity,
  gltf,
  clips,
  animationConfig,
  inputSystem,
  children,
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
      />
      <ThirdPersonCamera target={entity} inputFrameRef={inputFrameRef} cameraYawRef={cameraYawRef} />

      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[100, 1, 100]} />
          <meshStandardMaterial color="#6f9b4f" roughness={0.9} />
        </mesh>
      </RigidBody>

      {children?.({ inputFrameRef })}
    </>
  );
}
