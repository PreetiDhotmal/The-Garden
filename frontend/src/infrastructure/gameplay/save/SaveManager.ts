import type { RestorationProfile } from "@/domain/game/RestorationProfile";
import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";
import type { CameraStateSave } from "@/domain/gameplay/save/PlayerSave";
import type { RewardEngine } from "@/domain/gameplay/reward/RewardEngine";
import type { Inventory } from "@/domain/gameplay/inventory/Inventory";
import { serializeInventory } from "@/domain/gameplay/inventory/InventorySerializer";
import type { QuestRegistry } from "@/domain/gameplay/quest/QuestRegistry";
import { applyQuestSave, toQuestSave } from "@/domain/gameplay/quest/QuestSaveMapper";
import { ScriptureProgress } from "@/domain/gameplay/scripture/ScriptureProgress";
import type { NpcManager } from "@/domain/gameplay/npc/NpcManager";
import type { StoryFlags } from "@/domain/gameplay/progression/StoryFlags";
import type { PlayerSave, SettingsSave } from "@/domain/gameplay/save/PlayerSave";
import type { SaveRepository } from "@/domain/gameplay/save/SaveContracts";

const SAVE_VERSION = 1;

export interface WorldSaveContext {
  getCurrentWorldId: () => string;
  getUnlockedWorldIds: () => readonly string[];
  getPlayerPosition: () => Vector3Tuple;
  getPlayerYaw: () => number;
  restorePlayerPosition: (position: Vector3Tuple, yaw: number) => void;
  getCameraState: () => CameraStateSave | null;
  restoreCameraState: (state: CameraStateSave) => void;
  getTotalPlaytimeSeconds: () => number;
  restoreTotalPlaytimeSeconds: (seconds: number) => void;
  /** Gameplay framework milestone additions — optional so routes that don't yet use ChapterManager/GardenRestorationManager (Genesis Garden, Wilderness) need no changes at all; NOOP_WORLD_SAVE_CONTEXT supplies safe defaults. */
  getGardenRestorationState?: () => readonly { zoneId: string; profile: RestorationProfile }[];
  restoreGardenRestorationState?: (
    state: readonly { zoneId: string; profile: RestorationProfile }[]
  ) => void;
  getCurrentChapterId?: () => string | null;
  restoreCurrentChapterId?: (chapterId: string | null) => void;
}

/**
 * Coordinates capturing/restoring a PlayerSave from the live game
 * state, and persisting it via SaveRepository (IndexedDB in
 * production). Depends on every source system through a narrow
 * interface (constructor injection), never reaching into their
 * private internals — mirrors how GameplayProvider itself wires
 * dependencies.
 */
export class SaveManager {
  constructor(
    private readonly saveRepository: SaveRepository,
    private readonly rewardEngine: RewardEngine,
    private readonly inventory: Inventory,
    private readonly questRegistry: QuestRegistry,
    private readonly scriptureProgressRef: { current: ScriptureProgress },
    private readonly npcManager: NpcManager,
    private readonly storyFlags: StoryFlags,
    private readonly worldContext: WorldSaveContext,
    private readonly settingsRef: { current: SettingsSave }
  ) {}

  captureSnapshot(): PlayerSave {
    return {
      saveVersion: SAVE_VERSION,
      savedAtIso: new Date().toISOString(),
      progress: this.rewardEngine.getTotals(),
      inventory: serializeInventory(this.inventory),
      quests: this.questRegistry.list().map(toQuestSave),
      scripture: {
        unlockedReferenceKeys: this.scriptureProgressRef.current.listUnlockedKeys(),
        discoveredReferenceKeys: this.scriptureProgressRef.current.listDiscoveredKeys(),
        memorizedReferenceKeys: this.scriptureProgressRef.current.listMemorizedKeys(),
      },
      world: {
        currentWorldId: this.worldContext.getCurrentWorldId(),
        unlockedWorldIds: this.worldContext.getUnlockedWorldIds(),
        playerPosition: this.worldContext.getPlayerPosition(),
        playerYaw: this.worldContext.getPlayerYaw(),
        cameraState: this.worldContext.getCameraState(),
      },
      settings: this.settingsRef.current,
      npcStates: this.npcManager.snapshotState(),
      storyFlags: this.storyFlags.list(),
      totalPlaytimeSeconds: this.worldContext.getTotalPlaytimeSeconds(),
      gardenRestoration: this.worldContext.getGardenRestorationState?.() ?? [],
      currentChapterId: this.worldContext.getCurrentChapterId?.() ?? null,
    };
  }

  async saveToStorage(): Promise<void> {
    await this.saveRepository.save(this.captureSnapshot());
  }

  async loadFromStorage(): Promise<PlayerSave | null> {
    return this.saveRepository.load();
  }

  async clearStorage(): Promise<void> {
    await this.saveRepository.clear();
  }

  /**
   * Applies a loaded PlayerSave onto the live game state. Quest
   * *content* must already be registered in questRegistry (from game
   * content, same as a fresh start) — this only overlays saved
   * status/progress, so a content change between sessions can't
   * corrupt anything.
   */
  /**
   * Clears the persisted save AND the current in-memory StoryFlags -
   * both matter. Clearing only the persisted save would leave a
   * still-running session's live StoryFlags (e.g. "Puzzle 1 complete"
   * from earlier in this same session) untouched, so a level route
   * checking `storyFlags.has(...)` directly (not only via a fresh
   * loadFromStorage() call) would still see stale progress.
   */
  async clearSave(): Promise<void> {
    await this.saveRepository.clear();
    this.storyFlags.restore([]);
  }

  restoreFromSnapshot(save: PlayerSave): void {
    this.rewardEngine.restoreTotals(save.progress);
    this.inventory.restoreSlots(save.inventory.slots);

    for (const questSave of save.quests) {
      if (this.questRegistry.has(questSave.questId)) {
        this.questRegistry.update(
          applyQuestSave(this.questRegistry.get(questSave.questId), questSave)
        );
      }
    }

    this.scriptureProgressRef.current = ScriptureProgress.restore(
      save.scripture.unlockedReferenceKeys,
      save.scripture.discoveredReferenceKeys,
      save.scripture.memorizedReferenceKeys
    );

    this.npcManager.restoreState(save.npcStates);
    this.storyFlags.restore(save.storyFlags);
    this.worldContext.restorePlayerPosition(save.world.playerPosition, save.world.playerYaw);
    if (save.world.cameraState) {
      this.worldContext.restoreCameraState(save.world.cameraState);
    }
    this.worldContext.restoreTotalPlaytimeSeconds(save.totalPlaytimeSeconds);
    this.worldContext.restoreGardenRestorationState?.(save.gardenRestoration);
    this.worldContext.restoreCurrentChapterId?.(save.currentChapterId);
    this.settingsRef.current = save.settings;
  }
}
