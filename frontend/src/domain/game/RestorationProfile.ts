/**
 * Every visual/audio category the GDD's Garden Restoration requires
 * (Section 8/9), expressed as plain numeric/enum data rather than
 * boolean flags — "how restored" rather than "is restored", so a
 * zone's restoration can be presented as a smooth 0..1 value to
 * shaders/audio-mix logic instead of a hard on/off switch.
 */
export interface RestorationProfile {
  /** 0 = dormant (Section 3.3), 1 = fully bloomed. */
  readonly flowerDensity: number;
  readonly treeCanopyDensity: number;
  /** 0 = dry/absent, 1 = clear and flowing. */
  readonly waterLevel: number;
  readonly bridgeStable: boolean;
  /** References an audio-layer id (Section 3.5/9.1) to mix in — null means no additional layer for this profile. */
  readonly musicLayerId: string | null;
  readonly animalPresence: number;
  /** 0 = flat/cool (Section 8.1), 1 = warm/directional. */
  readonly lightingWarmth: number;
  readonly particleDensity: number;
  /** World-region/area ids this profile's completion should unlock (Hub gate, secret area, etc.). */
  readonly unlockedAreaIds: readonly string[];
}

export const DORMANT_RESTORATION_PROFILE: RestorationProfile = {
  flowerDensity: 0,
  treeCanopyDensity: 0.3,
  waterLevel: 0,
  bridgeStable: false,
  musicLayerId: null,
  animalPresence: 0,
  lightingWarmth: 0,
  particleDensity: 0.2,
  unlockedAreaIds: [],
};

/** Combines two profiles by taking the maximum of every numeric field and the union of unlocked areas — used to merge a zone's dormant baseline with whatever chapter-specific profile has been applied, without ever regressing an already-restored value. */
export function mergeRestorationProfiles(
  a: RestorationProfile,
  b: RestorationProfile
): RestorationProfile {
  return {
    flowerDensity: Math.max(a.flowerDensity, b.flowerDensity),
    treeCanopyDensity: Math.max(a.treeCanopyDensity, b.treeCanopyDensity),
    waterLevel: Math.max(a.waterLevel, b.waterLevel),
    bridgeStable: a.bridgeStable || b.bridgeStable,
    musicLayerId: b.musicLayerId ?? a.musicLayerId,
    animalPresence: Math.max(a.animalPresence, b.animalPresence),
    lightingWarmth: Math.max(a.lightingWarmth, b.lightingWarmth),
    particleDensity: Math.max(a.particleDensity, b.particleDensity),
    unlockedAreaIds: Array.from(new Set([...a.unlockedAreaIds, ...b.unlockedAreaIds])),
  };
}
