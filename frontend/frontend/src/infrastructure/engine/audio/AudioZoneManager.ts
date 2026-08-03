import { isPointInAudioZone, type AudioZone, type Vector3Like } from "@/domain/engine/audio/AudioZone";

/**
 * Tracks which AudioZone(s) a given point (typically the player
 * position) currently occupies. This milestone provides the
 * registration + containment-polling framework only; wiring the
 * result to actual music/ambience track switches is a future
 * gameplay-adjacent milestone once there is a player position to
 * poll in the first place.
 */
export class AudioZoneManager {
  private readonly zonesById = new Map<string, AudioZone>();

  register(zone: AudioZone): void {
    this.zonesById.set(zone.id, zone);
  }

  unregister(zoneId: string): void {
    this.zonesById.delete(zoneId);
  }

  list(): readonly AudioZone[] {
    return Array.from(this.zonesById.values());
  }

  /** Returns every zone whose radius currently contains `point`. */
  zonesContaining(point: Vector3Like): readonly AudioZone[] {
    return this.list().filter((zone) => isPointInAudioZone(zone, point));
  }
}
