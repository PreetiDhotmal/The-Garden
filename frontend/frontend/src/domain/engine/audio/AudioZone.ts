export interface Vector3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Defines a spherical region in world space that, when entered, should
 * influence audio playback (e.g. crossfade to an ambience track). This
 * milestone establishes the shape and the pure containment math only —
 * *what* happens on enter/exit (which track, which volume group) is a
 * gameplay/world-authoring concern for a future milestone.
 */
export interface AudioZone {
  readonly id: string;
  readonly center: Vector3Like;
  readonly radius: number;
  readonly musicTrackId: string | null;
  readonly ambientTrackId: string | null;
}

export class InvalidAudioZoneError extends Error {
  constructor(reason: string) {
    super(`Invalid audio zone: ${reason}`);
    this.name = "InvalidAudioZoneError";
  }
}

export interface CreateAudioZoneInput {
  readonly id: string;
  readonly center: Vector3Like;
  readonly radius: number;
  readonly musicTrackId?: string | null;
  readonly ambientTrackId?: string | null;
}

export function createAudioZone(input: CreateAudioZoneInput): AudioZone {
  if (input.id.trim().length === 0) {
    throw new InvalidAudioZoneError("id must not be empty");
  }
  if (input.radius <= 0) {
    throw new InvalidAudioZoneError("radius must be greater than zero");
  }
  return {
    id: input.id,
    center: input.center,
    radius: input.radius,
    musicTrackId: input.musicTrackId ?? null,
    ambientTrackId: input.ambientTrackId ?? null,
  };
}

/** True if `point` lies within (or on) the zone's spherical boundary. */
export function isPointInAudioZone(zone: AudioZone, point: Vector3Like): boolean {
  const dx = point.x - zone.center.x;
  const dy = point.y - zone.center.y;
  const dz = point.z - zone.center.z;
  const distanceSquared = dx * dx + dy * dy + dz * dz;
  return distanceSquared <= zone.radius * zone.radius;
}
