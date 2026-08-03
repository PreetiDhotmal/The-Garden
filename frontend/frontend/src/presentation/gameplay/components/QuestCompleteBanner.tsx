import { useEffect, useState } from "react";

export interface QuestCompleteBannerProps {
  readonly questTitle: string;
  readonly onFinished: () => void;
}

const HOLD_DURATION_MS = 3000;
const FADE_DURATION_MS = 800;

export function QuestCompleteBanner({ questTitle, onFinished }: QuestCompleteBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fadeInTimeout = window.setTimeout(() => {
      setIsVisible(true);
    }, 50);
    const fadeOutTimeout = window.setTimeout(() => {
      setIsVisible(false);
    }, HOLD_DURATION_MS);
    const finishTimeout = window.setTimeout(onFinished, HOLD_DURATION_MS + FADE_DURATION_MS);

    return () => {
      window.clearTimeout(fadeInTimeout);
      window.clearTimeout(fadeOutTimeout);
      window.clearTimeout(finishTimeout);
    };
  }, [onFinished]);

  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-1/3 z-40 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transitionDuration: `${FADE_DURATION_MS.toString()}ms` }}
    >
      <div className="text-sm uppercase tracking-[0.3em] text-garden-300 drop-shadow">
        Quest Complete
      </div>
      <div className="font-[var(--font-display)] text-4xl text-light-divine drop-shadow-lg">
        {questTitle}
      </div>
    </div>
  );
}
