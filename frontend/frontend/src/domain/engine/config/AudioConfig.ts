export type VolumeGroupName = "master" | "music" | "sfx" | "ambience" | "ui";

export type VolumeGroupLevels = Readonly<Record<VolumeGroupName, number>>;

export interface AudioConfig {
  readonly volumeGroups: VolumeGroupLevels;
  readonly musicCrossfadeSeconds: number;
  readonly maxConcurrentSfx: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  volumeGroups: {
    master: 1,
    music: 0.7,
    sfx: 0.85,
    ambience: 0.6,
    ui: 0.8,
  },
  musicCrossfadeSeconds: 2.5,
  maxConcurrentSfx: 16,
};

export class InvalidAudioConfigError extends Error {
  constructor(reason: string) {
    super(`Invalid audio config: ${reason}`);
    this.name = "InvalidAudioConfigError";
  }
}

function assertUnitRange(value: number, fieldName: string): void {
  if (value < 0 || value > 1) {
    throw new InvalidAudioConfigError(`${fieldName} must be between 0 and 1 (got ${value.toString()})`);
  }
}

export interface AudioConfigOverrides extends Partial<Omit<AudioConfig, "volumeGroups">> {
  readonly volumeGroups?: Partial<VolumeGroupLevels>;
}

export function createAudioConfig(overrides: AudioConfigOverrides = {}): AudioConfig {
  const config: AudioConfig = {
    ...DEFAULT_AUDIO_CONFIG,
    ...overrides,
    volumeGroups: { ...DEFAULT_AUDIO_CONFIG.volumeGroups, ...overrides.volumeGroups },
  };

  for (const [group, level] of Object.entries(config.volumeGroups)) {
    assertUnitRange(level, `volumeGroups.${group}`);
  }
  if (config.musicCrossfadeSeconds < 0) {
    throw new InvalidAudioConfigError("musicCrossfadeSeconds must not be negative");
  }
  if (config.maxConcurrentSfx < 1) {
    throw new InvalidAudioConfigError("maxConcurrentSfx must be at least 1");
  }

  return config;
}
