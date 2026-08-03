import { useEffect, useRef, useState } from "react";
import { FadeController, type FadeDirection } from "@/domain/game/FadeController";

export interface ScreenFadeOverlayProps {
  readonly direction: FadeDirection;
  readonly durationSeconds?: number;
  readonly color?: string;
  readonly onComplete?: () => void;
}

/**
 * A full-screen fade, driven by the existing (previously unused
 * anywhere) FadeController domain class rather than a new ad-hoc CSS
 * transition - the same time-driven progress shape already proven
 * and tested there.
 */
export function ScreenFadeOverlay({
  direction,
  durationSeconds = 0.6,
  color = "#000000",
  onComplete,
}: ScreenFadeOverlayProps) {
  const controllerRef = useRef<FadeController>(new FadeController(durationSeconds, direction));
  const [progress, setProgress] = useState(0);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    controllerRef.current = new FadeController(durationSeconds, direction);
    hasCompletedRef.current = false;
    let frameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;
      const state = controllerRef.current.update(deltaSeconds);
      setProgress(state.progress);
      if (state.isComplete) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }
        return;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, durationSeconds]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: color,
        opacity: progress,
        pointerEvents: progress > 0.02 ? "auto" : "none",
        transition: "none",
      }}
    />
  );
}
