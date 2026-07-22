import { EventBus } from "./EventBus";
import type { EngineEventMap } from "./EngineEventMap";

export type EngineEventBus = EventBus<EngineEventMap>;

export function createEngineEventBus(): EngineEventBus {
  return new EventBus<EngineEventMap>();
}
