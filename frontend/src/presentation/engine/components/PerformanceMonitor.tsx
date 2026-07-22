import { FpsCounter } from "./FpsCounter";
import { MemoryStats } from "./MemoryStats";
import { RenderStats } from "./RenderStats";

export function PerformanceMonitor() {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-garden-700 bg-black/70 p-3 text-light-divine">
      <FpsCounter />
      <RenderStats />
      <MemoryStats />
    </div>
  );
}
