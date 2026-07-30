import { WorldProgressionStatus } from "@/domain/gameplay/progression/WorldProgressionManager";
import { usePlayUiSound } from "@/presentation/game/hooks/usePlayUiSound";
import type { ChapterMeta } from "../chapterData";

export interface ChapterGatePanelProps {
  readonly meta: ChapterMeta;
  readonly status: WorldProgressionStatus;
  readonly previousChapterDisplayName: string | null;
  readonly onClose: () => void;
  readonly onStart: () => void;
}

const DIFFICULTY_LABEL: Record<ChapterMeta["difficulty"], string> = {
  GENTLE: "Gentle",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
};

export function ChapterGatePanel({
  meta,
  status,
  previousChapterDisplayName,
  onClose,
  onStart,
}: ChapterGatePanelProps) {
  const isLocked = status === WorldProgressionStatus.LOCKED;
  const isCompleted = status === WorldProgressionStatus.COMPLETED;
  const playUiSound = usePlayUiSound();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
      <div className="flex w-96 flex-col gap-4 rounded-lg border border-garden-700 bg-shadow-valley p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-garden-500">
            {DIFFICULTY_LABEL[meta.difficulty]} · {meta.estimatedMinutes} min
          </div>
          <h2 className="mt-1 font-[var(--font-display)] text-3xl text-light-divine">
            {meta.displayName}
          </h2>
        </div>

        <p className="text-sm italic text-garden-300">&ldquo;{meta.lessonSummary}&rdquo;</p>

        {isLocked ? (
          <p className="rounded border border-garden-700 bg-black/30 p-3 text-sm text-garden-500">
            {previousChapterDisplayName
              ? `Complete ${previousChapterDisplayName} together first.`
              : "Not yet available."}
          </p>
        ) : (
          <p className="text-sm text-garden-300">
            {isCompleted ? "You've completed this chapter together." : "Ready when you both are."}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => {
              playUiSound("audio:ui:button-hover");
              onClose();
            }}
            className="flex-1 rounded border border-garden-700 px-4 py-2 text-sm text-garden-300 hover:text-light-divine"
          >
            Close
          </button>
          {!isLocked && (
            <button
              type="button"
              onClick={() => {
                playUiSound("audio:ui:chapter-gate-open");
                onStart();
              }}
              className="flex-1 rounded bg-garden-700 px-4 py-2 text-sm text-light-divine hover:bg-garden-500"
            >
              {isCompleted ? "Replay" : "Start"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
