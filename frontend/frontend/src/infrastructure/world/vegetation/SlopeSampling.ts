/**
 * Samples terrain steepness at (x, z) using a finite-difference
 * gradient of `heightFunction` — the same function every terrain mesh
 * and vegetation placement call already uses, so this works anywhere
 * a heightFunction is available without needing the actual rendered
 * geometry's normals. Returns a 0-1 value: 0 is perfectly flat, 1
 * approaches vertical.
 */
export function sampleSlope(
  heightFunction: (x: number, z: number) => number,
  x: number,
  z: number,
  sampleDistance = 0.5
): number {
  const heightXPlus = heightFunction(x + sampleDistance, z);
  const heightXMinus = heightFunction(x - sampleDistance, z);
  const heightZPlus = heightFunction(x, z + sampleDistance);
  const heightZMinus = heightFunction(x, z - sampleDistance);

  const gradientX = (heightXPlus - heightXMinus) / (2 * sampleDistance);
  const gradientZ = (heightZPlus - heightZMinus) / (2 * sampleDistance);
  const gradientMagnitude = Math.hypot(gradientX, gradientZ);

  // Converts a raw slope (rise/run, unbounded) into the normal's
  // deviation from straight up — matches how TerrainMesh's own
  // layered material derives slope from the vertex normal
  // (1 - normal.y), so a "steep" threshold here means the same thing
  // visually as it does in that shader.
  const normalY = 1 / Math.sqrt(1 + gradientMagnitude * gradientMagnitude);
  return 1 - normalY;
}

export interface SlopeFilterOptions {
  readonly heightFunction: (x: number, z: number) => number;
  readonly minSlope?: number;
  readonly maxSlope?: number;
}

/**
 * Builds a reusable `isExcluded`-shaped predicate for scatter calls —
 * returns true (exclude) when the terrain at (x, z) falls OUTSIDE the
 * given slope range. Compose with other exclusion predicates (e.g.
 * puzzle zones) via a simple `(x, z) => a(x, z) || b(x, z)` — this
 * function doesn't know about or depend on anything else that might
 * also be excluding positions.
 */
export function createSlopeExclusion(
  options: SlopeFilterOptions
): (x: number, z: number) => boolean {
  const { heightFunction, minSlope = 0, maxSlope = 1 } = options;
  return (x: number, z: number) => {
    const slope = sampleSlope(heightFunction, x, z);
    return slope < minSlope || slope > maxSlope;
  };
}
