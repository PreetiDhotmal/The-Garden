import { useEffect } from "react";

export interface TimedScreenProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly durationMs?: number;
  readonly onAdvance: () => void;
}

const DEFAULT_DURATION_MS = 1800;

/**
 * Shared by the splash screen and studio logo — both are "show for a
 * bit, then move on, or let the player skip" screens with identical
 * behavior and only different text, so one component serves both
 * rather than two near-duplicates.
 */
export function TimedScreen({
  title,
  subtitle,
  durationMs = DEFAULT_DURATION_MS,
  onAdvance,
}: TimedScreenProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onAdvance, durationMs);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [durationMs, onAdvance]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
        onAdvance();
      }
    };
    const handleClick = () => {
      onAdvance();
    };
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("click", handleClick);
    };
  }, [onAdvance]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-shadow-valley text-center">
      <h1 className="font-[var(--font-display)] text-4xl text-light-divine">{title}</h1>
      {subtitle && <p className="text-sm text-garden-300">{subtitle}</p>}
      <p className="mt-8 text-xs text-garden-700">Press any key to skip</p>
    </div>
  );
}
