import { describe, expect, it } from "vitest";
import { AnimationRole } from "./AnimationRole";
import { AnimationBlendTree, InvalidBlendTreeError } from "./AnimationBlendTree";

function buildLocomotionTree(): AnimationBlendTree {
  return new AnimationBlendTree([
    { parameterValue: 0, role: AnimationRole.IDLE },
    { parameterValue: 2.5, role: AnimationRole.WALK },
    { parameterValue: 5, role: AnimationRole.RUN },
    { parameterValue: 8, role: AnimationRole.SPRINT },
  ]);
}

describe("AnimationBlendTree", () => {
  it("returns full weight on the exact node value", () => {
    const tree = buildLocomotionTree();
    const weights = tree.evaluate(5);

    expect(weights.primary).toBe(AnimationRole.RUN);
    expect(weights.primaryWeight).toBeCloseTo(1, 5);
    expect(weights.secondary).toBeNull();
  });

  it("blends two adjacent roles at the midpoint", () => {
    const tree = buildLocomotionTree();
    const weights = tree.evaluate(3.75); // midpoint of walk(2.5) and run(5)

    expect(weights.primary).toBe(AnimationRole.WALK);
    expect(weights.secondary).toBe(AnimationRole.RUN);
    expect(weights.primaryWeight).toBeCloseTo(0.5, 5);
    expect(weights.secondaryWeight).toBeCloseTo(0.5, 5);
  });

  it("clamps to the first node below the minimum parameter", () => {
    const tree = buildLocomotionTree();
    const weights = tree.evaluate(-10);
    expect(weights.primary).toBe(AnimationRole.IDLE);
    expect(weights.primaryWeight).toBe(1);
  });

  it("clamps to the last node above the maximum parameter", () => {
    const tree = buildLocomotionTree();
    const weights = tree.evaluate(100);
    expect(weights.primary).toBe(AnimationRole.SPRINT);
    expect(weights.primaryWeight).toBe(1);
  });

  it("weights always sum to 1", () => {
    const tree = buildLocomotionTree();
    for (const parameter of [0, 1, 2.5, 3.75, 5, 6.5, 8]) {
      const weights = tree.evaluate(parameter);
      expect(weights.primaryWeight + weights.secondaryWeight).toBeCloseTo(1, 5);
    }
  });

  it("rejects fewer than two nodes", () => {
    expect(() => new AnimationBlendTree([{ parameterValue: 0, role: AnimationRole.IDLE }])).toThrow(
      InvalidBlendTreeError
    );
  });
});
