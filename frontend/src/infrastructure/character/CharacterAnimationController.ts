import { AnimationMixer, LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from "three";
import { AnimationRole } from "@/domain/character/animation/AnimationRole";
import { getRoleMapping, type CharacterAnimationConfig } from "@/domain/character/animation/CharacterAnimationConfig";

export type AnimationFinishedListener = (role: AnimationRole) => void;

/**
 * The infrastructure half of the animation system: AnimationStateMachine
 * (domain) decides *which role* should play; this class is the only
 * thing that knows how to actually make THREE.AnimationMixer play,
 * crossfade, and blend the clip(s) that role maps to. Root-motion
 * extraction (reading a track's translation delta rather than letting
 * the mixer apply it to the model root) is supported by exposing the
 * mixer's root object — a future milestone that needs root motion can
 * read `getRoot()` and the active clip's root bone track directly.
 */
export class CharacterAnimationController {
  private readonly mixer: AnimationMixer;
  private readonly clipsByName = new Map<string, AnimationClip>();
  private readonly actionsByRole = new Map<AnimationRole, AnimationAction>();
  private activeAction: AnimationAction | null = null;
  private readonly finishedListeners = new Set<AnimationFinishedListener>();
  private roleByAction = new Map<AnimationAction, AnimationRole>();

  constructor(
    private readonly root: Object3D,
    clips: readonly AnimationClip[],
    private readonly config: CharacterAnimationConfig
  ) {
    this.mixer = new AnimationMixer(root);
    for (const clip of clips) {
      this.clipsByName.set(clip.name, clip);
    }
    this.mixer.addEventListener("finished", (event) => {
      const action = event.action;
      const role = this.roleByAction.get(action);
      if (role) {
        for (const listener of this.finishedListeners) {
          listener(role);
        }
      }
    });
  }

  getRoot(): Object3D {
    return this.root;
  }

  onAnimationFinished(listener: AnimationFinishedListener): () => void {
    this.finishedListeners.add(listener);
    return () => {
      this.finishedListeners.delete(listener);
    };
  }

  /**
   * Forces `role`'s action to full weight and applies it to the
   * skeleton immediately — no fade, no ramp. Distinct from playRole()
   * specifically because playRole()'s fadeIn()/crossFadeTo() schedule
   * a weight ramp starting at 0 (verified against Three.js's own
   * AnimationAction source: _scheduleFading(duration, 0, 1) sets the
   * weight interpolant's first sample to 0 at the mixer's current
   * time). Calling mixer.update(0) immediately after — as the very
   * first pose application after spawning needs to, before any real
   * frame time has elapsed — evaluates that ramp at its own starting
   * point, so effective weight is exactly 0, and AnimationMixer only
   * writes pose data to bones when weight > 0 (also verified directly
   * against source: `if (weight > 0) { ...apply property bindings... }`
   * inside AnimationAction._update()). A faded-in action at t=0 is
   * therefore indistinguishable from no action at all — the skeleton
   * is never actually touched, and stays at bind pose (T-pose) until
   * enough real frame time passes for the fade to progress on its own.
   * This method exists so the very first pose is never left to chance.
   */
  forcePose(role: AnimationRole): void {
    const action = this.resolveAction(role);
    if (!action) {
      return;
    }
    if (this.activeAction && this.activeAction !== action) {
      this.activeAction.stop();
    }
    action.reset();
    action.enabled = true;
    action.setEffectiveWeight(1);
    action.setEffectiveTimeScale(1);
    action.play();
    this.activeAction = action;
    this.mixer.update(0);
  }

  /** Crossfades to the clip mapped to `role`. No-ops if the role has no mapping or is already active. */
  playRole(role: AnimationRole): void {
    const action = this.resolveAction(role);
    if (!action || action === this.activeAction) {
      return;
    }

    const mapping = getRoleMapping(this.config, role);
    const crossfadeSeconds = mapping?.crossfadeSeconds ?? 0.25;

    action.reset();
    action.play();
    if (this.activeAction) {
      this.activeAction.crossFadeTo(action, crossfadeSeconds, true);
    } else {
      action.fadeIn(crossfadeSeconds);
    }
    this.activeAction = action;
  }

  /**
   * Sets simultaneous weights for two roles (a blend tree result) —
   * used for continuous locomotion blending (e.g. walk/run) rather
   * than the discrete crossfade `playRole` performs for one-shot
   * transitions like jump/land.
   */
  setBlendWeights(
    primary: AnimationRole,
    primaryWeight: number,
    secondary: AnimationRole | null,
    secondaryWeight: number
  ): void {
    const primaryAction = this.resolveAction(primary);
    if (primaryAction) {
      if (!primaryAction.isRunning()) {
        primaryAction.play();
      }
      primaryAction.setEffectiveWeight(primaryWeight);
      this.activeAction = primaryAction;
    }

    if (secondary) {
      const secondaryAction = this.resolveAction(secondary);
      if (secondaryAction) {
        if (!secondaryAction.isRunning()) {
          secondaryAction.play();
        }
        secondaryAction.setEffectiveWeight(secondaryWeight);
      }
    }
  }

  /** The active action's current effective weight, or null if nothing is active. 0 means the action exists but contributes nothing to the visible pose — exactly the state a fadeIn()+update(0) sequence leaves an action in immediately after calling it. */
  getActiveActionWeight(): number | null {
    return this.activeAction?.getEffectiveWeight() ?? null;
  }

  /** The name of the clip currently playing, or null if nothing has ever been played yet. */
  getCurrentClipName(): string | null {
    return this.activeAction?.getClip().name ?? null;
  }

  update(deltaSeconds: number): void {
    this.mixer.update(deltaSeconds);
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
    this.finishedListeners.clear();
    // Reset this controller's own caches, not just the mixer's -
    // mixer.uncacheRoot() correctly tears down the mixer's internal
    // tracking for every action bound to this root, but this
    // controller's own actionsByRole/roleByAction maps and
    // activeAction still hold references to those now-orphaned
    // AnimationAction objects. If this same controller instance is
    // ever reused after dispose() (React Strict Mode's development-
    // only mount -> cleanup -> re-mount cycle does exactly this to
    // the same memoized instance, by design, specifically to surface
    // bugs like this one), resolveAction() would return a stale,
    // torn-down action straight from cache - bypassing the mixer's
    // own correctly-rebuilt state - and playing/stopping it throws.
    // Clearing these means any future call correctly re-resolves
    // through mixer.clipAction(), which creates genuinely fresh
    // actions since the mixer's own cache was already properly
    // cleaned up above.
    this.activeAction = null;
    this.actionsByRole.clear();
    this.roleByAction.clear();
  }

  /**
   * Falls back to IDLE's action when `role` has no mapping, or its
   * mapped clip name isn't found on this model — every role must
   * resolve to *some* playable action, never nothing. This is the
   * actual implementation of the fallback convention TALK's own
   * doc-comment already assumed existed (AnimationRole.ts: "Falls
   * back to IDLE in configs that don't map it") but that was never
   * actually built as a real mechanism — resolveAction previously
   * just returned null for any unmapped role, silently.
   */
  private resolveAction(role: AnimationRole): AnimationAction | null {
    const cached = this.actionsByRole.get(role);
    if (cached) {
      return cached;
    }

    const resolved = this.resolveActionForRole(role);
    if (resolved) {
      this.actionsByRole.set(role, resolved);
      this.roleByAction.set(resolved, role);
      return resolved;
    }

    if (role !== AnimationRole.IDLE) {
      return this.resolveAction(AnimationRole.IDLE);
    }
    return null;
  }

  private resolveActionForRole(role: AnimationRole): AnimationAction | null {
    const mapping = getRoleMapping(this.config, role);
    if (!mapping) {
      return null;
    }
    const clip = this.clipsByName.get(mapping.clipName);
    if (!clip) {
      return null;
    }

    const action = this.mixer.clipAction(clip);
    action.setLoop(mapping.loop ? LoopRepeat : LoopOnce, Infinity);
    action.clampWhenFinished = !mapping.loop;
    return action;
  }
}
