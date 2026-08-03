import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";
import { AnimationRole } from "@/domain/character/animation/AnimationRole";
import { CharacterAnimationController } from "@/infrastructure/character/CharacterAnimationController";
import { cloneCharacterScene } from "@/infrastructure/character/CharacterModelLoader";
import { useCharacterAssets } from "@/presentation/character/hooks/useCharacterAssets";
import {
  createBoyAnimationConfig,
  createGirlAnimationConfig,
} from "@/infrastructure/character/defaultAnimationConfigs";
import type { PlayableCharacterId } from "@/presentation/character/stores/characterSelectionStore";

export interface CharacterPreviewSceneProps {
  readonly characterAssetId: string;
  readonly characterId: PlayableCharacterId;
}

const BASE_DISTANCE = 1.4;
const MIN_DISTANCE = 0.9;
const MAX_DISTANCE = 2.6;
const AUTO_ROTATE_SPEED_RADIANS_PER_SECOND = 0.15;

/**
 * Auto-orbits slowly by default (matching MainMenuScreen's established
 * ambient-orbit convention) but a drag gesture takes over rotation
 * immediately and a scroll gesture zooms — genuine player control,
 * not just an ambient camera move standing in for it.
 */
export function CharacterPreviewScene({
  characterAssetId,
  characterId,
}: CharacterPreviewSceneProps) {
  const { data } = useCharacterAssets(characterAssetId);
  const camera = useThree((state) => state.camera);
  const glDomElement = useThree((state) => state.gl.domElement);
  const controllerRef = useRef<CharacterAnimationController | null>(null);
  const groupRef = useRef<Group>(null);
  const yawRef = useRef(0);
  const distanceRef = useRef(BASE_DISTANCE);
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef(0);

  const clonedScene = useMemo(() => (data ? cloneCharacterScene(data.gltf.scene) : null), [data]);
  const createAnimationConfig =
    characterId === "girl" ? createGirlAnimationConfig : createBoyAnimationConfig;

  useLayoutEffect(() => {
    if (!clonedScene || !data) {
      return;
    }
    const animationConfig = createAnimationConfig(data.clipRegistry);
    const controller = new CharacterAnimationController(
      clonedScene,
      data.gltf.animations,
      animationConfig
    );
    controllerRef.current = controller;
    controller.forcePose(AnimationRole.IDLE);
    return () => {
      controller.dispose();
    };
  }, [clonedScene, data, createAnimationConfig]);

  useEffect(() => {
    const domElement = glDomElement;
    const handlePointerDown = (event: PointerEvent) => {
      isDraggingRef.current = true;
      lastPointerXRef.current = event.clientX;
    };
    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }
      const deltaX = event.clientX - lastPointerXRef.current;
      lastPointerXRef.current = event.clientX;
      yawRef.current += deltaX * 0.01;
    };
    const handleWheel = (event: WheelEvent) => {
      distanceRef.current = Math.min(
        MAX_DISTANCE,
        Math.max(MIN_DISTANCE, distanceRef.current + event.deltaY * 0.002)
      );
    };
    domElement.addEventListener("pointerdown", handlePointerDown);
    // pointerup/pointermove stay on window so a drag started on the
    // canvas doesn't get stuck "active" if the pointer leaves the
    // canvas bounds mid-drag.
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove);
    domElement.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
      domElement.removeEventListener("wheel", handleWheel);
    };
  }, [glDomElement]);

  useFrame((_, delta) => {
    controllerRef.current?.update(delta);

    if (!isDraggingRef.current) {
      yawRef.current += AUTO_ROTATE_SPEED_RADIANS_PER_SECOND * delta;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = yawRef.current;
    }

    camera.position.set(0, 1.05, distanceRef.current);
    camera.lookAt(0, 0.55, 0);
  });

  if (!clonedScene) {
    return null;
  }

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={2} castShadow />
      <pointLight position={[-3, 2, -2]} intensity={0.5} color="#a8c8ff" />
      <group ref={groupRef} position={[0, 0, 0]}>
        <primitive object={clonedScene} />
      </group>
    </>
  );
}
