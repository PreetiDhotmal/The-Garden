import type { AnimationRole } from "./AnimationRole";

export interface BlendTreeNode {
  /** The parameter value (e.g. speed in m/s) at which this role plays at full weight. */
  readonly parameterValue: number;
  readonly role: AnimationRole;
}

export interface BlendWeights {
  readonly primary: AnimationRole;
  readonly primaryWeight: number;
  readonly secondary: AnimationRole | null;
  readonly secondaryWeight: number;
}

export class InvalidBlendTreeError extends Error {
  constructor(reason: string) {
    super(`Invalid blend tree: ${reason}`);
    this.name = "InvalidBlendTreeError";
  }
}

/**
 * A 1D blend tree (the standard "locomotion blend" pattern: idle at
 * speed 0, walk at speed 2, run at speed 5, sprint at speed 8 — moving
 * at speed 3.5 blends walk/run at ~50/50). Nodes are sorted by
 * `parameterValue` on construction so lookup is a simple linear scan.
 */
export class AnimationBlendTree {
  private readonly nodes: readonly BlendTreeNode[];

  constructor(nodes: readonly BlendTreeNode[]) {
    if (nodes.length < 2) {
      throw new InvalidBlendTreeError("a blend tree needs at least two nodes to interpolate between");
    }
    this.nodes = [...nodes].sort((a, b) => a.parameterValue - b.parameterValue);
  }

  /** Returns the one or two roles that should be blended at `parameter`, and their weights (which sum to 1). */
  evaluate(parameter: number): BlendWeights {
    const first = this.nodes[0];
    const last = this.nodes[this.nodes.length - 1];
    if (!first || !last) {
      throw new InvalidBlendTreeError("blend tree has no nodes");
    }

    if (parameter <= first.parameterValue) {
      return { primary: first.role, primaryWeight: 1, secondary: null, secondaryWeight: 0 };
    }
    if (parameter >= last.parameterValue) {
      return { primary: last.role, primaryWeight: 1, secondary: null, secondaryWeight: 0 };
    }

    for (const node of this.nodes) {
      if (parameter === node.parameterValue) {
        return { primary: node.role, primaryWeight: 1, secondary: null, secondaryWeight: 0 };
      }
    }

    for (let i = 0; i < this.nodes.length - 1; i += 1) {
      const lower = this.nodes[i];
      const upper = this.nodes[i + 1];
      if (!lower || !upper) {
        continue;
      }
      if (parameter >= lower.parameterValue && parameter <= upper.parameterValue) {
        const span = upper.parameterValue - lower.parameterValue;
        const upperWeight = span === 0 ? 1 : (parameter - lower.parameterValue) / span;
        return {
          primary: lower.role,
          primaryWeight: 1 - upperWeight,
          secondary: upper.role,
          secondaryWeight: upperWeight,
        };
      }
    }

    // Unreachable given the bounds checks above, but keeps the function total.
    throw new InvalidBlendTreeError(`parameter ${String(parameter)} could not be resolved to a blend region`);
  }
}
