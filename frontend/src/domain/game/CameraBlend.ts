import type { Vector3Like } from "@/domain/gameplay/interaction/InteractionTarget";
import { FadeController } from "./FadeController";

export interface CameraTransform {
  readonly position: Vector3Like;
  readonly lookAt: Vector3Like;
}

function lerpVector3(from: Vector3Like, to: Vector3Like, t: number): Vector3Like {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
  };
}

/**
 * A one-shot blend from one fixed camera transform to another over a
 * duration — for the "camera blend" transitions this milestone asks
 * for (a Hub-to-level entry swoop, a cutscene-style cut-away), which
 * is a fundamentally different job from ThirdPersonCameraController's
 * continuous per-frame orbit-follow behavior and should not be built
 * by repurposing it. Reuses FadeController for progress math rather
 * than tracking elapsed time a second way.
 */
export class CameraBlend {
  private readonly fade: FadeController;

  constructor(
    private readonly from: CameraTransform,
    private readonly to: CameraTransform,
    durationSeconds: number
  ) {
    this.fade = new FadeController(durationSeconds, "IN");
  }

  update(deltaSeconds: number): CameraTransform {
    const { progress } = this.fade.update(deltaSeconds);
    return {
      position: lerpVector3(this.from.position, this.to.position, progress),
      lookAt: lerpVector3(this.from.lookAt, this.to.lookAt, progress),
    };
  }

  isComplete(): boolean {
    return this.fade.getState().isComplete;
  }
}
