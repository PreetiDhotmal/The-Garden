/**
 * Generic numeric attributes a character may have. Deliberately
 * minimal and gameplay-agnostic — combat, quests, and stamina-gated
 * abilities are future milestones; this only covers what's needed to
 * exist as a character (health) and what the movement system already
 * consumes (stamina, if a future sprint-drain mechanic wants it — not
 * wired up this milestone, just modeled).
 */
export interface CharacterStats {
  readonly maxHealth: number;
  readonly currentHealth: number;
  readonly maxStamina: number;
  readonly currentStamina: number;
}

export class InvalidCharacterStatsError extends Error {
  constructor(reason: string) {
    super(`Invalid character stats: ${reason}`);
    this.name = "InvalidCharacterStatsError";
  }
}

export interface CreateCharacterStatsInput {
  readonly maxHealth?: number;
  readonly currentHealth?: number;
  readonly maxStamina?: number;
  readonly currentStamina?: number;
}

export function createCharacterStats(input: CreateCharacterStatsInput = {}): CharacterStats {
  const maxHealth = input.maxHealth ?? 100;
  const maxStamina = input.maxStamina ?? 100;
  const currentHealth = input.currentHealth ?? maxHealth;
  const currentStamina = input.currentStamina ?? maxStamina;

  if (maxHealth <= 0) {
    throw new InvalidCharacterStatsError("maxHealth must be greater than zero");
  }
  if (maxStamina <= 0) {
    throw new InvalidCharacterStatsError("maxStamina must be greater than zero");
  }
  if (currentHealth < 0 || currentHealth > maxHealth) {
    throw new InvalidCharacterStatsError("currentHealth must be between 0 and maxHealth");
  }
  if (currentStamina < 0 || currentStamina > maxStamina) {
    throw new InvalidCharacterStatsError("currentStamina must be between 0 and maxStamina");
  }

  return { maxHealth, currentHealth, maxStamina, currentStamina };
}

export function withDamage(stats: CharacterStats, amount: number): CharacterStats {
  if (amount < 0) {
    throw new InvalidCharacterStatsError("damage amount must not be negative");
  }
  return { ...stats, currentHealth: Math.max(0, stats.currentHealth - amount) };
}

export function withStaminaDelta(stats: CharacterStats, delta: number): CharacterStats {
  const nextStamina = Math.min(stats.maxStamina, Math.max(0, stats.currentStamina + delta));
  return { ...stats, currentStamina: nextStamina };
}
