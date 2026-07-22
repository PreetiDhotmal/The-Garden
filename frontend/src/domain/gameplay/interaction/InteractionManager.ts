import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { InteractionCooldown } from "./InteractionCooldown";
import { InteractionState, InteractionTrigger, InteractionType } from "./InteractionTypes";
import type { InteractionTarget, Vector3Like } from "./InteractionTarget";

export class DuplicateInteractionTargetError extends Error {
  constructor(readonly id: string) {
    super(`An interaction target with id "${id}" is already registered.`);
    this.name = "DuplicateInteractionTargetError";
  }
}

function distance(a: Vector3Like, b: Vector3Like): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

const DEFAULT_COOLDOWN_SECONDS = 0.5;

/**
 * Owns every registered InteractionTarget, resolves which one (if
 * any) is currently focused given the player's position, and drives
 * press/hold interaction triggering. This is the single system every
 * interactable object in the game — collectibles, doors, a future
 * NPC's dialogue trigger — is discovered through.
 */
export class InteractionManager {
  private readonly targetsById = new Map<string, InteractionTarget>();
  private readonly cooldownsById = new Map<string, InteractionCooldown>();
  private focusedTargetId: string | null = null;
  private holdElapsedSeconds = 0;

  constructor(private readonly eventBus: GameplayEventBus) {}

  register(target: InteractionTarget): void {
    if (this.targetsById.has(target.id)) {
      throw new DuplicateInteractionTargetError(target.id);
    }
    this.targetsById.set(target.id, target);
    this.cooldownsById.set(target.id, new InteractionCooldown(DEFAULT_COOLDOWN_SECONDS));
  }

  unregister(id: string): void {
    if (this.focusedTargetId === id) {
      this.clearFocus();
    }
    this.targetsById.delete(id);
    this.cooldownsById.delete(id);
  }

  getFocusedTargetId(): string | null {
    return this.focusedTargetId;
  }

  /**
   * Re-resolves focus from the player's current position among all
   * PROXIMITY-type targets. RAYCAST/HOVER targets are focused
   * separately via `setRaycastFocus` (infrastructure owns the actual
   * raycasting; this class only tracks the resulting focus state).
   */
  updateProximityFocus(playerPosition: Vector3Like): void {
    const candidates: Array<{ target: InteractionTarget; distance: number }> = [];

    for (const target of this.targetsById.values()) {
      if (target.type !== InteractionType.PROXIMITY || !target.canInteract()) {
        continue;
      }
      const targetDistance = distance(playerPosition, target.getPosition());
      if (targetDistance <= target.interactionRadius) {
        candidates.push({ target, distance: targetDistance });
      }
    }

    candidates.sort((a, b) => b.target.priority - a.target.priority || a.distance - b.distance);
    this.applyFocusResolution(candidates[0]?.target.id ?? null);
  }

  /** For RAYCAST/HOVER targets: infrastructure resolves the actual ray/pointer hit and reports the result here. */
  setRaycastFocus(targetId: string | null): void {
    this.applyFocusResolution(targetId);
  }

  private applyFocusResolution(nextFocusId: string | null): void {
    if (nextFocusId === this.focusedTargetId) {
      return;
    }
    if (this.focusedTargetId) {
      this.eventBus.emit("interaction:exited-range", { targetId: this.focusedTargetId });
    }
    this.focusedTargetId = nextFocusId;
    this.holdElapsedSeconds = 0;
    if (nextFocusId) {
      this.eventBus.emit("interaction:entered-range", { targetId: nextFocusId });
    }
  }

  private clearFocus(): void {
    this.applyFocusResolution(null);
  }

  /**
   * Called when the interact input is pressed. For PRESS-trigger
   * targets, fires immediately (respecting cooldown). For HOLD-trigger
   * targets, this only registers that the press has started — call
   * `updateHold` each frame while held, which fires on completion.
   */
  handlePressStart(nowSeconds: number): InteractionState {
    const target = this.getFocusedTarget();
    if (!target) {
      return InteractionState.IDLE;
    }
    if (target.trigger === InteractionTrigger.HOLD) {
      this.holdElapsedSeconds = 0;
      return InteractionState.IN_PROGRESS;
    }
    return this.fireInteraction(target, nowSeconds);
  }

  /** Call every frame while the interact input remains held, for HOLD-trigger targets. */
  updateHold(deltaSeconds: number, nowSeconds: number): InteractionState {
    const target = this.getFocusedTarget();
    if (!target || target.trigger !== InteractionTrigger.HOLD) {
      return InteractionState.IDLE;
    }
    this.holdElapsedSeconds += deltaSeconds;
    if (this.holdElapsedSeconds >= target.holdDurationSeconds) {
      this.holdElapsedSeconds = 0;
      return this.fireInteraction(target, nowSeconds);
    }
    return InteractionState.IN_PROGRESS;
  }

  handlePressCancel(): void {
    if (this.focusedTargetId) {
      this.holdElapsedSeconds = 0;
      this.eventBus.emit("interaction:cancelled", { targetId: this.focusedTargetId });
    }
  }

  getHoldProgress(): number {
    const target = this.getFocusedTarget();
    if (!target || target.holdDurationSeconds <= 0) {
      return 0;
    }
    return Math.min(1, this.holdElapsedSeconds / target.holdDurationSeconds);
  }

  private fireInteraction(target: InteractionTarget, nowSeconds: number): InteractionState {
    const cooldown = this.cooldownsById.get(target.id);
    if (cooldown && !cooldown.isReady(nowSeconds)) {
      return InteractionState.FOCUSED;
    }
    this.eventBus.emit("interaction:started", { targetId: target.id });
    target.onInteract();
    cooldown?.trigger(nowSeconds);
    this.eventBus.emit("interaction:finished", { targetId: target.id });
    return InteractionState.COMPLETED;
  }

  private getFocusedTarget(): InteractionTarget | null {
    return this.focusedTargetId ? (this.targetsById.get(this.focusedTargetId) ?? null) : null;
  }

  list(): readonly InteractionTarget[] {
    return Array.from(this.targetsById.values());
  }
}
