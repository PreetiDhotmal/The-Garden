import { describe, expect, it } from "vitest";
import { InteractionCooldown } from "./InteractionCooldown";

describe("InteractionCooldown", () => {
  it("is ready before it has ever been triggered", () => {
    const cooldown = new InteractionCooldown(1);
    expect(cooldown.isReady(0)).toBe(true);
  });

  it("is not ready immediately after triggering", () => {
    const cooldown = new InteractionCooldown(1);
    cooldown.trigger(10);
    expect(cooldown.isReady(10.5)).toBe(false);
  });

  it("becomes ready again once the duration elapses", () => {
    const cooldown = new InteractionCooldown(1);
    cooldown.trigger(10);
    expect(cooldown.isReady(11)).toBe(true);
  });

  it("reports remaining seconds accurately", () => {
    const cooldown = new InteractionCooldown(2);
    cooldown.trigger(10);
    expect(cooldown.remainingSeconds(10.5)).toBeCloseTo(1.5, 5);
  });

  it("reset() clears the cooldown", () => {
    const cooldown = new InteractionCooldown(5);
    cooldown.trigger(10);
    cooldown.reset();
    expect(cooldown.isReady(10.1)).toBe(true);
  });

  it("rejects a negative duration", () => {
    expect(() => new InteractionCooldown(-1)).toThrow(RangeError);
  });
});
