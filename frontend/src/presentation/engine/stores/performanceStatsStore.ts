import { create } from "zustand";

export interface PerformanceStats {
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly memoryUsedMB: number | null;
}

interface PerformanceStatsState extends PerformanceStats {
  update: (stats: PerformanceStats) => void;
}

const INITIAL_STATS: PerformanceStats = {
  fps: 0,
  frameTimeMs: 0,
  drawCalls: 0,
  triangles: 0,
  memoryUsedMB: null,
};

export const usePerformanceStatsStore = create<PerformanceStatsState>((set) => ({
  ...INITIAL_STATS,
  update: (stats) => {
    set(stats);
  },
}));
