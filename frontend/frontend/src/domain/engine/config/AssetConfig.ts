/**
 * Global tuning knobs for the asset pipeline itself (not any one
 * asset). Consumed by the infrastructure AssetManager to control
 * concurrency and cache behavior.
 */
export interface AssetConfig {
  readonly maxConcurrentLoads: number;
  readonly cacheEvictionThreshold: number;
  readonly placeholderModelAssetId: string;
  readonly placeholderTextureAssetId: string;
  readonly retryAttempts: number;
}

export const DEFAULT_ASSET_CONFIG: AssetConfig = {
  maxConcurrentLoads: 6,
  cacheEvictionThreshold: 200,
  placeholderModelAssetId: "placeholder:model",
  placeholderTextureAssetId: "placeholder:texture",
  retryAttempts: 2,
};

export class InvalidAssetConfigError extends Error {
  constructor(reason: string) {
    super(`Invalid asset config: ${reason}`);
    this.name = "InvalidAssetConfigError";
  }
}

export function createAssetConfig(overrides: Partial<AssetConfig> = {}): AssetConfig {
  const config: AssetConfig = { ...DEFAULT_ASSET_CONFIG, ...overrides };

  if (config.maxConcurrentLoads < 1) {
    throw new InvalidAssetConfigError("maxConcurrentLoads must be at least 1");
  }
  if (config.cacheEvictionThreshold < 1) {
    throw new InvalidAssetConfigError("cacheEvictionThreshold must be at least 1");
  }
  if (config.retryAttempts < 0) {
    throw new InvalidAssetConfigError("retryAttempts must not be negative");
  }

  return config;
}
