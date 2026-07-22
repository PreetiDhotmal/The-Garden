/** How a target detects that the player is close enough to consider interacting. */
export enum InteractionType {
  PROXIMITY = "PROXIMITY",
  RAYCAST = "RAYCAST",
  HOVER = "HOVER",
}

/** When multiple targets are in range simultaneously, the highest priority wins focus. */
export enum InteractionPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum InteractionState {
  IDLE = "IDLE",
  FOCUSED = "FOCUSED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/** How the player triggers a focused interaction. */
export enum InteractionTrigger {
  PRESS = "PRESS",
  HOLD = "HOLD",
}
