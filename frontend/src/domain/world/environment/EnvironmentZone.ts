import type { EnvironmentConfig } from "@/domain/engine/config/EnvironmentConfig";
import type { TriggerShape } from "@/domain/world/trigger/TriggerShape";

export interface EnvironmentZone {
  readonly id: string;
  readonly shape: TriggerShape;
  readonly environmentConfig: EnvironmentConfig;
  /** Higher priority wins when zones overlap (e.g. a small sacred-clearing zone nested inside a larger forest zone). */
  readonly priority: number;
}

export function createEnvironmentZone(
  id: string,
  shape: TriggerShape,
  environmentConfig: EnvironmentConfig,
  priority = 0
): EnvironmentZone {
  return { id, shape, environmentConfig, priority };
}

/** Resolves which zone's config should currently be applied, given every zone the player is inside (highest priority wins). */
export function resolveActiveZone(
  zonesPlayerIsInside: readonly EnvironmentZone[]
): EnvironmentZone | null {
  if (zonesPlayerIsInside.length === 0) {
    return null;
  }
  return [...zonesPlayerIsInside].sort((a, b) => b.priority - a.priority)[0] ?? null;
}
