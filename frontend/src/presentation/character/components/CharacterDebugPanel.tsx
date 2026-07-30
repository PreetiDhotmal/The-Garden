import { useSyncExternalStore } from "react";
import type { CharacterEntity } from "@/domain/character/CharacterEntity";
import { useDebugSettingsStore } from "@/presentation/engine/stores/debugSettingsStore";

/**
 * CharacterEntity is a plain mutable class (no observable/store), so
 * this panel polls it via requestAnimationFrame rather than
 * subscribing — appropriate for a dev-only display that doesn't need
 * to be perfectly synchronized with React's render cycle.
 */
function subscribeToNextFrame(callback: () => void): () => void {
  const handle = requestAnimationFrame(callback);
  return () => {
    cancelAnimationFrame(handle);
  };
}

export interface CharacterDebugPanelProps {
  readonly entity: CharacterEntity;
}

export function CharacterDebugPanel({ entity }: CharacterDebugPanelProps) {
  // Re-renders every animation frame by re-subscribing each time — a deliberate, simple polling pattern for a dev tool.
  useSyncExternalStore(subscribeToNextFrame, () => performance.now());

  const isDebugPanelOpen = useDebugSettingsStore((state) => state.isPanelOpen);

  if (!import.meta.env.DEV || !isDebugPanelOpen) {
    return null;
  }

  const position = entity.getPosition();
  const velocity = entity.getVelocity();

  return (
    <div className="flex flex-col gap-1 rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">Character: {entity.instanceId}</div>
      <div>State: {entity.getLocomotionState()}</div>
      <div>
        Position: {position.x.toFixed(2)}, {position.y.toFixed(2)}, {position.z.toFixed(2)}
      </div>
      <div>
        Velocity: {velocity.x.toFixed(2)}, {velocity.y.toFixed(2)}, {velocity.z.toFixed(2)}
      </div>
      <div>Yaw: {entity.getYaw().toFixed(2)} rad</div>
      <div>Health: {entity.getStats().currentHealth.toFixed(0)}</div>
    </div>
  );
}
