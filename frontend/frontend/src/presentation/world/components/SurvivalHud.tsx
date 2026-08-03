import type { SurvivalStats } from "@/domain/gameplay/survival/SurvivalStats";

export interface SurvivalHudProps {
  readonly stats: SurvivalStats;
}

export function SurvivalHud({ stats }: SurvivalHudProps) {
  const thirstPercent = (stats.thirst / stats.maxThirst) * 100;
  const staminaPercent = (stats.stamina / stats.maxStamina) * 100;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-20 flex flex-col gap-1.5 rounded-md border border-garden-700 bg-black/50 px-3 py-2">
      <Bar label="Thirst" percent={thirstPercent} colorClassName="bg-sky-400" />
      <Bar label="Stamina" percent={staminaPercent} colorClassName="bg-amber-400" />
    </div>
  );
}

function Bar({
  label,
  percent,
  colorClassName,
}: {
  readonly label: string;
  readonly percent: number;
  readonly colorClassName: string;
}) {
  return (
    <div className="flex w-36 flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-garden-300">{label}</span>
      <div className="h-2 overflow-hidden rounded-full border border-garden-700 bg-black/50">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClassName}`}
          style={{ width: `${Math.max(0, Math.min(100, percent)).toString()}%` }}
        />
      </div>
    </div>
  );
}
