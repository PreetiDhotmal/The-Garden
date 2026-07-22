import { usePerformanceStatsStore } from "../stores/performanceStatsStore";

export function RenderStats() {
  const drawCalls = usePerformanceStatsStore((state) => state.drawCalls);
  const triangles = usePerformanceStatsStore((state) => state.triangles);

  return (
    <div className="flex flex-col gap-1 font-mono text-xs">
      <div className="flex justify-between gap-4">
        <span>Draw calls</span>
        <span>{drawCalls}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Triangles</span>
        <span>{triangles.toLocaleString()}</span>
      </div>
    </div>
  );
}
