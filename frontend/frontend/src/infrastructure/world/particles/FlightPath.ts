export interface FlightPathParams {
  readonly centerX: number;
  readonly centerY: number;
  readonly centerZ: number;
  readonly radius: number;
  readonly speed: number;
  readonly bobHeight: number;
  readonly bobSpeed: number;
  readonly phaseOffset: number;
}

export interface FlightPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Yaw facing the direction of travel, for orienting the creature mesh. */
  readonly headingRadians: number;
}

/** Computes a circling position + facing at time `t` (seconds) — reused by both bird and butterfly flocks, which only differ in the params passed in. */
export function computeFlightPosition(params: FlightPathParams, t: number): FlightPosition {
  const angle = t * params.speed + params.phaseOffset;
  const x = params.centerX + Math.cos(angle) * params.radius;
  const z = params.centerZ + Math.sin(angle) * params.radius;
  const y = params.centerY + Math.sin(t * params.bobSpeed + params.phaseOffset) * params.bobHeight;

  // Heading is the tangent direction of the circular path.
  const headingRadians = angle + Math.PI / 2;

  return { x, y, z, headingRadians };
}
