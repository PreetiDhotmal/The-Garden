import { createContext } from "react";
import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import type { InteractionManager } from "@/domain/gameplay/interaction/InteractionManager";
import type { QuestEngine } from "@/domain/gameplay/quest/QuestEngine";
import type { QuestRegistry } from "@/domain/gameplay/quest/QuestRegistry";
import type { RewardEngine } from "@/domain/gameplay/reward/RewardEngine";
import type { ItemDatabase } from "@/domain/gameplay/inventory/ItemDatabase";
import type { Inventory } from "@/domain/gameplay/inventory/Inventory";
import type { CollectibleManager } from "@/domain/gameplay/collectible/CollectibleManager";
import type { CollectibleInventory } from "@/domain/gameplay/collectible/CollectibleInventory";
import type { ScriptureRepository } from "@/domain/gameplay/scripture/ScriptureRepository";
import type { ScriptureProgress } from "@/domain/gameplay/scripture/ScriptureProgress";
import type { NpcRegistry } from "@/domain/gameplay/npc/NpcRegistry";
import type { NpcManager } from "@/domain/gameplay/npc/NpcManager";
import type { DialogueTreeRegistry } from "@/domain/gameplay/dialogue/DialogueTreeRegistry";
import type { StoryFlags } from "@/domain/gameplay/progression/StoryFlags";
import type { WorldProgressionManager } from "@/domain/gameplay/progression/WorldProgressionManager";
import type { SaveManager } from "@/infrastructure/gameplay/save/SaveManager";
import type { WorldSaveContext } from "@/infrastructure/gameplay/save/SaveManager";
import type { SettingsSave } from "@/domain/gameplay/save/PlayerSave";

export interface GameplayServices {
  readonly eventBus: GameplayEventBus;
  readonly interactionManager: InteractionManager;
  readonly questRegistry: QuestRegistry;
  readonly questEngine: QuestEngine;
  readonly rewardEngine: RewardEngine;
  readonly itemDatabase: ItemDatabase;
  readonly inventory: Inventory;
  readonly collectibleManager: CollectibleManager;
  readonly collectibleInventory: CollectibleInventory;
  readonly scriptureRepository: ScriptureRepository;
  /** Mutable holder so presentation code can read/replace the current immutable ScriptureProgress snapshot. */
  readonly scriptureProgressRef: { current: ScriptureProgress };
  /** Milestone 7 additions. */
  readonly npcRegistry: NpcRegistry;
  readonly npcManager: NpcManager;
  readonly dialogueTreeRegistry: DialogueTreeRegistry;
  readonly storyFlags: StoryFlags;
  readonly worldProgressionManager: WorldProgressionManager;
  readonly saveManager: SaveManager;
  /** SaveManager's world/player queries are deferred until a world route provides real implementations — set .current here once the world/player entity exist. */
  readonly worldSaveContextRef: { current: WorldSaveContext };
  /** SaveManager reads this synchronously when Save is pressed — GameplayProvider keeps it synced to the live settings/character-selection stores. */
  readonly settingsRef: { current: SettingsSave };
}

export const GameplayContext = createContext<GameplayServices | null>(null);
