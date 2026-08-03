import type { Vector3Tuple } from "./CharacterSpawnPoint";

/**
 * The serializable shape of a character's persisted state. This
 * milestone defines the interface only — no reader/writer, no
 * storage backend, no autosave triggers. A future save-system
 * milestone implements those against this shape.
 */
export interface CharacterSaveData {
  readonly instanceId: string;
  readonly characterConfigId: string;
  readonly position: Vector3Tuple;
  readonly yaw: number;
  readonly currentHealth: number;
  readonly currentStamina: number;
  readonly savedAtIso: string;
}

/**
 * Contract a future save system implements. Defined now so the
 * character framework can depend on this abstraction (e.g. a "save on
 * checkpoint" hook) without depending on any concrete storage
 * mechanism.
 */
export interface CharacterSaveRepository {
  save: (data: CharacterSaveData) => Promise<void>;
  load: (instanceId: string) => Promise<CharacterSaveData | null>;
}
