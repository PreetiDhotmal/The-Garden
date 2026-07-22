import type { DialogueTree } from "./DialogueTree";
import { validateDialogueTree } from "./DialogueTree";

export class DuplicateDialogueTreeIdError extends Error {
  constructor(readonly id: string) {
    super(`A dialogue tree with id "${id}" is already registered.`);
    this.name = "DuplicateDialogueTreeIdError";
  }
}

export class UnknownDialogueTreeIdError extends Error {
  constructor(readonly id: string) {
    super(`No dialogue tree is registered with id "${id}".`);
    this.name = "UnknownDialogueTreeIdError";
  }
}

export class DialogueTreeRegistry {
  private readonly treesById = new Map<string, DialogueTree>();

  register(tree: DialogueTree): void {
    if (this.treesById.has(tree.id)) {
      throw new DuplicateDialogueTreeIdError(tree.id);
    }
    validateDialogueTree(tree);
    this.treesById.set(tree.id, tree);
  }

  registerAll(trees: readonly DialogueTree[]): void {
    for (const tree of trees) {
      this.register(tree);
    }
  }

  has(id: string): boolean {
    return this.treesById.has(id);
  }

  get(id: string): DialogueTree {
    const tree = this.treesById.get(id);
    if (!tree) {
      throw new UnknownDialogueTreeIdError(id);
    }
    return tree;
  }
}
