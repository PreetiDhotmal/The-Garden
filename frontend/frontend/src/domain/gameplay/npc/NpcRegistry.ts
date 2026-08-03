import type { NpcDefinition } from "./NpcDefinition";

export class DuplicateNpcIdError extends Error {
  constructor(readonly id: string) {
    super(`An NPC with id "${id}" is already registered.`);
    this.name = "DuplicateNpcIdError";
  }
}

export class UnknownNpcIdError extends Error {
  constructor(readonly id: string) {
    super(`No NPC is registered with id "${id}".`);
    this.name = "UnknownNpcIdError";
  }
}

export class NpcRegistry {
  private readonly definitionsById = new Map<string, NpcDefinition>();

  register(definition: NpcDefinition): void {
    if (this.definitionsById.has(definition.id)) {
      throw new DuplicateNpcIdError(definition.id);
    }
    this.definitionsById.set(definition.id, definition);
  }

  registerAll(definitions: readonly NpcDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  has(id: string): boolean {
    return this.definitionsById.has(id);
  }

  get(id: string): NpcDefinition {
    const definition = this.definitionsById.get(id);
    if (!definition) {
      throw new UnknownNpcIdError(id);
    }
    return definition;
  }

  listByRegion(worldRegionId: string): readonly NpcDefinition[] {
    return this.list().filter((definition) => definition.worldRegionId === worldRegionId);
  }

  list(): readonly NpcDefinition[] {
    return Array.from(this.definitionsById.values());
  }
}
