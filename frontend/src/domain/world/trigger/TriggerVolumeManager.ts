import type { Vector3Tuple } from "@/domain/character/CharacterSpawnPoint";
import type { WorldEventBus } from "@/domain/world/events/WorldEventBus";
import { triggerShapeContains, type TriggerShape } from "./TriggerShape";

export interface TriggerVolume {
  readonly id: string;
  readonly shape: TriggerShape;
  /** Called once when the player enters, in addition to the emitted event — for callers that want a direct callback rather than a subscription. */
  readonly onEnter?: () => void;
  readonly onExit?: () => void;
}

export class DuplicateTriggerVolumeError extends Error {
  constructor(readonly id: string) {
    super(`A trigger volume with id "${id}" is already registered.`);
    this.name = "DuplicateTriggerVolumeError";
  }
}

/**
 * Tracks arbitrary named trigger volumes (box or sphere) and which
 * ones currently contain the player, emitting enter/exit events (and
 * calling any per-trigger callback) only on the actual transition.
 * General-purpose — region entry, sacred-clearing ambience, a future
 * puzzle activation zone, etc. all use this same class.
 */
export class TriggerVolumeManager {
  private readonly volumesById = new Map<string, TriggerVolume>();
  private insideIds = new Set<string>();

  constructor(private readonly eventBus: WorldEventBus) {}

  register(volume: TriggerVolume): void {
    if (this.volumesById.has(volume.id)) {
      throw new DuplicateTriggerVolumeError(volume.id);
    }
    this.volumesById.set(volume.id, volume);
  }

  has(id: string): boolean {
    return this.volumesById.has(id);
  }

  unregister(id: string): void {
    this.volumesById.delete(id);
    this.insideIds.delete(id);
  }

  update(playerPosition: Vector3Tuple): void {
    const nowInsideIds = new Set<string>();

    for (const volume of this.volumesById.values()) {
      if (triggerShapeContains(volume.shape, playerPosition)) {
        nowInsideIds.add(volume.id);
      }
    }

    for (const id of nowInsideIds) {
      if (!this.insideIds.has(id)) {
        this.eventBus.emit("trigger:entered", { triggerId: id });
        this.volumesById.get(id)?.onEnter?.();
      }
    }
    for (const id of this.insideIds) {
      if (!nowInsideIds.has(id)) {
        this.eventBus.emit("trigger:exited", { triggerId: id });
        this.volumesById.get(id)?.onExit?.();
      }
    }

    this.insideIds = nowInsideIds;
  }

  isInside(id: string): boolean {
    return this.insideIds.has(id);
  }

  listInside(): readonly string[] {
    return Array.from(this.insideIds);
  }
}
