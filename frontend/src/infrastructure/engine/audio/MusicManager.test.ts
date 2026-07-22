import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEngineEventBus } from "@/domain/engine/events/EngineEventBus";
import { AudioManager } from "./AudioManager";
import { MusicManager } from "./MusicManager";

class MockGainNode {
  gain = {
    value: 1,
    linearRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
}

class MockBufferSourceNode {
  buffer: AudioBuffer | null = null;
  loop = false;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = "running";
  currentTime = 0;
  destination = {};
  createGain = vi.fn(() => new MockGainNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {});
}

beforeEach(() => {
  vi.stubGlobal("AudioContext", MockAudioContext);
});

function buildMusicManager() {
  const audioManager = new AudioManager(createEngineEventBus());
  const musicManager = new MusicManager(audioManager);
  return { audioManager, musicManager };
}

describe("MusicManager", () => {
  it("starts playback and tracks the current track id", () => {
    const { musicManager } = buildMusicManager();
    const buffer = {} as AudioBuffer;

    musicManager.play("forest-theme", buffer);

    expect(musicManager.getCurrentTrackId()).toBe("forest-theme");
  });

  it("is a no-op when asked to play the already-playing track", () => {
    const { audioManager, musicManager } = buildMusicManager();
    const context = audioManager.getContext() as unknown as MockAudioContext;
    const buffer = {} as AudioBuffer;

    musicManager.play("forest-theme", buffer);
    const callsAfterFirstPlay = context.createBufferSource.mock.calls.length;
    musicManager.play("forest-theme", buffer);

    expect(context.createBufferSource.mock.calls.length).toBe(callsAfterFirstPlay);
  });

  it("crossfades to a new track, stopping the previous one", () => {
    const { audioManager, musicManager } = buildMusicManager();
    const buffer = {} as AudioBuffer;

    musicManager.play("forest-theme", buffer);
    const context = audioManager.getContext() as unknown as MockAudioContext;
    const firstSourceInstance = context.createBufferSource.mock.results[0]?.value as MockBufferSourceNode;

    musicManager.play("mountain-theme", buffer);

    expect(musicManager.getCurrentTrackId()).toBe("mountain-theme");
    expect(firstSourceInstance.stop).toHaveBeenCalledTimes(1);
  });

  it("stop() ramps out and clears the current track", () => {
    const { musicManager } = buildMusicManager();
    musicManager.play("forest-theme", {} as AudioBuffer);

    musicManager.stop();

    expect(musicManager.getCurrentTrackId()).toBeNull();
  });

  it("stop() is a no-op when nothing is playing", () => {
    const { musicManager } = buildMusicManager();
    expect(() => {
      musicManager.stop();
    }).not.toThrow();
  });
});
