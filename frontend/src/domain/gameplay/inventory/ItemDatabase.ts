import type { ItemDefinition } from "./ItemDefinition";

export class DuplicateItemDefinitionError extends Error {
  constructor(readonly id: string) {
    super(`An item definition with id "${id}" is already registered.`);
    this.name = "DuplicateItemDefinitionError";
  }
}

export class UnknownItemDefinitionError extends Error {
  constructor(readonly id: string) {
    super(`No item definition is registered with id "${id}".`);
    this.name = "UnknownItemDefinitionError";
  }
}

export class ItemDatabase {
  private readonly definitionsById = new Map<string, ItemDefinition>();

  register(definition: ItemDefinition): void {
    if (this.definitionsById.has(definition.id)) {
      throw new DuplicateItemDefinitionError(definition.id);
    }
    this.definitionsById.set(definition.id, definition);
  }

  registerAll(definitions: readonly ItemDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  get(id: string): ItemDefinition {
    const definition = this.definitionsById.get(id);
    if (!definition) {
      throw new UnknownItemDefinitionError(id);
    }
    return definition;
  }

  has(id: string): boolean {
    return this.definitionsById.has(id);
  }

  list(): readonly ItemDefinition[] {
    return Array.from(this.definitionsById.values());
  }
}
