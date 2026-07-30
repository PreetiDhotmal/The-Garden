import { useEffect, useState } from "react";
import { EngineProvider } from "@/presentation/engine/providers/EngineProvider";
import { GameCanvas } from "@/presentation/engine/components/GameCanvas";
import { CutsceneGardenBackdrop } from "./CutsceneGardenBackdrop";
import { CinematicFlyoverCamera, type FlyoverWaypoint } from "./CinematicFlyoverCamera";

export interface IntroCutsceneScreenProps {
  readonly onFinished: () => void;
}

const FLYOVER_WAYPOINTS: readonly FlyoverWaypoint[] = [
  { position: [-40, 25, 40], lookAt: [0, 5, 0] },
  { position: [0, 18, 50], lookAt: [0, 3, 0] },
  { position: [35, 14, 20], lookAt: [-5, 2, -5] },
  { position: [20, 10, -30], lookAt: [0, 1, 0] },
];

const NARRATION_LINES: readonly string[] = [
  "In the beginning...",
  "God created a perfect garden...",
  "But every journey begins with a single step...",
];

const FLYOVER_DURATION_SECONDS = 24;
const TITLE_DELAY_MS = 800;
const SUBTITLE_DELAY_MS = 2200;
const NARRATION_START_DELAY_MS = 4500;
const NARRATION_LINE_DURATION_MS = 3800;

/**
 * A real 3D scene (CutsceneGardenBackdrop + CinematicFlyoverCamera),
 * not a static image standing in for one — reuses the actual
 * environment-rendering pieces (terrain, vegetation, sky, lighting,
 * water) the Garden gameplay itself uses. Runs its own local
 * EngineProvider/GameCanvas (this screen exists before
 * GardenOfBeginningsPage mounts its own), which means assets used
 * here get loaded a second time when gameplay actually starts —
 * a known, documented tradeoff, not an oversight.
 */
export function IntroCutsceneScreen({ onFinished }: IntroCutsceneScreenProps) {
  const [isFadedIn, setIsFadedIn] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [narrationIndex, setNarrationIndex] = useState(-1);

  useEffect(() => {
    const fadeTimeout = window.setTimeout(() => {
      setIsFadedIn(true);
    }, 50);
    const titleTimeout = window.setTimeout(() => {
      setShowTitle(true);
    }, TITLE_DELAY_MS);
    const subtitleTimeout = window.setTimeout(() => {
      setShowSubtitle(true);
    }, SUBTITLE_DELAY_MS);

    const narrationTimeouts = NARRATION_LINES.map((_, index) =>
      window.setTimeout(
        () => {
          setNarrationIndex(index);
        },
        NARRATION_START_DELAY_MS + index * NARRATION_LINE_DURATION_MS
      )
    );

    const endTimeout = window.setTimeout(onFinished, FLYOVER_DURATION_SECONDS * 1000);

    return () => {
      window.clearTimeout(fadeTimeout);
      window.clearTimeout(titleTimeout);
      window.clearTimeout(subtitleTimeout);
      window.clearTimeout(endTimeout);
      for (const timeout of narrationTimeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, [onFinished]);

  useEffect(() => {
    const handleSkip = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        onFinished();
      }
    };
    window.addEventListener("keydown", handleSkip);
    return () => {
      window.removeEventListener("keydown", handleSkip);
    };
  }, [onFinished]);

  return (
    <div
      className={`relative h-full w-full bg-black transition-opacity duration-[1500ms] ${
        isFadedIn ? "opacity-100" : "opacity-0"
      }`}
    >
      <EngineProvider>
        <GameCanvas>
          <CutsceneGardenBackdrop />
          <CinematicFlyoverCamera
            waypoints={FLYOVER_WAYPOINTS}
            durationSeconds={FLYOVER_DURATION_SECONDS}
          />
        </GameCanvas>
      </EngineProvider>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between bg-gradient-to-b from-black/50 via-transparent to-black/60 py-16">
        <div className="flex flex-col items-center gap-2 text-center transition-opacity duration-1000">
          {showTitle && (
            <h1 className="font-[var(--font-display)] text-6xl text-light-divine drop-shadow-lg">
              The Garden
            </h1>
          )}
          {showSubtitle && (
            <p className="text-lg tracking-wide text-garden-300 drop-shadow">
              A Journey Through Scripture
            </p>
          )}
        </div>

        <div className="h-8 text-center text-xl italic text-light-divine drop-shadow">
          {narrationIndex >= 0 && NARRATION_LINES[narrationIndex]}
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-4 right-4 text-xs text-garden-700">
        Press ESC, ENTER, or SPACE to skip
      </p>
    </div>
  );
}
