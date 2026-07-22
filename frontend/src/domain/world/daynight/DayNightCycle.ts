export enum DayPhase {
  DAWN = "DAWN",
  DAY = "DAY",
  DUSK = "DUSK",
  NIGHT = "NIGHT",
}

export interface CelestialAngle {
  /** Radians above (positive) or below (negative) the horizon. */
  readonly elevation: number;
  /** Radians around the horizon, 0 = north. */
  readonly azimuth: number;
}

export interface DayNightSnapshot {
  readonly normalizedTime: number; // 0 = midnight, 0.5 = noon
  readonly phase: DayPhase;
  readonly sunAngle: CelestialAngle;
  readonly moonAngle: CelestialAngle;
  readonly sunIntensity: number;
  readonly ambientIntensity: number;
}

const DAWN_START = 0.22; // ~05:17
const DAY_START = 0.29; // ~06:58
const DUSK_START = 0.71; // ~17:02
const NIGHT_START = 0.78; // ~18:43

function phaseForTime(normalizedTime: number): DayPhase {
  if (normalizedTime >= DAWN_START && normalizedTime < DAY_START) {
    return DayPhase.DAWN;
  }
  if (normalizedTime >= DAY_START && normalizedTime < DUSK_START) {
    return DayPhase.DAY;
  }
  if (normalizedTime >= DUSK_START && normalizedTime < NIGHT_START) {
    return DayPhase.DUSK;
  }
  return DayPhase.NIGHT;
}

/** The sun completes one full circle per day; elevation peaks at noon (normalizedTime 0.5). */
function sunAngleForTime(normalizedTime: number): CelestialAngle {
  const elevation = Math.sin((normalizedTime - 0.25) * Math.PI * 2) * (Math.PI / 2);
  const azimuth = normalizedTime * Math.PI * 2;
  return { elevation, azimuth };
}

/** The moon is simply the sun's antipode — up when the sun is down. */
function moonAngleForTime(normalizedTime: number): CelestialAngle {
  const sun = sunAngleForTime(normalizedTime);
  return { elevation: -sun.elevation, azimuth: sun.azimuth + Math.PI };
}

/** Smoothly ramps sun intensity up through dawn, full through day, down through dusk, zero at night. */
function sunIntensityForTime(normalizedTime: number): number {
  const sun = sunAngleForTime(normalizedTime);
  return Math.max(0, Math.sin(Math.max(0, sun.elevation)));
}

function ambientIntensityForPhase(phase: DayPhase): number {
  switch (phase) {
    case DayPhase.DAY:
      return 0.5;
    case DayPhase.DAWN:
    case DayPhase.DUSK:
      return 0.35;
    case DayPhase.NIGHT:
      return 0.15;
    default: {
      const exhaustiveCheck: never = phase;
      throw new Error(`Unhandled day phase: ${String(exhaustiveCheck)}`);
    }
  }
}

export class InvalidDayNightTimeError extends Error {
  constructor(reason: string) {
    super(`Invalid day/night time: ${reason}`);
    this.name = "InvalidDayNightTimeError";
  }
}

/**
 * Pure function from a normalized time-of-day (0-1) to a full
 * lighting snapshot. No Three.js/React dependency — the
 * infrastructure DayNightCycleController (a future presentation-layer
 * piece) applies this to LightingManager's directional light each
 * frame.
 */
export function computeDayNightSnapshot(normalizedTime: number): DayNightSnapshot {
  if (normalizedTime < 0 || normalizedTime >= 1) {
    throw new InvalidDayNightTimeError("normalizedTime must be in the range [0, 1)");
  }
  const phase = phaseForTime(normalizedTime);
  return {
    normalizedTime,
    phase,
    sunAngle: sunAngleForTime(normalizedTime),
    moonAngle: moonAngleForTime(normalizedTime),
    sunIntensity: sunIntensityForTime(normalizedTime),
    ambientIntensity: ambientIntensityForPhase(phase),
  };
}

/** Advances normalized time by `deltaSeconds`, given a full day/night cycle takes `cycleDurationSeconds`, wrapping around at 1. */
export function advanceDayNightTime(
  normalizedTime: number,
  deltaSeconds: number,
  cycleDurationSeconds: number
): number {
  if (cycleDurationSeconds <= 0) {
    throw new InvalidDayNightTimeError("cycleDurationSeconds must be greater than zero");
  }
  const next = normalizedTime + deltaSeconds / cycleDurationSeconds;
  return next - Math.floor(next);
}
