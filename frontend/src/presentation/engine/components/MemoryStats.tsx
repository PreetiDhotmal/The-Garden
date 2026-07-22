import { usePerformanceStatsStore } from "../stores/performanceStatsStore";

export function MemoryStats() {
  const memoryUsedMB = usePerformanceStatsStore((state) => state.memoryUsedMB);

  return (
    <div className="flex justify-between gap-4 font-mono text-xs">
      <span>Memory</span>
      <span>{memoryUsedMB !== null ? `${memoryUsedMB.toFixed(1)} MB` : "n/a"}</span>
    </div>
  );
}
