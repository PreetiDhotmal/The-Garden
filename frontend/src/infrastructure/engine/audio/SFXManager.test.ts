import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEngineEventBus } from "@/domain/engine/events/EngineEventBus";
import { createAudioConfig } from "@/domain/engine/config/AudioConfig";
import { AudioManager } from "./AudioManager";
import { SFXManager } from "./SFXManager";

class MockGainNode {
  gain = { value: 1 };
  connect = vi.fn();
}

class MockBufferSourceNode {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = "running";
  destination = {};
  createGain = vi.fn(() => new MockGainNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {});
}

beforeEach(() => {
  vi.stubGlobal("AudioContext", MockAudioContext);
});

function buildSfxManager(maxConcurrentSfx = 16) {
  const audioManager = new AudioManager(createEngineEventBus());
  const sfxManager = new SFXManager(audioManager, createAudioConfig({ maxConcurrentSfx }));
  return { audioManager, sfxManager };
}

describe("SFXManager", () => {
  it("plays a sound and reports it as active", () => {
    const { sfxManager } = buildSfxManager();

    const started = sfxManager.play({} as AudioBuffer);

    expect(started).toBe(true);
    expect(sfxManager.activeCount()).toBe(1);
  });

  it("removes a source from the active pool when it ends", () => {
    const { audioManager, sfxManager } = buildSfxManager();
    sfxManager.play({} as AudioBuffer);
    const context = audioManager.getContext() as unknown as MockAudioContext;
    const source = context.createBufferSource.mock.results[0]?.value as MockBufferSourceNode;

    source.onended?.();

    expect(sfxManager.activeCount()).toBe(0);
  });

  it("refuses to play beyond the configured concurrency cap", () => {
    const { sfxManager } = buildSfxManager(2);

    expect(sfxManager.play({} as AudioBuffer)).toBe(true);
    expect(sfxManager.play({} as AudioBuffer)).toBe(true);
    expect(sfxManager.play({} as AudioBuffer)).toBe(false);
    expect(sfxManager.activeCount()).toBe(2);
  });

  it("stopAll() stops and clears every active source", () => {
    const { audioManager, sfxManager } = buildSfxManager();
    sfxManager.play({} as AudioBuffer);
    sfxManager.play({} as AudioBuffer);
    const context = audioManager.getContext() as unknown as MockAudioContext;

    sfxManager.stopAll();

    expect(sfxManager.activeCount()).toBe(0);
    for (const result of context.createBufferSource.mock.results) {
      expect((result.value as MockBufferSourceNode).stop).toHaveBeenCalledTimes(1);
    }
  });
});
