import type { AudioConfig, VolumeGroupName } from "@/domain/engine/config/AudioConfig";
import { DEFAULT_AUDIO_CONFIG } from "@/domain/engine/config/AudioConfig";
import type { EngineEventBus } from "@/domain/engine/events/EngineEventBus";

/**
 * Owns the Web Audio graph's routing skeleton: one AudioContext, one
 * master GainNode, and one GainNode per volume group (music, sfx,
 * ambience, ui), each connected to master. MusicManager and SFXManager
 * both play through the group gain nodes this class exposes — neither
 * of them talks to the AudioContext directly.
 *
 * The AudioContext is created lazily on first use and only resumed on
 * a user gesture (browsers block autoplay otherwise) via `resume()`,
 * which the presentation layer should call from a click/tap handler.
 */
export class AudioManager {
  private context: AudioContext | null = null;
  private readonly gainNodesByGroup = new Map<VolumeGroupName, GainNode>();
  private readonly config: AudioConfig;

  constructor(
    private readonly eventBus: EngineEventBus,
    config: AudioConfig = DEFAULT_AUDIO_CONFIG
  ) {
    this.config = config;
  }

  /** Lazily creates (or returns) the AudioContext and its gain graph. */
  getContext(): AudioContext {
    if (this.context) {
      return this.context;
    }

    const AudioContextCtor = window.AudioContext;
    const context = new AudioContextCtor();
    const masterGain = context.createGain();
    masterGain.gain.value = this.config.volumeGroups.master;
    masterGain.connect(context.destination);
    this.gainNodesByGroup.set("master", masterGain);

    for (const group of ["music", "sfx", "ambience", "ui"] as const) {
      const gainNode = context.createGain();
      gainNode.gain.value = this.config.volumeGroups[group];
      gainNode.connect(masterGain);
      this.gainNodesByGroup.set(group, gainNode);
    }

    this.context = context;
    return context;
  }

  /** Must be called from a user-gesture handler to satisfy browser autoplay policies. */
  async resume(): Promise<void> {
    const context = this.getContext();
    if (context.state === "suspended") {
      await context.resume();
    }
  }

  getGroupGainNode(group: VolumeGroupName): GainNode {
    this.getContext(); // ensures the graph exists
    const gainNode = this.gainNodesByGroup.get(group);
    if (!gainNode) {
      throw new Error(`No gain node exists for volume group "${group}".`);
    }
    return gainNode;
  }

  setGroupVolume(group: VolumeGroupName, volume: number): void {
    if (volume < 0 || volume > 1) {
      throw new RangeError(`volume for group "${group}" must be between 0 and 1 (got ${volume.toString()})`);
    }
    const gainNode = this.getGroupGainNode(group);
    gainNode.gain.value = volume;
    this.eventBus.emit("audio:volume-group-changed", { group, volume });
  }

  getGroupVolume(group: VolumeGroupName): number {
    return this.getGroupGainNode(group).gain.value;
  }

  dispose(): void {
    if (this.context) {
      void this.context.close();
      this.context = null;
      this.gainNodesByGroup.clear();
    }
  }
}
