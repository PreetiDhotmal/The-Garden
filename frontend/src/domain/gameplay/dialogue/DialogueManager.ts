import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { DialogueChoice, DialogueEventKind, DialogueNode } from "./DialogueTree";
import type { DialogueTreeRegistry } from "./DialogueTreeRegistry";
import {
  evaluateDialogueCondition,
  type DialogueConditionContext,
} from "./DialogueConditionEvaluator";

export interface DialogueSessionSnapshot {
  readonly dialogueTreeId: string;
  readonly node: DialogueNode;
  readonly pageIndex: number;
  readonly currentPageText: string;
  readonly isOnLastPage: boolean;
  readonly availableChoices: readonly DialogueChoice[];
}

export class NoActiveDialogueError extends Error {
  constructor() {
    super("No dialogue session is currently active.");
    this.name = "NoActiveDialogueError";
  }
}

/**
 * Owns exactly one active dialogue session at a time. Node events
 * (OFFER_QUEST, SHOW_SCRIPTURE, CLAIM_QUEST_REWARD) emit *request*
 * events (dialogue:quest-offer-requested, etc.) rather than the
 * actual quest:started/scripture:discovered events — this class
 * doesn't call QuestEngine or ScriptureRepository itself, so it can't
 * honestly claim those transitions happened. Presentation-layer glue
 * subscribes to the request events and performs the real action,
 * which is what actually emits quest:started/scripture:discovered.
 */
export class DialogueManager {
  private activeTreeId: string | null = null;
  private activeNodeId: string | null = null;
  private pageIndex = 0;

  constructor(
    private readonly treeRegistry: DialogueTreeRegistry,
    private readonly eventBus: GameplayEventBus,
    private readonly conditionContext: DialogueConditionContext,
    private readonly npcId: string | null = null
  ) {}

  isActive(): boolean {
    return this.activeTreeId !== null;
  }

  start(dialogueTreeId: string): DialogueSessionSnapshot {
    const tree = this.treeRegistry.get(dialogueTreeId);
    this.activeTreeId = dialogueTreeId;
    this.activeNodeId = tree.startNodeId;
    this.pageIndex = 0;
    this.eventBus.emit("dialogue:started", { dialogueTreeId, npcId: this.npcId });
    this.fireNodeEvents(this.getCurrentNode());
    return this.getSnapshot();
  }

  /** Advances to the next page of the current node's text, or does nothing if already on the last page (call chooseChoice or end instead). */
  advancePage(): DialogueSessionSnapshot {
    const node = this.getCurrentNode();
    if (this.pageIndex < node.pages.length - 1) {
      this.pageIndex += 1;
    }
    return this.getSnapshot();
  }

  /** Skips straight to the last page of the current node — the "skip typing/skip pages" requirement. */
  skipToLastPage(): DialogueSessionSnapshot {
    const node = this.getCurrentNode();
    this.pageIndex = Math.max(0, node.pages.length - 1);
    return this.getSnapshot();
  }

  chooseChoice(choiceId: string): DialogueSessionSnapshot {
    const node = this.getCurrentNode();
    const choice = this.availableChoicesFor(node).find((candidate) => candidate.id === choiceId);
    if (!choice) {
      throw new Error(`Choice "${choiceId}" is not available or does not exist on node "${node.id}".`);
    }
    return this.moveToNode(choice.targetNodeId);
  }

  end(): void {
    if (!this.activeTreeId) {
      return;
    }
    this.eventBus.emit("dialogue:finished", { dialogueTreeId: this.activeTreeId, npcId: this.npcId });
    this.activeTreeId = null;
    this.activeNodeId = null;
    this.pageIndex = 0;
  }

  getSnapshot(): DialogueSessionSnapshot {
    const node = this.getCurrentNode();
    const isOnLastPage = this.pageIndex >= node.pages.length - 1;
    return {
      dialogueTreeId: this.requireActiveTreeId(),
      node,
      pageIndex: this.pageIndex,
      currentPageText: node.pages[this.pageIndex] ?? "",
      isOnLastPage,
      availableChoices: isOnLastPage ? this.availableChoicesFor(node) : [],
    };
  }

  private moveToNode(nodeId: string): DialogueSessionSnapshot {
    const treeId = this.requireActiveTreeId();
    const tree = this.treeRegistry.get(treeId);
    const nextNode = tree.nodesById[nodeId];
    if (!nextNode) {
      throw new Error(`Dialogue node "${nodeId}" does not exist in tree "${treeId}".`);
    }
    if (nextNode.condition && !evaluateDialogueCondition(nextNode.condition, this.conditionContext)) {
      throw new Error(`Dialogue node "${nodeId}" is not currently reachable (condition not met).`);
    }
    this.activeNodeId = nodeId;
    this.pageIndex = 0;
    this.eventBus.emit("dialogue:node-changed", { dialogueTreeId: treeId, nodeId });
    this.fireNodeEvents(nextNode);

    // Snapshot the node before potentially ending the session — end()
    // clears activeTreeId, and getSnapshot() requires it to still be set.
    const snapshot = this.getSnapshot();
    if (nextNode.isTerminal) {
      this.end();
    }
    return snapshot;
  }

  private fireNodeEvents(node: DialogueNode): void {
    for (const event of node.events) {
      this.dispatchEvent(event);
    }
  }

  private dispatchEvent(event: DialogueEventKind): void {
    switch (event.kind) {
      case "OFFER_QUEST":
        this.eventBus.emit("dialogue:quest-offer-requested", { questId: event.questId });
        break;
      case "SHOW_SCRIPTURE":
        this.eventBus.emit("dialogue:scripture-display-requested", {
          referenceKey: event.referenceKey,
        });
        break;
      case "CLAIM_QUEST_REWARD":
        this.eventBus.emit("dialogue:quest-reward-claim-requested", { questId: event.questId });
        break;
      case "PROGRESS_OBJECTIVE":
        this.eventBus.emit("dialogue:objective-progress-requested", {
          questId: event.questId,
          objectiveId: event.objectiveId,
        });
        break;
      default: {
        const exhaustiveCheck: never = event;
        throw new Error(`Unhandled dialogue event kind: ${String(exhaustiveCheck)}`);
      }
    }
  }

  private availableChoicesFor(node: DialogueNode): readonly DialogueChoice[] {
    return node.choices.filter(
      (choice) => !choice.condition || evaluateDialogueCondition(choice.condition, this.conditionContext)
    );
  }

  private getCurrentNode(): DialogueNode {
    const treeId = this.requireActiveTreeId();
    const tree = this.treeRegistry.get(treeId);
    const node = this.activeNodeId ? tree.nodesById[this.activeNodeId] : undefined;
    if (!node) {
      throw new NoActiveDialogueError();
    }
    return node;
  }

  private requireActiveTreeId(): string {
    if (!this.activeTreeId) {
      throw new NoActiveDialogueError();
    }
    return this.activeTreeId;
  }
}
