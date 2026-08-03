import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { DirectionalLight } from "three";
import { advanceDayNightTime, computeDayNightSnapshot } from "@/domain/world/daynight/DayNightCycle";

export interface DayNightCycleControllerProps {
  readonly sunRef: React.RefObject<DirectionalLight | null>;
  readonly moonRef: React.RefObject<DirectionalLight | null>;
  /** Real seconds for one full in-game day. Default 20 minutes — long enough to feel gradual, short enough to actually observe during a session. */
  readonly cycleDurationSeconds?: number;
  readonly initialNormalizedTime?: number;
  readonly onPhaseChange?: (phase: string) => void;
}

const SUN_DISTANCE = 40;

/**
 * Renders nothing itself — mounted alongside the sun/moon lights it
 * drives. Reads `computeDayNightSnapshot` (pure domain logic) each
 * frame and positions/intensifies the lights accordingly, rather than
 * duplicating the angle math here.
 */
export function DayNightCycleController({
  sunRef,
  moonRef,
  cycleDurationSeconds = 1200,
  initialNormalizedTime = 0.35,
  onPhaseChange,
}: DayNightCycleControllerProps) {
  const timeRef = useRef(initialNormalizedTime);
  const lastPhaseRef = useRef<string | null>(null);
  const onPhaseChangeRef = useRef(onPhaseChange);
  onPhaseChangeRef.current = onPhaseChange;

  useFrame((_, delta) => {
    timeRef.current = advanceDayNightTime(timeRef.current, delta, cycleDurationSeconds);
    const snapshot = computeDayNightSnapshot(timeRef.current);

    if (snapshot.phase !== lastPhaseRef.current) {
      lastPhaseRef.current = snapshot.phase;
      onPhaseChangeRef.current?.(snapshot.phase);
    }

    const sun = sunRef.current;
    if (sun) {
      const x =
        Math.cos(snapshot.sunAngle.elevation) * Math.sin(snapshot.sunAngle.azimuth) * SUN_DISTANCE;
      const y = Math.sin(snapshot.sunAngle.elevation) * SUN_DISTANCE;
      const z =
        Math.cos(snapshot.sunAngle.elevation) * Math.cos(snapshot.sunAngle.azimuth) * SUN_DISTANCE;
      sun.position.set(x, y, z);
      sun.intensity = snapshot.sunIntensity * 3;
    }

    const moon = moonRef.current;
    if (moon) {
      const x =
        Math.cos(snapshot.moonAngle.elevation) * Math.sin(snapshot.moonAngle.azimuth) * SUN_DISTANCE;
      const y = Math.sin(snapshot.moonAngle.elevation) * SUN_DISTANCE;
      const z =
        Math.cos(snapshot.moonAngle.elevation) * Math.cos(snapshot.moonAngle.azimuth) * SUN_DISTANCE;
      moon.position.set(x, y, z);
      moon.intensity = Math.max(0, 1 - snapshot.sunIntensity) * 0.4;
    }
  });

  return null;
}
