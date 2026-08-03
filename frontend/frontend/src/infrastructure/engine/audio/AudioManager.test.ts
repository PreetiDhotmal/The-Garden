import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEngineEventBus } from "@/domain/engine/events/EngineEventBus";
import { AudioManager } from "./AudioManager";

class MockGainNode {
  gain = { value: 1 };
  connect = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = "suspended";
  destination = {};
  createGain = vi.fn(() => new MockGainNode());
  resume = vi.fn(() => {
    this.state = "running";
  });
  close = vi.fn(() => {
    this.state = "closed";
  });
}

beforeEach(() => {
  vi.stubGlobal("AudioContext", MockAudioContext);
});

describe("AudioManager", () => {
  it("creates the audio graph lazily on first getContext() call", () => {
    const manager = new AudioManager(createEngineEventBus());
    const context = manager.getContext() as unknown as MockAudioContext;

    // master + 4 groups = 5 gain nodes created.
    expect(context.createGain).toHaveBeenCalledTimes(5);
  });

  it("reuses the same context on subsequent calls", () => {
    const manager = new AudioManager(createEngineEventBus());
    const first = manager.getContext();
    const second = manager.getContext();
    expect(first).toBe(second);
  });

  it("applies configured default volumes to each group's gain node", () => {
    const manager = new AudioManager(createEngineEventBus());
    expect(manager.getGroupVolume("music")).toBeCloseTo(0.7, 5);
    expect(manager.getGroupVolume("sfx")).toBeCloseTo(0.85, 5);
  });

  it("sets a group's volume and emits an event", () => {
    const eventBus = createEngineEventBus();
    const manager = new AudioManager(eventBus);
    const changed = vi.fn();
    eventBus.on("audio:volume-group-changed", changed);

    manager.setGroupVolume("sfx", 0.3);

    expect(manager.getGroupVolume("sfx")).toBeCloseTo(0.3, 5);
    expect(changed).toHaveBeenCalledWith({ group: "sfx", volume: 0.3 });
  });

  it("rejects an out-of-range volume", () => {
    const manager = new AudioManager(createEngineEventBus());
    expect(() => {
      manager.setGroupVolume("sfx", 1.5);
    }).toThrow(RangeError);
  });

  it("resume() resumes a suspended context", async () => {
    const manager = new AudioManager(createEngineEventBus());
    const context = manager.getContext() as unknown as MockAudioContext;
    expect(context.state).toBe("suspended");

    await manager.resume();

    expect(context.resume).toHaveBeenCalledTimes(1);
  });

  it("dispose() closes the context and clears gain nodes", () => {
    const manager = new AudioManager(createEngineEventBus());
    const context = manager.getContext() as unknown as MockAudioContext;

    manager.dispose();

    expect(context.close).toHaveBeenCalledTimes(1);
  });
});
