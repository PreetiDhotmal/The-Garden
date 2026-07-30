export interface PuzzleTimerHudProps {
  readonly secondsRemaining: number | null;
}

export function PuzzleTimerHud({ secondsRemaining }: PuzzleTimerHudProps) {
  if (secondsRemaining === null) {
    return null;
  }
  const isUrgent = secondsRemaining <= 15;

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-4 z-30 -translate-x-1/2 rounded border px-4 py-1.5 text-lg font-semibold ${
        isUrgent
          ? "border-red-500 bg-red-950/70 text-red-300"
          : "border-garden-700 bg-black/50 text-light-divine"
      }`}
    >
      {Math.ceil(secondsRemaining)}s
    </div>
  );
}
