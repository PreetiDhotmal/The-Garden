import { InteractionTrigger } from "./InteractionTypes";
import type { InteractionTarget } from "./InteractionTarget";

export interface InteractionPrompt {
  readonly targetId: string;
  readonly text: string;
  readonly trigger: InteractionTrigger;
  readonly holdDurationSeconds: number;
}

export function buildInteractionPrompt(target: InteractionTarget): InteractionPrompt {
  return {
    targetId: target.id,
    text: target.promptText,
    trigger: target.trigger,
    holdDurationSeconds: target.holdDurationSeconds,
  };
}
