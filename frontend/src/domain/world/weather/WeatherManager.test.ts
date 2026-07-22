import { describe, expect, it, vi } from "vitest";
import { createWorldEventBus } from "@/domain/world/events/WorldEventBus";
import { CLEAR_WEATHER, WeatherManager, WeatherType } from "./WeatherManager";

describe("WeatherManager", () => {
  it("starts clear", () => {
    const manager = new WeatherManager(createWorldEventBus());
    expect(manager.getState()).toEqual(CLEAR_WEATHER);
  });

  it("changes weather and emits the event", () => {
    const eventBus = createWorldEventBus();
    const manager = new WeatherManager(eventBus);
    const changed = vi.fn();
    eventBus.on("weather:changed", changed);

    manager.setWeather(WeatherType.RAIN, 0.8);

    expect(manager.getState()).toEqual({ type: WeatherType.RAIN, intensity: 0.8 });
    expect(changed).toHaveBeenCalledWith({ weatherType: WeatherType.RAIN });
  });

  it("does not re-emit for an identical weather state", () => {
    const eventBus = createWorldEventBus();
    const manager = new WeatherManager(eventBus);
    manager.setWeather(WeatherType.RAIN, 0.5);
    const changed = vi.fn();
    eventBus.on("weather:changed", changed);

    manager.setWeather(WeatherType.RAIN, 0.5);

    expect(changed).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range intensity", () => {
    const manager = new WeatherManager(createWorldEventBus());
    expect(() => {
      manager.setWeather(WeatherType.RAIN, 1.5);
    }).toThrow(RangeError);
  });
});
