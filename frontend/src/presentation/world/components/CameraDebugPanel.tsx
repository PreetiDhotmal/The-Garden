import { useEffect, useState } from "react";
import type { ThirdPersonCameraController } from "@/infrastructure/camera/ThirdPersonCameraController";
import { useDebugSettingsStore } from "@/presentation/engine/stores/debugSettingsStore";

export interface CameraDebugPanelProps {
  readonly controllerRef: React.RefObject<ThirdPersonCameraController | null>;
}

export function CameraDebugPanel({ controllerRef }: CameraDebugPanelProps) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      forceTick((tick) => tick + 1);
    }, 200);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const controller = controllerRef.current;

  const isDebugPanelOpen = useDebugSettingsStore((state) => state.isPanelOpen);

  if (!import.meta.env.DEV || !isDebugPanelOpen) {
    return null;
  }

  if (!controller) {
    return null;
  }

  const orbit = controller.getOrbitState();

  return (
    <div className="flex flex-col gap-1 rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">Camera Debug</div>
      <div>Yaw: {orbit.yaw.toFixed(3)} rad</div>
      <div>Pitch: {orbit.pitch.toFixed(3)} rad</div>
      <div>Distance: {orbit.distance.toFixed(2)} m</div>
    </div>
  );
}
