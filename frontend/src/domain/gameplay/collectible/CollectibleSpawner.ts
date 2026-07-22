import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";
import type { CollectibleCategory } from "./CollectibleCategory";
import type { CollectibleEffects } from "./CollectibleEffects";

export interface CollectibleSpawnDefinition {
  readonly id: string;
  readonly category: CollectibleCategory;
  readonly name: string;
  readonly position: Vector3Tuple;
  readonly effects: CollectibleEffects;
  /** If false, this spawn point is skipped — e.g. gated behind a quest flag. Re-checked whenever the spawner runs. */
  readonly isEnabled: () => boolean;
}

/**
 * Holds the set of places collectibles *could* spawn. Actually
 * instantiating a CollectibleEntity (and registering it with
 * CollectibleManager, and creating its InteractionTarget/R3F mesh)
 * is presentation-layer work — this class only decides *which*
 * definitions are currently eligible.
 */
export class CollectibleSpawner {
  private readonly definitions: CollectibleSpawnDefinition[] = [];

  registerDefinition(definition: CollectibleSpawnDefinition): void {
    this.definitions.push(definition);
  }

  getEligibleDefinitions(): readonly CollectibleSpawnDefinition[] {
    return this.definitions.filter((definition) => definition.isEnabled());
  }
}
