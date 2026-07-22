import type { PlayerSave } from "./PlayerSave";

export interface Serializer<T> {
  serialize: (value: T) => string;
}

export interface Deserializer<T> {
  deserialize: (data: string) => T;
}

/**
 * A future concrete implementation (e.g. `JsonPlayerSaveCodec`) will
 * implement both interfaces for `PlayerSave` specifically. Kept
 * generic here so any future save shape (e.g. a per-world save file)
 * can reuse the same pattern without a new interface.
 */
export type PlayerSaveSerializer = Serializer<PlayerSave>;
export type PlayerSaveDeserializer = Deserializer<PlayerSave>;

/** Triggers a save on a schedule or on specific events (checkpoint reached, quest completed). No implementation yet — this milestone defines the seam only. */
export interface Autosave {
  trigger: (reason: string) => Promise<void>;
}

/** The persistence port. A future implementation might write to localStorage, IndexedDB, or a backend endpoint — SaveRepository callers don't know or care which. */
export interface SaveRepository {
  save: (playerSave: PlayerSave) => Promise<void>;
  load: () => Promise<PlayerSave | null>;
  clear: () => Promise<void>;
}
