import type { WorldEventBus } from "@/domain/world/events/WorldEventBus";

export interface CheckpointRecord {
  readonly checkpointId: string;
  readonly reachedAtIso: string;
}

/**
 * A checkpoint is just a spawn point id that becomes the player's
 * respawn target once reached — this class only tracks *which* have
 * been reached and *when*; the actual position data lives in
 * SpawnManager (one spawn point per checkpoint id).
 */
export class CheckpointManager {
  private readonly reachedByCheckpointId = new Map<string, CheckpointRecord>();
  private mostRecentCheckpointId: string | null = null;

  constructor(private readonly eventBus: WorldEventBus) {}

  reach(checkpointId: string): void {
    if (this.reachedByCheckpointId.has(checkpointId)) {
      this.mostRecentCheckpointId = checkpointId;
      return;
    }
    this.reachedByCheckpointId.set(checkpointId, {
      checkpointId,
      reachedAtIso: new Date().toISOString(),
    });
    this.mostRecentCheckpointId = checkpointId;
    this.eventBus.emit("checkpoint:reached", { checkpointId });
  }

  hasReached(checkpointId: string): boolean {
    return this.reachedByCheckpointId.has(checkpointId);
  }

  getMostRecentCheckpointId(): string | null {
    return this.mostRecentCheckpointId;
  }

  listReached(): readonly CheckpointRecord[] {
    return Array.from(this.reachedByCheckpointId.values());
  }
}
