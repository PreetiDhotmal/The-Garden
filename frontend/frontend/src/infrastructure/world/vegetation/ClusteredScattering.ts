export interface ClusterCenter {
  readonly x: number;
  readonly z: number;
  /** Relative pull strength — higher-weight clusters draw more instances toward them. */
  readonly weight: number;
  readonly radius: number;
}

export interface GenerateClusterCentersOptions {
  readonly seed: number;
  readonly count: number;
  readonly areaWidth: number;
  readonly areaDepth: number;
  readonly minRadius?: number;
  readonly maxRadius?: number;
}

import { mulberry32 } from "./VegetationScattering";

/**
 * Deterministically places `count` cluster centers across the area —
 * the "believable clumps" a forest actually has, rather than uniform
 * spacing. Each center gets its own random radius and weight, so some
 * clusters read as small tight thickets and others as looser, wider
 * groves.
 */
export function generateClusterCenters(
  options: GenerateClusterCentersOptions
): readonly ClusterCenter[] {
  const { seed, count, areaWidth, areaDepth, minRadius = 4, maxRadius = 12 } = options;
  const random = mulberry32(seed);
  const centers: ClusterCenter[] = [];
  for (let i = 0; i < count; i += 1) {
    centers.push({
      x: (random() - 0.5) * areaWidth,
      z: (random() - 0.5) * areaDepth,
      weight: 0.5 + random(),
      radius: minRadius + random() * (maxRadius - minRadius),
    });
  }
  return centers;
}

export interface ClusteredPointOptions {
  readonly seed: number;
  readonly count: number;
  readonly areaWidth: number;
  readonly areaDepth: number;
  readonly centers: readonly ClusterCenter[];
  /**
   * Fraction (0-1) of instances placed uniformly across the whole area
   * rather than pulled toward a cluster — keeps clusters from reading
   * as perfectly empty everywhere else, matching real forests having
   * some genuinely scattered undergrowth between the denser clumps.
   */
  readonly scatterFraction?: number;
  readonly isExcluded?: (x: number, z: number) => boolean;
  readonly maxAttemptsPerInstance?: number;
}

const DEFAULT_MAX_ATTEMPTS_PER_INSTANCE = 12;

/**
 * Generates (x, z) points weighted toward `centers` — most points land
 * within a center's radius (a Gaussian-like falloff via
 * (random()+random())/2, which biases toward the middle of [0,1]
 * rather than a hard uniform disc), with a configurable fraction
 * placed fully uniformly instead, so gaps between clusters aren't
 * completely bare. Deterministic for a given seed, matching the
 * existing scatterVegetation contract exactly — same seed, same
 * layout, every time.
 */
export function generateClusteredPoints(
  options: ClusteredPointOptions
): readonly { x: number; z: number }[] {
  const {
    seed,
    count,
    areaWidth,
    areaDepth,
    centers,
    scatterFraction = 0.15,
    isExcluded,
    maxAttemptsPerInstance = DEFAULT_MAX_ATTEMPTS_PER_INSTANCE,
  } = options;

  const random = mulberry32(seed);
  const points: { x: number; z: number }[] = [];

  const totalWeight = centers.reduce((sum, center) => sum + center.weight, 0);

  const pickCenter = (): ClusterCenter | null => {
    if (centers.length === 0 || totalWeight <= 0) {
      return null;
    }
    let roll = random() * totalWeight;
    for (const center of centers) {
      roll -= center.weight;
      if (roll <= 0) {
        return center;
      }
    }
    return centers[centers.length - 1] ?? null;
  };

  for (let i = 0; i < count; i += 1) {
    let placed = false;
    for (let attempt = 0; attempt < maxAttemptsPerInstance && !placed; attempt += 1) {
      const useUniform = random() < scatterFraction;
      const center = useUniform ? null : pickCenter();

      let x: number;
      let z: number;
      if (center) {
        // Bias toward the center of the disc (average of two uniforms
        // approximates a triangular/Gaussian-ish distribution) rather
        // than a hard uniform disc, so density genuinely peaks at the
        // cluster center and tapers off, instead of being flat inside
        // the radius and cut off sharply at the edge.
        const angle = random() * Math.PI * 2;
        const distanceFraction = (random() + random()) / 2;
        const distance = distanceFraction * center.radius;
        x = center.x + Math.cos(angle) * distance;
        z = center.z + Math.sin(angle) * distance;
      } else {
        x = (random() - 0.5) * areaWidth;
        z = (random() - 0.5) * areaDepth;
      }

      if (Math.abs(x) > areaWidth / 2 || Math.abs(z) > areaDepth / 2) {
        continue;
      }
      if (isExcluded?.(x, z)) {
        continue;
      }

      points.push({ x, z });
      placed = true;
    }
  }

  return points;
}
