import type { InteractionPriority, InteractionTrigger, InteractionType } from "./InteractionTypes";

export interface Vector3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Anything that can be interacted with implements this — an
 * interactive scenery object, a collectible, a future NPC, a door.
 * InteractionManager only ever depends on this interface, never on a
 * concrete class, so adding a new interactable type never touches
 * InteractionManager.
 */
export interface InteractionTarget {
  readonly id: string;
  readonly type: InteractionType;
  readonly priority: InteractionPriority;
  readonly trigger: InteractionTrigger;
  /** Radius (meters) within which this target can be focused. Ignored for RAYCAST/HOVER types. */
  readonly interactionRadius: number;
  /** Seconds to hold the trigger for HOLD-type interactions. Ignored for PRESS. */
  readonly holdDurationSeconds: number;
  readonly promptText: string;

  getPosition: () => Vector3Like;
  /** Whether this target can currently be interacted with (e.g. a quest gate not yet unlocked). Re-evaluated every focus check. */
  canInteract: () => boolean;
  /** Called once when the interaction actually fires (on press, or on hold completion). */
  onInteract: () => void;
}
