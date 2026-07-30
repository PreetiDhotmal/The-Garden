import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import type { Camera } from "three";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import { createThirdPersonCameraConfig } from "@/domain/camera/CameraOrbitState";
import type { InputFrameState } from "@/domain/input/InputFrameState";
import { ThirdPersonCameraController } from "@/infrastructure/camera/ThirdPersonCameraController";

export interface ThirdPersonCameraProps {
  readonly target: CharacterEntity;
  /** Populated once per frame by useInputFrame — read-only here. */
  readonly inputFrameRef: React.RefObject<InputFrameState>;
  readonly cameraYawRef: React.RefObject<number>;
  /** Populated with the live controller instance once created, so a parent route can capture/restore orbit state for save/load. */
  readonly controllerRef?: React.RefObject<ThirdPersonCameraController | null>;
  readonly invertY?: boolean;
  /**
   * Explicit camera to drive, instead of R3F's single scene default —
   * needed for split-screen co-op, where each player has their own
   * camera object rendered to their own half of the screen rather
   * than sharing the scene's one default camera. Omit for the
   * existing single-player behavior, which is unchanged.
   */
  readonly cameraOverride?: Camera;
}

/**
 * Reads look/zoom input each frame, resolves the camera's position via
 * ThirdPersonCameraController (smoothing + collision avoidance), and
 * applies it directly to the active camera. Mouse and gamepad both
 * feed this identically — it only ever consumes InputSystem's merged
 * frame, never a specific device.
 */
export function ThirdPersonCamera({
  target,
  inputFrameRef,
  cameraYawRef,
  controllerRef,
  invertY = false,
  cameraOverride,
}: ThirdPersonCameraProps) {
  const defaultCamera = useThree((state) => state.camera);
  const camera = cameraOverride ?? defaultCamera;
  const { world } = useRapier();

  const config = useMemo(() => createThirdPersonCameraConfig(), []);
  const controller = useMemo(() => new ThirdPersonCameraController(config, world), [config, world]);

  useEffect(() => {
    if (controllerRef) {
      controllerRef.current = controller;
    }
  }, [controller, controllerRef]);

  useEffect(() => {
    camera.position.set(target.getPosition().x, target.getPosition().y + 2, target.getPosition().z + 6);
  }, [camera, target]);

  useFrame((_, rawDelta) => {
    const deltaSeconds = Math.min(rawDelta, 1 / 30);
    const inputFrame = inputFrameRef.current;

    controller.applyLookDelta(inputFrame.lookDeltaX, inputFrame.lookDeltaY * (invertY ? -1 : 1));
    controller.applyZoomDelta(inputFrame.zoomDelta);

    const frame = controller.update(target.getPosition(), deltaSeconds);
    camera.position.set(frame.position.x, frame.position.y, frame.position.z);
    camera.lookAt(frame.lookAt.x, frame.lookAt.y, frame.lookAt.z);

    // Only the yaw component is needed by the character controller for camera-relative movement.
    const dx = frame.lookAt.x - frame.position.x;
    const dz = frame.lookAt.z - frame.position.z;
    cameraYawRef.current = Math.atan2(dx, dz);
  });

  return null;
}
