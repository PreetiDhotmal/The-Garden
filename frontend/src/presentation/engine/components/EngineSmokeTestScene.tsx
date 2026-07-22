import { useEffect, useRef } from "react";
import { RigidBody } from "@react-three/rapier";
import { useThree } from "@react-three/fiber";
import { createEnvironmentConfig } from "@/domain/engine/config/EnvironmentConfig";
import { createSceneId } from "@/domain/engine/world/SceneId";
import { useEngine } from "../hooks/useEngine";

/**
 * Applies lighting via LightingManager and registers this scene with
 * SceneManager on mount — demonstrating the managers operate on a
 * real R3F-owned Scene, not a detached one.
 */
function EnvironmentSetup() {
  const { lightingManager, sceneManager, cameraManager } = useEngine();
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (hasRegistered.current) {
      return;
    }
    hasRegistered.current = true;

    const sceneId = createSceneId("GARDEN_OF_BEGINNINGS", "engine-preview");
    sceneManager.register(sceneId, scene);
    sceneManager.setActiveScene(sceneId);

    lightingManager.applyToScene(scene, createEnvironmentConfig({ id: "preview-day" }));

    cameraManager.register("main", camera);
  }, [scene, camera, lightingManager, sceneManager, cameraManager]);

  return null;
}

export function EngineSmokeTestScene() {
  return (
    <>
      <EnvironmentSetup />

      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[20, 1, 20]} />
          <meshStandardMaterial color="#6f9b4f" roughness={0.9} />
        </mesh>
      </RigidBody>

      <RigidBody type="dynamic" colliders="cuboid" position={[0, 5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4a6b34" roughness={0.6} />
        </mesh>
      </RigidBody>
    </>
  );
}
