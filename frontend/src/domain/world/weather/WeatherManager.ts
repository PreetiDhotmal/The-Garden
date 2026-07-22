import type { WorldEventBus } from "@/domain/world/events/WorldEventBus";

export enum WeatherType {
  CLEAR = "CLEAR",
  CLOUDY = "CLOUDY",
  MIST = "MIST",
  RAIN = "RAIN",
}

export interface WeatherState {
  readonly type: WeatherType;
  /** 0-1 how strongly this weather affects fog density / light dimming — lets a future renderer crossfade smoothly rather than snapping. */
  readonly intensity: number;
}

export const CLEAR_WEATHER: WeatherState = { type: WeatherType.CLEAR, intensity: 0 };

/**
 * Owns the current weather state and transition events. This is
 * explicitly "architecture" per the milestone scope — it does not
 * itself spawn rain particles or alter shaders; a presentation-layer
 * consumer reads `getState()` and decides how to render it (e.g.
 * adjusting EnvironmentConfig.fog via LightingManager, both already
 * built). Swapping in a full VFX-driven weather renderer later
 * requires no change here.
 */
export class WeatherManager {
  private state: WeatherState = CLEAR_WEATHER;

  constructor(private readonly eventBus: WorldEventBus) {}

  getState(): WeatherState {
    return this.state;
  }

  setWeather(type: WeatherType, intensity = 1): void {
    if (intensity < 0 || intensity > 1) {
      throw new RangeError("intensity must be between 0 and 1");
    }
    if (type === this.state.type && intensity === this.state.intensity) {
      return;
    }
    this.state = { type, intensity };
    this.eventBus.emit("weather:changed", { weatherType: type });
  }
}
