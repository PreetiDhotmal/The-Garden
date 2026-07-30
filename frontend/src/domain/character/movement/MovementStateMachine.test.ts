import { describe, expect, it } from "vitest";
import { CharacterState } from "../CharacterState";
import { createMovementTuning } from "./MovementTuning";
import { MovementStateMachine, type MovementStateContext } from "./MovementStateMachine";

const tuning = createMovementTuning({ idleSpeedThreshold: 0.1, runSpeedThreshold: 3.5 });

function context(overrides: Partial<MovementStateContext> = {}): MovementStateContext {
  return {
    isGrounded: true,
    horizontalSpeed: 0,
    verticalVelocity: 0,
    sprintHeld: false,
    didJump: false,
    isTurningInPlace: false,
    ...overrides,
  };
}

describe("MovementStateMachine", () => {
  it("starts idle by default", () => {
    const machine = new MovementStateMachine();
    expect(machine.getCurrentState()).toBe(CharacterState.IDLE);
  });

  it("stays IDLE at zero speed while grounded", () => {
    const machine = new MovementStateMachine();
    expect(machine.update(context(), tuning, 0.016)).toBe(CharacterState.IDLE);
  });

  it("enters TURNING when stationary but turning in place", () => {
    const machine = new MovementStateMachine();
    expect(machine.update(context({ isTurningInPlace: true }), tuning, 0.016)).toBe(
      CharacterState.TURNING
    );
  });

  it("enters WALKING at moderate speed", () => {
    const machine = new MovementStateMachine();
    expect(machine.update(context({ horizontalSpeed: 2 }), tuning, 0.016)).toBe(
      CharacterState.WALKING
    );
  });

  it("enters RUNNING above the run threshold without sprint held", () => {
    const machine = new MovementStateMachine();
    expect(machine.update(context({ horizontalSpeed: 4 }), tuning, 0.016)).toBe(
      CharacterState.RUNNING
    );
  });

  it("enters SPRINTING above the run threshold with sprint held", () => {
    const machine = new MovementStateMachine();
    expect(machine.update(context({ horizontalSpeed: 6, sprintHeld: true }), tuning, 0.016)).toBe(
      CharacterState.SPRINTING
    );
  });

  it("enters JUMPING the tick a jump is applied", () => {
    const machine = new MovementStateMachine();
    expect(machine.update(context({ didJump: true }), tuning, 0.016)).toBe(CharacterState.JUMPING);
  });

  it("enters FALLING when airborne and descending", () => {
    const machine = new MovementStateMachine();
    expect(
      machine.update(context({ isGrounded: false, verticalVelocity: -2 }), tuning, 0.016)
    ).toBe(CharacterState.FALLING);
  });

  it("stays JUMPING while airborne and still ascending", () => {
    const machine = new MovementStateMachine();
    expect(
      machine.update(context({ isGrounded: false, verticalVelocity: 3 }), tuning, 0.016)
    ).toBe(CharacterState.JUMPING);
  });

  it("enters LANDING immediately on touching down after being airborne, then resumes locomotion", () => {
    const machine = new MovementStateMachine(CharacterState.IDLE, 0.1);

    machine.update(context({ isGrounded: false, verticalVelocity: -2 }), tuning, 0.016);
    const landingState = machine.update(context({ isGrounded: true }), tuning, 0.016);
    expect(landingState).toBe(CharacterState.LANDING);

    // Still within the landing recovery window.
    const stillLanding = machine.update(context({ isGrounded: true }), tuning, 0.05);
    expect(stillLanding).toBe(CharacterState.LANDING);

    // Past the landing recovery window — resumes normal locomotion resolution.
    const resumed = machine.update(context({ isGrounded: true, horizontalSpeed: 2 }), tuning, 0.1);
    expect(resumed).toBe(CharacterState.WALKING);
  });

  describe("hysteresis (regression coverage for animation stutter)", () => {
    it("does not flip-flop between IDLE and WALKING when horizontalSpeed hovers exactly at idleSpeedThreshold", () => {
      const machine = new MovementStateMachine();
      // Establish WALKING with a speed clearly past the widened
      // idle-exit threshold (0.1 * 1.5 = 0.15) — starting from IDLE,
      // 0.1 alone correctly stays IDLE under hysteresis.
      expect(machine.update(context({ horizontalSpeed: 0.2 }), tuning, 0.016)).toBe(
        CharacterState.WALKING
      );
      // Now already WALKING: speed noise oscillating right at the base
      // threshold (0.1) must NOT bounce back to IDLE — without
      // hysteresis this would flip every frame, each flip interrupting
      // the animation crossfade.
      for (let i = 0; i < 10; i += 1) {
        const speed = i % 2 === 0 ? 0.09 : 0.11;
        expect(machine.update(context({ horizontalSpeed: speed }), tuning, 0.016)).toBe(
          CharacterState.WALKING
        );
      }
    });

    it("does not flip-flop between WALKING and RUNNING when horizontalSpeed hovers exactly at runSpeedThreshold", () => {
      const machine = new MovementStateMachine();
      machine.update(context({ horizontalSpeed: 2 }), tuning, 0.016); // establish WALKING first
      expect(machine.update(context({ horizontalSpeed: 3.5 }), tuning, 0.016)).toBe(
        CharacterState.RUNNING
      );
      for (let i = 0; i < 10; i += 1) {
        const speed = i % 2 === 0 ? 3.4 : 3.6;
        expect(machine.update(context({ horizontalSpeed: speed }), tuning, 0.016)).toBe(
          CharacterState.RUNNING
        );
      }
    });

    it("still genuinely transitions IDLE -> WALKING -> RUNNING -> WALKING -> IDLE given decisive (non-boundary) speed changes", () => {
      const machine = new MovementStateMachine();
      expect(machine.update(context({ horizontalSpeed: 0 }), tuning, 0.016)).toBe(
        CharacterState.IDLE
      );
      expect(machine.update(context({ horizontalSpeed: 2 }), tuning, 0.016)).toBe(
        CharacterState.WALKING
      );
      expect(machine.update(context({ horizontalSpeed: 5 }), tuning, 0.016)).toBe(
        CharacterState.RUNNING
      );
      expect(machine.update(context({ horizontalSpeed: 1 }), tuning, 0.016)).toBe(
        CharacterState.WALKING
      );
      expect(machine.update(context({ horizontalSpeed: 0 }), tuning, 0.016)).toBe(
        CharacterState.IDLE
      );
    });
  });
});
