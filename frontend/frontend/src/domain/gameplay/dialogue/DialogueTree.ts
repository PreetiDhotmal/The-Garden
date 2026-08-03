export interface DialogueChoice {
  readonly id: string;
  readonly text: string;
  readonly targetNodeId: string;
  /** Free-form condition key evaluated by DialogueConditionEvaluator — e.g. "quest:garden-of-beginnings-shrines:completed". Null means always available. */
  readonly condition: string | null;
}

export type DialogueEventKind =
  | { readonly kind: "OFFER_QUEST"; readonly questId: string }
  | { readonly kind: "SHOW_SCRIPTURE"; readonly referenceKey: string }
  | { readonly kind: "CLAIM_QUEST_REWARD"; readonly questId: string }
  | { readonly kind: "PROGRESS_OBJECTIVE"; readonly questId: string; readonly objectiveId: string };

export interface DialogueNode {
  readonly id: string;
  readonly speakerName: string;
  readonly portraitAssetId: string | null;
  /** Multiple pages of text for one node — "Continue" advances through these before showing choices. */
  readonly pages: readonly string[];
  readonly choices: readonly DialogueChoice[];
  /** Condition key gating whether this node can be entered at all — e.g. skip a node if a quest isn't active yet. Null means unconditional. */
  readonly condition: string | null;
  /** Fired once when this node is entered — quest offers, scripture display, reward claims. */
  readonly events: readonly DialogueEventKind[];
  /** True if reaching this node ends the conversation (no choices needed to continue). */
  readonly isTerminal: boolean;
}

export interface DialogueTree {
  readonly id: string;
  readonly startNodeId: string;
  readonly nodesById: Readonly<Record<string, DialogueNode>>;
}

export class InvalidDialogueTreeError extends Error {
  constructor(reason: string) {
    super(`Invalid dialogue tree: ${reason}`);
    this.name = "InvalidDialogueTreeError";
  }
}

export function validateDialogueTree(tree: DialogueTree): void {
  if (!tree.nodesById[tree.startNodeId]) {
    throw new InvalidDialogueTreeError(
      `startNodeId "${tree.startNodeId}" does not exist in tree "${tree.id}"`
    );
  }
  for (const node of Object.values(tree.nodesById)) {
    for (const choice of node.choices) {
      if (!tree.nodesById[choice.targetNodeId]) {
        throw new InvalidDialogueTreeError(
          `node "${node.id}" has a choice targeting missing node "${choice.targetNodeId}"`
        );
      }
    }
  }
}
