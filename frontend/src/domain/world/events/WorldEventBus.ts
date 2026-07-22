import { EventBus } from "@/domain/engine/events/EventBus";

export interface WorldEventMap {
  [key: string]: unknown;

  "region:entered": { regionId: string };
  "region:exited": { regionId: string };
  "checkpoint:reached": { checkpointId: string };
  "trigger:entered": { triggerId: string };
  "trigger:exited": { triggerId: string };
  "environment-zone:entered": { zoneId: string };
  "environment-zone:exited": { zoneId: string };
  "weather:changed": { weatherType: string };
  "daynight:phase-changed": { phase: string };
  "world:loaded": { worldId: string };
  "world:region-streamed-in": { regionId: string };
  "world:region-streamed-out": { regionId: string };
}

export type WorldEventName = keyof WorldEventMap;
export type WorldEventBus = EventBus<WorldEventMap>;

export function createWorldEventBus(): WorldEventBus {
  return new EventBus<WorldEventMap>();
}
