export interface DirectionalLightConfig {
  readonly colorHex: string;
  readonly intensity: number;
  readonly direction: readonly [number, number, number];
  readonly castShadow: boolean;
}

export interface AmbientLightConfig {
  readonly colorHex: string;
  readonly intensity: number;
}

export interface FogConfig {
  readonly colorHex: string;
  readonly near: number;
  readonly far: number;
}

/**
 * Describes the atmosphere of a scene: sun direction/color, ambient
 * fill, optional fog, and the HDRI used for image-based lighting. This
 * is consumed by the infrastructure LightingManager to construct
 * actual Three.js light objects — this type itself has no Three.js
 * dependency, so it can be authored/validated/tested in isolation.
 */
export interface EnvironmentConfig {
  readonly id: string;
  readonly hdriAssetId: string | null;
  readonly directionalLight: DirectionalLightConfig;
  readonly ambientLight: AmbientLightConfig;
  readonly fog: FogConfig | null;
  readonly backgroundColorHex: string;
}

export class InvalidEnvironmentConfigError extends Error {
  constructor(reason: string) {
    super(`Invalid environment config: ${reason}`);
    this.name = "InvalidEnvironmentConfigError";
  }
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function assertHexColor(value: string, fieldName: string): void {
  if (!HEX_COLOR_PATTERN.test(value)) {
    throw new InvalidEnvironmentConfigError(
      `${fieldName} must be a 6-digit hex color (got "${value}")`
    );
  }
}

export interface CreateEnvironmentConfigInput {
  readonly id: string;
  readonly hdriAssetId?: string | null;
  readonly directionalLight?: Partial<DirectionalLightConfig>;
  readonly ambientLight?: Partial<AmbientLightConfig>;
  readonly fog?: FogConfig | null;
  readonly backgroundColorHex?: string;
}

export function createEnvironmentConfig(input: CreateEnvironmentConfigInput): EnvironmentConfig {
  if (input.id.trim().length === 0) {
    throw new InvalidEnvironmentConfigError("id must not be empty");
  }

  const directionalLight: DirectionalLightConfig = {
    colorHex: input.directionalLight?.colorHex ?? "#fff6e0",
    intensity: input.directionalLight?.intensity ?? 3,
    direction: input.directionalLight?.direction ?? [-0.5, -1, -0.3],
    castShadow: input.directionalLight?.castShadow ?? true,
  };

  const ambientLight: AmbientLightConfig = {
    colorHex: input.ambientLight?.colorHex ?? "#8fa6c9",
    intensity: input.ambientLight?.intensity ?? 0.4,
  };

  const backgroundColorHex = input.backgroundColorHex ?? "#bcd4e6";

  assertHexColor(directionalLight.colorHex, "directionalLight.colorHex");
  assertHexColor(ambientLight.colorHex, "ambientLight.colorHex");
  assertHexColor(backgroundColorHex, "backgroundColorHex");
  if (directionalLight.intensity < 0) {
    throw new InvalidEnvironmentConfigError("directionalLight.intensity must not be negative");
  }
  if (ambientLight.intensity < 0) {
    throw new InvalidEnvironmentConfigError("ambientLight.intensity must not be negative");
  }
  if (input.fog && input.fog.near >= input.fog.far) {
    throw new InvalidEnvironmentConfigError("fog.near must be less than fog.far");
  }

  return {
    id: input.id,
    hdriAssetId: input.hdriAssetId ?? null,
    directionalLight,
    ambientLight,
    fog: input.fog ?? null,
    backgroundColorHex,
  };
}
