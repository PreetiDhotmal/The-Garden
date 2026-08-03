import { describe, expect, it } from "vitest";
import { CharacterState } from "../CharacterState";
import { AnimationStateMachine } from "./AnimationStateMachine";
import { AnimationRole } from "./AnimationRole";

describe("AnimationStateMachine", () => {
  it("starts at the role matching the initial state", () => {
    const machine = new AnimationStateMachine(CharacterState.IDLE);
    expect(machine.getActiveRole()).toBe(AnimationRole.IDLE);
  });

  it("maps locomotion states to their animation role", () => {
    const machine = new AnimationStateMachine();
    expect(machine.update(CharacterState.WALKING).activeRole).toBe(AnimationRole.WALK);
    expect(machine.update(CharacterState.RUNNING).activeRole).toBe(AnimationRole.RUN);
    expect(machine.update(CharacterState.JUMPING).activeRole).toBe(AnimationRole.JUMP);
  });

  it("reports justTransitioned only on the tick the role changes", () => {
    const machine = new AnimationStateMachine(CharacterState.IDLE);

    const first = machine.update(CharacterState.WALKING);
    expect(first.justTransitioned).toBe(true);
    expect(first.previousRole).toBe(AnimationRole.IDLE);

    const second = machine.update(CharacterState.WALKING);
    expect(second.justTransitioned).toBe(false);
  });

  it("resolves TURNING to TURN_LEFT or TURN_RIGHT based on direction", () => {
    const machine = new AnimationStateMachine();
    expect(machine.update(CharacterState.TURNING, "left").activeRole).toBe(AnimationRole.TURN_LEFT);
    expect(machine.update(CharacterState.TURNING, "right").activeRole).toBe(
      AnimationRole.TURN_RIGHT
    );
  });
});
