import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";
import type { PlayerProgressTotals } from "@/domain/gameplay/reward/PlayerProgressTotals";
import type { InventorySave } from "@/domain/gameplay/inventory/InventorySerializer";
import type { QuestSave } from "@/domain/gameplay/quest/QuestSaveModel";
import type { NpcRuntimeState } from "@/domain/gameplay/npc/NpcRuntimeState";

export interface ScriptureSave {
  readonly unlockedReferenceKeys: readonly string[];
  readonly discoveredReferenceKeys: readonly string[];
  readonly memorizedReferenceKeys: readonly string[];
  // Bookmark/favorite/recently-read state is NOT duplicated here — it's
  // already persisted via Milestone 6's OfflineScriptureStorage
  // (IndexedDB), which is its own durable store. Keeping one source of
  // truth for that data avoids two save mechanisms drifting out of sync.
}

export interface WorldSave {
  readonly currentWorldId: string;
  readonly unlockedWorldIds: readonly string[];
  readonly playerPosition: Vector3Tuple;
  readonly playerYaw: number;
}

export interface SettingsSave {
  readonly musicVolume: number;
  readonly sfxVolume: number;
  readonly selectedCharacterId: string | null;
}

export interface PlayerSave {
  readonly saveVersion: number;
  readonly savedAtIso: string;
  readonly progress: PlayerProgressTotals;
  readonly inventory: InventorySave;
  readonly quests: readonly QuestSave[];
  readonly scripture: ScriptureSave;
  readonly world: WorldSave;
  readonly settings: SettingsSave;
  /** Milestone 7 additions — additive fields, PlayerSave's original shape from Milestone 4 is otherwise unchanged. */
  readonly npcStates: readonly NpcRuntimeState[];
  readonly storyFlags: readonly string[];
}
