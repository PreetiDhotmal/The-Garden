import { useEffect, useState } from "react";
import type { WorldManager } from "@/infrastructure/world/WorldManager";

export interface WorldDebugPanelProps {
  readonly worldManager: WorldManager;
}

/**
 * Dev-only. Polls WorldManager's state on an interval rather than
 * subscribing to every underlying event stream individually — this
 * mirrors CharacterDebugPanel's polling approach from Milestone 3 for
 * the same reason (a dev overlay doesn't need frame-perfect sync).
 */
export function WorldDebugPanel({ worldManager }: WorldDebugPanelProps) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      forceTick((tick) => tick + 1);
    }, 250);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const streamedInRegions = worldManager.streamingCoordinator.getStreamedInRegionIds();
  const insideTriggers = worldManager.triggerVolumeManager.listInside();
  const weather = worldManager.weatherManager.getState();
  const reachedCheckpoints = worldManager.checkpointManager.listReached();

  return (
    <div className="flex flex-col gap-1 rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">World</div>
      <div>Regions registered: {worldManager.regionRegistry.list().length}</div>
      <div>Regions streamed in: {streamedInRegions.join(", ") || "(none)"}</div>
      <div>Triggers occupied: {insideTriggers.join(", ") || "(none)"}</div>
      <div>
        Weather: {weather.type} ({weather.intensity.toFixed(2)})
      </div>
      <div>Checkpoints reached: {reachedCheckpoints.length}</div>
      <div>Spawn points: {worldManager.spawnManager.list().length}</div>
    </div>
  );
}
