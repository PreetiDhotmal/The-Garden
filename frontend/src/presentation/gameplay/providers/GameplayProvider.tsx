import { useMemo, type ReactNode } from "react";
import { createGameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import { InteractionManager } from "@/domain/gameplay/interaction/InteractionManager";
import { QuestRegistry } from "@/domain/gameplay/quest/QuestRegistry";
import { QuestEngine } from "@/domain/gameplay/quest/QuestEngine";
import { RewardEngine } from "@/domain/gameplay/reward/RewardEngine";
import { ItemDatabase } from "@/domain/gameplay/inventory/ItemDatabase";
import { Inventory } from "@/domain/gameplay/inventory/Inventory";
import { createItemDefinition } from "@/domain/gameplay/inventory/ItemDefinition";
import { ItemCategory } from "@/domain/gameplay/inventory/ItemCategory";
import { CollectibleManager } from "@/domain/gameplay/collectible/CollectibleManager";
import { CollectibleInventory } from "@/domain/gameplay/collectible/CollectibleInventory";
import type { CollectibleCategory } from "@/domain/gameplay/collectible/CollectibleCategory";
import { referenceKey } from "@/domain/gameplay/scripture/ScriptureFormatter";
import { ScriptureProgress } from "@/domain/gameplay/scripture/ScriptureProgress";
import type { ScriptureProvider } from "@/domain/gameplay/scripture/ScriptureProvider";
import { MockScriptureProvider } from "@/infrastructure/gameplay/scripture/MockScriptureProvider";
import { BackendScriptureProvider } from "@/infrastructure/gameplay/scripture/BackendScriptureProvider";
import { ScriptureRepositoryImpl } from "@/infrastructure/gameplay/scripture/ScriptureRepositoryImpl";
import { apiClient } from "@/infrastructure/api/apiClientInstance";
import { NpcRegistry } from "@/domain/gameplay/npc/NpcRegistry";
import { NpcManager } from "@/domain/gameplay/npc/NpcManager";
import { DialogueTreeRegistry } from "@/domain/gameplay/dialogue/DialogueTreeRegistry";
import { StoryFlags } from "@/domain/gameplay/progression/StoryFlags";
import { WorldProgressionManager } from "@/domain/gameplay/progression/WorldProgressionManager";
import type { SettingsSave } from "@/domain/gameplay/save/PlayerSave";
import { IndexedDbSaveRepository } from "@/infrastructure/gameplay/save/IndexedDbSaveRepository";
import { SaveManager, type WorldSaveContext } from "@/infrastructure/gameplay/save/SaveManager";
import { GameplayContext, type GameplayServices } from "./GameplayContext";

export const SCRIPTURE_FRAGMENT_ITEM_ID = "item:scripture-fragment";

const DEFAULT_SETTINGS: SettingsSave = { musicVolume: 0.8, sfxVolume: 0.8, selectedCharacterId: null };

/**
 * BackendScriptureProvider (-> our backend -> real YouVersion API) is
 * the production default, replacing MockScriptureProvider per this
 * milestone's objective. VITE_USE_MOCK_SCRIPTURE=true is an explicit,
 * opt-in escape hatch for developers working without a running
 * backend — it is never the default, so "the mock is replaced" holds
 * true for every normal run of the app.
 */
function createScriptureProvider(): ScriptureProvider {
  const useMock = import.meta.env.VITE_USE_MOCK_SCRIPTURE === "true";
  return useMock ? new MockScriptureProvider() : new BackendScriptureProvider(apiClient);
}

const NOOP_WORLD_SAVE_CONTEXT: WorldSaveContext = {
  getCurrentWorldId: () => "unknown",
  getUnlockedWorldIds: () => [],
  getPlayerPosition: () => ({ x: 0, y: 0, z: 0 }),
  getPlayerYaw: () => 0,
  restorePlayerPosition: () => {
    // No-op until a route provides a real implementation.
  },
};

/**
 * World/player state (current region, unlocked worlds, player
 * transform) doesn't exist yet when GameplayProvider mounts — the
 * world route creates WorldManager/the player entity afterward. This
 * returns a STABLE proxy object (the identity SaveManager holds onto)
 * whose methods delegate through a mutable inner ref; the route swaps
 * innerRef.current to a real implementation once ready, and every
 * call through the proxy picks that up immediately — unlike passing
 * a snapshot object directly, which would go stale the moment the
 * route replaces it.
 */
function createDeferredWorldSaveContext(): {
  innerRef: { current: WorldSaveContext };
  proxyContext: WorldSaveContext;
} {
  const innerRef: { current: WorldSaveContext } = { current: NOOP_WORLD_SAVE_CONTEXT };
  const proxyContext: WorldSaveContext = {
    getCurrentWorldId: () => innerRef.current.getCurrentWorldId(),
    getUnlockedWorldIds: () => innerRef.current.getUnlockedWorldIds(),
    getPlayerPosition: () => innerRef.current.getPlayerPosition(),
    getPlayerYaw: () => innerRef.current.getPlayerYaw(),
    restorePlayerPosition: (position, yaw) => {
      innerRef.current.restorePlayerPosition(position, yaw);
    },
  };
  return { innerRef, proxyContext };
}

function createGameplayServices(): GameplayServices {
  const eventBus = createGameplayEventBus();

  const itemDatabase = new ItemDatabase();
  itemDatabase.register(
    createItemDefinition({
      id: SCRIPTURE_FRAGMENT_ITEM_ID,
      name: "Scripture Fragment",
      description: "A fragment of scripture, waiting to be read.",
      category: ItemCategory.SCRIPTURE_FRAGMENT,
      stackable: true,
      maxStackSize: 99,
    })
  );
  const inventory = new Inventory(20, itemDatabase, eventBus);

  const rewardEngine = new RewardEngine(eventBus);
  const questRegistry = new QuestRegistry();
  const questEngine = new QuestEngine(questRegistry, eventBus, rewardEngine);

  const scriptureProgressRef: { current: ScriptureProgress } = { current: ScriptureProgress.empty() };
  const scriptureRepository = new ScriptureRepositoryImpl(createScriptureProvider());

  const collectibleManager = new CollectibleManager(eventBus, {
    grantItem: (itemId, quantity) => {
      inventory.addItem(itemId, quantity);
    },
    grantReward: (bundle) => {
      rewardEngine.grant(bundle);
    },
    unlockScripture: (scriptureReward) => {
      scriptureProgressRef.current = scriptureProgressRef.current.unlock(
        scriptureReward.reference,
        scriptureReward.source,
        scriptureReward.sourceId
      );
      eventBus.emit("scripture:collected", { referenceKey: referenceKey(scriptureReward.reference) });
    },
  });

  const collectibleInventory = new CollectibleInventory();
  eventBus.on("collectible:picked", ({ collectibleId, category }) => {
    collectibleInventory.record(collectibleId, category as CollectibleCategory);
  });

  const interactionManager = new InteractionManager(eventBus);

  const npcRegistry = new NpcRegistry();
  const npcManager = new NpcManager(npcRegistry, eventBus);
  const dialogueTreeRegistry = new DialogueTreeRegistry();
  const storyFlags = new StoryFlags();
  const worldProgressionManager = new WorldProgressionManager();

  const settingsRef: { current: SettingsSave } = { current: DEFAULT_SETTINGS };
  const { innerRef: worldSaveContextRef, proxyContext } = createDeferredWorldSaveContext();
  const saveManager = new SaveManager(
    new IndexedDbSaveRepository(),
    rewardEngine,
    inventory,
    questRegistry,
    scriptureProgressRef,
    npcManager,
    storyFlags,
    proxyContext,
    settingsRef
  );

  return {
    eventBus,
    interactionManager,
    questRegistry,
    questEngine,
    rewardEngine,
    itemDatabase,
    inventory,
    collectibleManager,
    collectibleInventory,
    scriptureRepository,
    scriptureProgressRef,
    npcRegistry,
    npcManager,
    dialogueTreeRegistry,
    storyFlags,
    worldProgressionManager,
    saveManager,
    worldSaveContextRef,
  };
}

export interface GameplayProviderProps {
  readonly children: ReactNode;
}

/**
 * Constructs every gameplay singleton exactly once per mount. Mirrors
 * EngineProvider's pattern from Milestone 2/3. Collectible effect
 * handlers are wired here (not inside CollectibleManager itself) —
 * this is the dependency-injection seam the architecture requires.
 */
export function GameplayProvider({ children }: GameplayProviderProps) {
  const services = useMemo(() => createGameplayServices(), []);
  return <GameplayContext.Provider value={services}>{children}</GameplayContext.Provider>;
}
