import { useEffect, useState } from "react";
import { useRapier } from "@react-three/rapier";
import { Html } from "@react-three/drei";
import { useDebugSettingsStore } from "@/presentation/engine/stores/debugSettingsStore";

/**
 * Needs useRapier() (only available inside <Physics>, inside
 * <Canvas>) but renders plain DOM elements — R3F's Canvas can only
 * reconcile scene objects directly, so this portals its DOM output
 * back out via drei's <Html fullscreen>, the standard pattern for
 * "Canvas-context-dependent but DOM-rendered" content.
 *
 * Rapier doesn't expose a React-friendly change subscription for its
 * world contents, so this polls on an interval — same pattern as
 * WorldDebugPanel (Milestone 5) for the same reason: a dev overlay
 * doesn't need frame-perfect sync.
 */
export function CollisionDebugPanel() {
  const { world } = useRapier();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      forceTick((tick) => tick + 1);
    }, 500);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const isDebugPanelOpen = useDebugSettingsStore((state) => state.isPanelOpen);

  if (!import.meta.env.DEV || !isDebugPanelOpen) {
    return null;
  }

  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div className="pointer-events-none fixed bottom-4 left-4 z-30 flex flex-col gap-1 rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
        <div className="font-semibold text-garden-300">Collision Debug</div>
        <div>Rigid bodies: {world.bodies.len()}</div>
        <div>Colliders: {world.colliders.len()}</div>
        <div>Physics timestep: {world.timestep.toFixed(4)}s</div>
        <div>Gravity Y: {world.gravity.y.toFixed(2)} m/s²</div>
      </div>
    </Html>
  );
}
