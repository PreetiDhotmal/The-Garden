import { usePerformanceStatsStore } from "../stores/performanceStatsStore";

export function FpsCounter() {
  const fps = usePerformanceStatsStore((state) => state.fps);
  const frameTimeMs = usePerformanceStatsStore((state) => state.frameTimeMs);

  return (
    <div className="flex justify-between gap-4 font-mono text-xs">
      <span>FPS</span>
      <span>
        {fps} ({frameTimeMs.toFixed(1)} ms)
      </span>
    </div>
  );
}
