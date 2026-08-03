import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useEngine } from "./useEngine";
import { usePerformanceStatsStore } from "../stores/performanceStatsStore";

const STATS_UPDATE_INTERVAL_SECONDS = 0.25;

interface PerformanceMemory {
  usedJSHeapSize: number;
}

function readMemoryUsedMB(): number | null {
  const memory = (performance as Performance & { memory?: PerformanceMemory }).memory;
  return memory ? memory.usedJSHeapSize / (1024 * 1024) : null;
}

/**
 * Must be mounted inside `<Canvas>` (it uses R3F's `useFrame`). Drives
 * the pure TimeSystem with real frame deltas, emits `time:tick` on the
 * event bus for any other system that wants to react, and throttles
 * performance-stat updates to avoid re-rendering the stats store every
 * single frame.
 */
export function useRenderLoop(): void {
  const { timeSystem, eventBus } = useEngine();
  const { gl } = useThree();
  const updateStats = usePerformanceStatsStore((state) => state.update);
  const sinceLastStatsUpdate = useRef(0);
  const frameCount = useRef(0);

  useFrame((_, rawDelta) => {
    const snapshot = timeSystem.tick(rawDelta);
    eventBus.emit("time:tick", {
      deltaSeconds: snapshot.deltaSeconds,
      elapsedSeconds: snapshot.elapsedSeconds,
    });

    frameCount.current += 1;
    sinceLastStatsUpdate.current += rawDelta;
    if (sinceLastStatsUpdate.current >= STATS_UPDATE_INTERVAL_SECONDS) {
      const fps = frameCount.current / sinceLastStatsUpdate.current;
      updateStats({
        fps: Math.round(fps),
        frameTimeMs: rawDelta * 1000,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        memoryUsedMB: readMemoryUsedMB(),
      });
      frameCount.current = 0;
      sinceLastStatsUpdate.current = 0;
    }
  });
}
