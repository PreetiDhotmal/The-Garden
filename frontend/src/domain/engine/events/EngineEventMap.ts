import type { AssetDescriptor } from "../assets/AssetDescriptor";

/**
 * Canonical engine event catalog. Every event the engine can emit is
 * declared here with its payload type, so publishers and subscribers
 * are checked by the compiler — no stringly-typed event payloads.
 *
 * Gameplay-level events (quests, dialogue, etc.) belong to their own
 * future bounded contexts and should extend this pattern with their
 * own event maps, not be added here.
 */
export interface EngineEventMap {
  [key: string]: unknown;

  "asset:load-started": { descriptor: AssetDescriptor };
  "asset:load-progress": { descriptor: AssetDescriptor; loadedBytes: number; totalBytes: number };
  "asset:load-completed": { descriptor: AssetDescriptor };
  "asset:load-failed": { descriptor: AssetDescriptor; error: string };
  "asset:preload-progress": { loaded: number; total: number };
  "asset:preload-completed": Record<string, never>;

  "scene:transition-started": { fromSceneId: string | null; toSceneId: string };
  "scene:transition-completed": { sceneId: string };

  "time:tick": { deltaSeconds: number; elapsedSeconds: number };
  "time:paused": Record<string, never>;
  "time:resumed": Record<string, never>;

  "audio:volume-group-changed": { group: string; volume: number };
}

export type EngineEventName = keyof EngineEventMap;
