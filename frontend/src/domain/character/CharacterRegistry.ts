import type { CharacterEntity } from "./CharacterEntity";
import type { CharacterType } from "./CharacterType";

export class UnknownCharacterInstanceError extends Error {
  constructor(readonly instanceId: string) {
    super(`No character instance is registered with id "${instanceId}".`);
    this.name = "UnknownCharacterInstanceError";
  }
}

/**
 * Tracks every currently-spawned CharacterEntity. Distinct from
 * CharacterFactory (which only constructs instances) — a caller
 * spawns via the factory, then registers the result here so other
 * systems (camera targeting, a future NPC AI tick loop, save/load)
 * can find it by instance id.
 */
export class CharacterRegistry {
  private readonly charactersById = new Map<string, CharacterEntity>();

  register(character: CharacterEntity): void {
    this.charactersById.set(character.instanceId, character);
  }

  unregister(instanceId: string): void {
    this.charactersById.delete(instanceId);
  }

  get(instanceId: string): CharacterEntity {
    const character = this.charactersById.get(instanceId);
    if (!character) {
      throw new UnknownCharacterInstanceError(instanceId);
    }
    return character;
  }

  has(instanceId: string): boolean {
    return this.charactersById.has(instanceId);
  }

  list(): readonly CharacterEntity[] {
    return Array.from(this.charactersById.values());
  }

  listByType(type: CharacterType): readonly CharacterEntity[] {
    return this.list().filter((character) => character.config.type === type);
  }

  size(): number {
    return this.charactersById.size;
  }

  clear(): void {
    this.charactersById.clear();
  }
}
