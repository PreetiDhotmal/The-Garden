import { useEffect, useState } from "react";
import {
  buildInteractionPrompt,
  type InteractionPrompt,
} from "@/domain/gameplay/interaction/InteractionPrompt";
import { InteractionTrigger } from "@/domain/gameplay/interaction/InteractionTypes";
import { useGameplay } from "../hooks/useGameplay";

export function InteractionPromptUI() {
  const { eventBus, interactionManager } = useGameplay();
  const [prompt, setPrompt] = useState<InteractionPrompt | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);

  useEffect(() => {
    const unsubscribeEntered = eventBus.on("interaction:entered-range", ({ targetId }) => {
      const target = interactionManager.list().find((candidate) => candidate.id === targetId);
      setPrompt(target ? buildInteractionPrompt(target) : null);
    });
    const unsubscribeExited = eventBus.on("interaction:exited-range", () => {
      setPrompt(null);
      setHoldProgress(0);
    });

    const interval = window.setInterval(() => {
      setHoldProgress(interactionManager.getHoldProgress());
    }, 50);

    return () => {
      unsubscribeEntered();
      unsubscribeExited();
      window.clearInterval(interval);
    };
  }, [eventBus, interactionManager]);

  if (!prompt) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-1/3 left-1/2 z-40 -translate-x-1/2 rounded-md border border-garden-700 bg-black/70 px-4 py-2 text-center text-light-divine">
      <div className="text-sm">
        {prompt.trigger === InteractionTrigger.HOLD ? "Hold" : "Press"}{" "}
        <kbd className="rounded bg-garden-700 px-1.5 py-0.5 font-mono text-xs">E</kbd> — {prompt.text}
      </div>
      {prompt.trigger === InteractionTrigger.HOLD && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded bg-garden-900">
          <div
            className="h-full bg-garden-500"
            style={{ width: `${(holdProgress * 100).toString()}%` }}
          />
        </div>
      )}
    </div>
  );
}
