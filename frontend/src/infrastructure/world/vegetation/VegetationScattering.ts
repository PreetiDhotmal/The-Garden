export interface VegetationInstanceTransform {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotationY: number;
  readonly scale: number;
}

export interface ScatterVegetationOptions {
  readonly seed: number;
  readonly count: number;
  readonly areaWidth: number;
  readonly areaDepth: number;
  readonly heightFunction: (x: number, z: number) => number;
  readonly minScale?: number;
  readonly maxScale?: number;
  /** Return true to skip a candidate position (e.g. inside the river or on a path). */
  readonly isExcluded?: (x: number, z: number) => boolean;
  readonly maxAttemptsPerInstance?: number;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEFAULT_MAX_ATTEMPTS_PER_INSTANCE = 10;

/**
 * Scatters `count` instances across a rectangular area, resting each
 * on the terrain surface (via `heightFunction`) with a random yaw and
 * scale. Deterministic for a given seed — the same seed always
 * produces the same layout, so a designer-authored world (e.g. "no
 * trees blocking the Scripture Stone at (4, 4)") stays stable across
 * runs. Positions failing `isExcluded` are retried up to
 * `maxAttemptsPerInstance` times, then skipped (so the result may
 * contain fewer than `count` instances in a densely-excluded area).
 */
export function scatterVegetation(
  options: ScatterVegetationOptions
): readonly VegetationInstanceTransform[] {
  const {
    seed,
    count,
    areaWidth,
    areaDepth,
    heightFunction,
    minScale = 0.8,
    maxScale = 1.3,
    isExcluded,
    maxAttemptsPerInstance = DEFAULT_MAX_ATTEMPTS_PER_INSTANCE,
  } = options;

  const random = mulberry32(seed);
  const instances: VegetationInstanceTransform[] = [];

  for (let i = 0; i < count; i += 1) {
    let placed = false;
    for (let attempt = 0; attempt < maxAttemptsPerInstance && !placed; attempt += 1) {
      const x = (random() - 0.5) * areaWidth;
      const z = (random() - 0.5) * areaDepth;
      if (isExcluded?.(x, z)) {
        continue;
      }
      instances.push({
        x,
        y: heightFunction(x, z),
        z,
        rotationY: random() * Math.PI * 2,
        scale: minScale + random() * (maxScale - minScale),
      });
      placed = true;
    }
  }

  return instances;
}
