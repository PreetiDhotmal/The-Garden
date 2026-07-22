import type { AudioConfig } from "@/domain/engine/config/AudioConfig";
import { DEFAULT_AUDIO_CONFIG } from "@/domain/engine/config/AudioConfig";
import type { AudioManager } from "./AudioManager";

/**
 * Plays one-shot sound effects through AudioManager's "sfx" group. A
 * new AudioBufferSourceNode is created per play (sources are
 * single-use in the Web Audio API) and self-cleans from the active
 * pool via its `onended` callback. Enforces
 * `config.maxConcurrentSfx` by refusing new plays once the pool is
 * full, rather than silently degrading audio by stacking unbounded
 * concurrent sources.
 */
export class SFXManager {
  private readonly activeSources = new Set<AudioBufferSourceNode>();

  constructor(
    private readonly audioManager: AudioManager,
    private readonly config: AudioConfig = DEFAULT_AUDIO_CONFIG
  ) {}

  /** Plays `buffer` once. Returns false (and does not play) if the concurrency cap has been reached. */
  play(buffer: AudioBuffer, options: { volume?: number } = {}): boolean {
    if (this.activeSources.size >= this.config.maxConcurrentSfx) {
      return false;
    }

    const context = this.audioManager.getContext();
    const sfxGroupGain = this.audioManager.getGroupGainNode("sfx");

    const source = context.createBufferSource();
    source.buffer = buffer;

    const gainNode = context.createGain();
    gainNode.gain.value = options.volume ?? 1;

    source.connect(gainNode);
    gainNode.connect(sfxGroupGain);

    source.onended = () => {
      this.activeSources.delete(source);
    };

    this.activeSources.add(source);
    source.start();
    return true;
  }

  stopAll(): void {
    for (const source of this.activeSources) {
      source.stop();
    }
    this.activeSources.clear();
  }

  activeCount(): number {
    return this.activeSources.size;
  }
}
