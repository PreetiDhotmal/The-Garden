import type { AudioConfig } from "@/domain/engine/config/AudioConfig";
import { DEFAULT_AUDIO_CONFIG } from "@/domain/engine/config/AudioConfig";
import type { AudioManager } from "./AudioManager";

interface ActiveTrack {
  readonly trackId: string;
  readonly source: AudioBufferSourceNode;
  readonly gain: GainNode;
}

/**
 * Plays looping background music through AudioManager's "music" group,
 * crossfading between the currently playing track and a new one over
 * `config.musicCrossfadeSeconds`. Buffers are supplied by the caller
 * (loaded via AssetManager) — this class only owns playback/mixing.
 */
export class MusicManager {
  private active: ActiveTrack | null = null;

  constructor(
    private readonly audioManager: AudioManager,
    private readonly config: AudioConfig = DEFAULT_AUDIO_CONFIG
  ) {}

  /** Starts playing `buffer` looped, crossfading out any currently playing track. */
  play(trackId: string, buffer: AudioBuffer): void {
    if (this.active?.trackId === trackId) {
      return;
    }

    const context = this.audioManager.getContext();
    const musicGroupGain = this.audioManager.getGroupGainNode("music");

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const trackGain = context.createGain();
    trackGain.gain.value = 0;
    source.connect(trackGain);
    trackGain.connect(musicGroupGain);

    const now = context.currentTime;
    trackGain.gain.linearRampToValueAtTime(1, now + this.config.musicCrossfadeSeconds);
    source.start(now);

    const previous = this.active;
    if (previous) {
      previous.gain.gain.linearRampToValueAtTime(0, now + this.config.musicCrossfadeSeconds);
      previous.source.stop(now + this.config.musicCrossfadeSeconds);
    }

    this.active = { trackId, source, gain: trackGain };
  }

  stop(): void {
    if (!this.active) {
      return;
    }
    const context = this.audioManager.getContext();
    const now = context.currentTime;
    this.active.gain.gain.linearRampToValueAtTime(0, now + this.config.musicCrossfadeSeconds);
    this.active.source.stop(now + this.config.musicCrossfadeSeconds);
    this.active = null;
  }

  getCurrentTrackId(): string | null {
    return this.active?.trackId ?? null;
  }
}
