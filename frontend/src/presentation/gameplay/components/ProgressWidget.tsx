import { useGameplay } from "../hooks/useGameplay";
import { useGameplayVersion } from "../hooks/useGameplayVersion";

const EXPERIENCE_PER_LEVEL = 100;

export function ProgressWidget() {
  const { rewardEngine } = useGameplay();
  useGameplayVersion(["reward:granted", "player:leveled-up"]);

  const totals = rewardEngine.getTotals();
  const currentLevelFloor = (totals.level - 1) * EXPERIENCE_PER_LEVEL;
  const progressWithinLevel = (totals.experience - currentLevelFloor) / EXPERIENCE_PER_LEVEL;

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-30 flex flex-col gap-1 rounded-md border border-garden-700 bg-black/70 p-3 text-xs text-light-divine">
      <div className="font-semibold">Level {totals.level}</div>
      <div className="h-1.5 w-40 overflow-hidden rounded bg-garden-900">
        <div
          className="h-full bg-garden-500"
          style={{ width: `${(Math.min(1, Math.max(0, progressWithinLevel)) * 100).toString()}%` }}
        />
      </div>
      <div className="mt-1 flex gap-3 text-garden-300">
        <span>Faith: {totals.faithPoints}</span>
        <span>Coins: {totals.coins}</span>
      </div>
    </div>
  );
}
