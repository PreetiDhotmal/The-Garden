export interface SurvivalStats {
  readonly thirst: number;
  readonly maxThirst: number;
  readonly stamina: number;
  readonly maxStamina: number;
}

export const INITIAL_SURVIVAL_STATS: SurvivalStats = {
  thirst: 100,
  maxThirst: 100,
  stamina: 100,
  maxStamina: 100,
};

const THIRST_DRAIN_PER_SECOND = 0.6;
const STAMINA_DRAIN_PER_SECOND_SPRINTING = 4;
const STAMINA_REGEN_PER_SECOND = 8;

/** Thirst drains continuously; heat (desert sun) doubles the rate while not sheltered. */
export function drainThirst(
  stats: SurvivalStats,
  deltaSeconds: number,
  isSheltered: boolean
): SurvivalStats {
  const rate = isSheltered ? THIRST_DRAIN_PER_SECOND * 0.4 : THIRST_DRAIN_PER_SECOND;
  return { ...stats, thirst: Math.max(0, stats.thirst - rate * deltaSeconds) };
}

export function drinkWater(stats: SurvivalStats, amount: number): SurvivalStats {
  return { ...stats, thirst: Math.min(stats.maxThirst, stats.thirst + amount) };
}

/** Stamina drains while sprinting, regenerates otherwise — independent of thirst, which never regenerates on its own. */
export function updateStamina(
  stats: SurvivalStats,
  deltaSeconds: number,
  isSprinting: boolean
): SurvivalStats {
  if (isSprinting && stats.stamina > 0) {
    return {
      ...stats,
      stamina: Math.max(0, stats.stamina - STAMINA_DRAIN_PER_SECOND_SPRINTING * deltaSeconds),
    };
  }
  return {
    ...stats,
    stamina: Math.min(stats.maxStamina, stats.stamina + STAMINA_REGEN_PER_SECOND * deltaSeconds),
  };
}

export function isCriticallyThirsty(stats: SurvivalStats): boolean {
  return stats.thirst <= 20;
}

export function canSprint(stats: SurvivalStats): boolean {
  return stats.stamina > 0;
}
