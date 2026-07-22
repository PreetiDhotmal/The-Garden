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

  update(deltaSeconds: number): void {
    this.mixer.update(deltaSeconds);
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
    this.finishedListeners.clear();
  }

  private resolveAction(role: AnimationRole): AnimationAction | null {
    const cached = this.actionsByRole.get(role);
    if (cached) {
      return cached;
    }

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

    this.actionsByRole.set(role, action);
    this.roleByAction.set(action, role);
    return action;
  }
}
