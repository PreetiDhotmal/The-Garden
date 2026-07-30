export interface ExclusionZone {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
}

/**
 * Builds a single `isExcluded` predicate from a list of protected
 * zones — the systematic form of "never place decorations where
 * puzzles, checkpoints, or interaction zones exist." A scene lists
 * its own real puzzle/checkpoint positions (the same position
 * constants already used to place the actual mechanisms, not
 * duplicated numbers) and gets back one predicate to pass to every
 * scatter call, rather than each call site re-deriving its own
 * exclusion logic — one source of truth per scene for "where
 * decorations must never spawn."
 */
export function createExclusionZones(
  zones: readonly ExclusionZone[]
): (x: number, z: number) => boolean {
  return (x: number, z: number) => {
    for (const zone of zones) {
      const dx = x - zone.x;
      const dz = z - zone.z;
      if (dx * dx + dz * dz <= zone.radius * zone.radius) {
        return true;
      }
    }
    return false;
  };
}

/**
 * Combines multiple exclusion predicates (e.g. puzzle zones AND a
 * slope filter AND a river-bank exclusion) into one — a position is
 * excluded if ANY of the given predicates excludes it. Each predicate
 * stays independently simple and testable; scenes compose them
 * however many rules actually apply.
 */
export function combineExclusions(
  ...predicates: readonly ((x: number, z: number) => boolean)[]
): (x: number, z: number) => boolean {
  return (x: number, z: number) => predicates.some((predicate) => predicate(x, z));
}
