export interface PlayerProgressTotals {
  readonly experience: number;
  readonly faithPoints: number;
  readonly coins: number;
  readonly level: number;
}

export const INITIAL_PLAYER_PROGRESS: PlayerProgressTotals = {
  experience: 0,
  faithPoints: 0,
  coins: 0,
  level: 1,
};

export const EXPERIENCE_PER_LEVEL = 100;

/** Simple linear XP curve: level N requires N * EXPERIENCE_PER_LEVEL total experience. */
export function levelForExperience(experience: number): number {
  return Math.max(1, Math.floor(experience / EXPERIENCE_PER_LEVEL) + 1);
}

export function addExperience(totals: PlayerProgressTotals, amount: number): PlayerProgressTotals {
  if (amount < 0) {
    throw new RangeError("experience amount must not be negative");
  }
  const experience = totals.experience + amount;
  return { ...totals, experience, level: levelForExperience(experience) };
}

export function addFaithPoints(totals: PlayerProgressTotals, amount: number): PlayerProgressTotals {
  if (amount < 0) {
    throw new RangeError("faith points amount must not be negative");
  }
  return { ...totals, faithPoints: totals.faithPoints + amount };
}

export function addCoins(totals: PlayerProgressTotals, amount: number): PlayerProgressTotals {
  if (amount < 0) {
    throw new RangeError("coins amount must not be negative");
  }
  return { ...totals, coins: totals.coins + amount };
}
