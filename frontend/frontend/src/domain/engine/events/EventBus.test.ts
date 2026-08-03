import { describe, expect, it, vi } from "vitest";
import { EventBus } from "./EventBus";

interface TestEventMap {
  "counter:incremented": { by: number };
  "counter:reset": Record<string, never>;
  [key: string]: unknown;
}

describe("EventBus", () => {
  it("delivers emitted payloads to subscribers", () => {
    const bus = new EventBus<TestEventMap>();
    const listener = vi.fn();

    bus.on("counter:incremented", listener);
    bus.emit("counter:incremented", { by: 3 });

    expect(listener).toHaveBeenCalledWith({ by: 3 });
  });

  it("supports multiple listeners for the same event", () => {
    const bus = new EventBus<TestEventMap>();
    const first = vi.fn();
    const second = vi.fn();

    bus.on("counter:incremented", first);
    bus.on("counter:incremented", second);
    bus.emit("counter:incremented", { by: 1 });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops delivering events after unsubscribe", () => {
    const bus = new EventBus<TestEventMap>();
    const listener = vi.fn();

    const unsubscribe = bus.on("counter:incremented", listener);
    unsubscribe();
    bus.emit("counter:incremented", { by: 1 });

    expect(listener).not.toHaveBeenCalled();
  });

  it("off() removes only the specified listener", () => {
    const bus = new EventBus<TestEventMap>();
    const first = vi.fn();
    const second = vi.fn();

    bus.on("counter:incremented", first);
    bus.on("counter:incremented", second);
    bus.off("counter:incremented", first);
    bus.emit("counter:incremented", { by: 1 });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("once() fires exactly one time", () => {
    const bus = new EventBus<TestEventMap>();
    const listener = vi.fn();

    bus.once("counter:incremented", listener);
    bus.emit("counter:incremented", { by: 1 });
    bus.emit("counter:incremented", { by: 2 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ by: 1 });
  });

  it("does not throw when emitting an event with no listeners", () => {
    const bus = new EventBus<TestEventMap>();
    expect(() => {
      bus.emit("counter:reset", {});
    }).not.toThrow();
  });

  it("allows a listener to unsubscribe itself during emission", () => {
    const bus = new EventBus<TestEventMap>();
    const calls: number[] = [];
    const unsubscribe = bus.on("counter:incremented", (payload) => {
      calls.push(payload.by);
      unsubscribe();
    });

    bus.emit("counter:incremented", { by: 1 });
    bus.emit("counter:incremented", { by: 2 });

    expect(calls).toEqual([1]);
  });

  it("reports listener count", () => {
    const bus = new EventBus<TestEventMap>();
    bus.on("counter:incremented", vi.fn());
    bus.on("counter:incremented", vi.fn());

    expect(bus.listenerCount("counter:incremented")).toBe(2);
  });

  it("clear() removes all listeners for all events", () => {
    const bus = new EventBus<TestEventMap>();
    const listener = vi.fn();
    bus.on("counter:incremented", listener);
    bus.clear();
    bus.emit("counter:incremented", { by: 1 });

    expect(listener).not.toHaveBeenCalled();
  });

  it("onAny() is notified for every event with its name and payload", () => {
    const bus = new EventBus<TestEventMap>();
    const anyListener = vi.fn();
    bus.onAny(anyListener);

    bus.emit("counter:incremented", { by: 1 });

    expect(anyListener).toHaveBeenCalledWith("counter:incremented", { by: 1 });
  });

  it("onAny()'s unsubscribe stops further notifications", () => {
    const bus = new EventBus<TestEventMap>();
    const anyListener = vi.fn();
    const unsubscribe = bus.onAny(anyListener);
    unsubscribe();

    bus.emit("counter:incremented", { by: 1 });

    expect(anyListener).not.toHaveBeenCalled();
  });

  it("clear() also removes onAny listeners", () => {
    const bus = new EventBus<TestEventMap>();
    const anyListener = vi.fn();
    bus.onAny(anyListener);
    bus.clear();

    bus.emit("counter:incremented", { by: 1 });

    expect(anyListener).not.toHaveBeenCalled();
  });
});
