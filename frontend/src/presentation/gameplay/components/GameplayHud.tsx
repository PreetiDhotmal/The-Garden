import { useEffect, useState } from "react";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";

/**
 * Faith and Coins come straight from RewardEngine.getTotals()
 * (Milestone 4) — that's not reactive state on its own, so this
 * re-reads it whenever a reward:granted event fires, rather than
 * polling.
 *
 * Health is deliberately not shown — no combat or damage system
 * exists yet, so a health bar would just be a static, meaningless
 * 100% forever. CharacterStats still tracks it for other reasons
 * (Milestone 3); this HUD simply doesn't surface it until there's a
 * real reason to.
 */
export function GameplayHud() {
  const { eventBus, rewardEngine } = useGameplay();
  const [totals, setTotals] = useState(rewardEngine.getTotals());

  useEffect(() => {
    return eventBus.on("reward:granted", () => {
      setTotals(rewardEngine.getTotals());
    });
  }, [eventBus, rewardEngine]);

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-20 flex gap-3 rounded-md border border-garden-700 bg-black/50 px-3 py-1.5 text-sm text-light-divine">
      <HudStat icon="◆" label="Level" value={totals.level} />
      <HudStat icon="✦" label="Faith" value={totals.faithPoints} />
      <HudStat icon="●" label="Coins" value={totals.coins} />
    </div>
  );
}

function HudStat({
  icon,
  label,
  value,
}: {
  readonly icon: string;
  readonly label: string;
  readonly value: number;
}) {
  return (
    <span className="flex items-center gap-1" title={label}>
      <span className="text-garden-300">{icon}</span>
      <span className="font-mono">{value}</span>
    </span>
  );
}
