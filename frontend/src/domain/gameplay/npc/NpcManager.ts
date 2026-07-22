import type { GameplayEventBus } from "@/domain/gameplay/events/GameplayEventBus";
import {
  createInitialNpcRuntimeState,
  recordTalkedTo,
  type NpcRuntimeState,
} from "./NpcRuntimeState";
import type { NpcRegistry } from "./NpcRegistry";
import type { NpcDefinition } from "./NpcDefinition";

/**
 * Owns runtime NPC state (talked-to counts, last dialogue node) and
 * fires npc:interacted when the player talks to one. Deliberately
 * does not call DialogueManager or QuestEngine directly — presentation-layer
 * glue (the interaction handler) listens for npc:interacted and
 * decides what dialogue/quest logic follows. This keeps NpcManager
 * from needing to know either of those systems exist.
 */
export class NpcManager {
  private readonly stateByNpcId = new Map<string, NpcRuntimeState>();

  constructor(
    private readonly registry: NpcRegistry,
    private readonly eventBus: GameplayEventBus
  ) {}

  getDefinition(npcId: string): NpcDefinition {
    return this.registry.get(npcId);
  }

  getState(npcId: string): NpcRuntimeState {
    return this.stateByNpcId.get(npcId) ?? createInitialNpcRuntimeState(npcId);
  }

  /** Called when the player actually begins talking to this NPC (a dialogue node has been resolved). */
  recordInteraction(npcId: string, dialogueNodeId: string): NpcRuntimeState {
    const nextState = recordTalkedTo(this.getState(npcId), dialogueNodeId);
    this.stateByNpcId.set(npcId, nextState);
    this.eventBus.emit("npc:interacted", { npcId, talkCount: nextState.talkCount });
    return nextState;
  }

  listByRegion(worldRegionId: string): readonly NpcDefinition[] {
    return this.registry.listByRegion(worldRegionId);
  }

  /** For save/load: a snapshot of every NPC's runtime state that has diverged from its initial value. */
  snapshotState(): readonly NpcRuntimeState[] {
    return Array.from(this.stateByNpcId.values());
  }

  restoreState(snapshot: readonly NpcRuntimeState[]): void {
    this.stateByNpcId.clear();
    for (const state of snapshot) {
      this.stateByNpcId.set(state.npcId, state);
    }
  }
}
