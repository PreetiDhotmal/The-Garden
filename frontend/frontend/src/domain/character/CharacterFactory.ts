import type { CharacterConfig } from "@/domain/engine/config/CharacterConfig";
import { CharacterEntity } from "./CharacterEntity";
import type { CharacterSpawnPoint } from "./CharacterSpawnPoint";
import { createCharacterStats, type CreateCharacterStatsInput } from "./CharacterStats";

let nextInstanceSequence = 0;

/** Reset the instance-id sequence — test-only, so successive test runs get predictable ids. */
export function resetCharacterInstanceSequence(): void {
  nextInstanceSequence = 0;
}

function generateInstanceId(config: CharacterConfig): string {
  nextInstanceSequence += 1;
  return `${config.id}#${String(nextInstanceSequence)}`;
}

export interface SpawnCharacterOptions {
  readonly statsOverrides?: CreateCharacterStatsInput;
}

/**
 * Spawns a new CharacterEntity from a config + spawn point. This is
 * the only place instance ids are generated, keeping id-generation
 * logic in one spot regardless of which system (player selection, a
 * future NPC spawner, etc.) triggers the spawn.
 */
export class CharacterFactory {
  spawn(
    config: CharacterConfig,
    spawnPoint: CharacterSpawnPoint,
    options: SpawnCharacterOptions = {}
  ): CharacterEntity {
    const instanceId = generateInstanceId(config);
    const stats = createCharacterStats(options.statsOverrides);
    return new CharacterEntity(instanceId, config, spawnPoint.position, spawnPoint.facingYaw, stats);
  }
}
