export interface MaterialTextureSet {
  readonly albedoTextureId?: string;
  readonly normalTextureId?: string;
  readonly roughnessTextureId?: string;
  readonly metalnessTextureId?: string;
  readonly aoTextureId?: string;
  readonly emissiveTextureId?: string;
}

/**
 * Describes a physically-based material by referencing texture asset
 * ids (see AssetDescriptor) rather than embedding texture data. This
 * keeps material configs serializable as plain JSON and decoupled from
 * loaded Three.js resources.
 */
export interface MaterialConfig {
  readonly id: string;
  readonly baseColorHex: string;
  readonly roughness: number;
  readonly metalness: number;
  readonly emissiveHex: string;
  readonly emissiveIntensity: number;
  readonly textures: MaterialTextureSet;
  readonly doubleSided: boolean;
  readonly transparent: boolean;
  readonly opacity: number;
}

export class InvalidMaterialConfigError extends Error {
  constructor(reason: string) {
    super(`Invalid material config: ${reason}`);
    this.name = "InvalidMaterialConfigError";
  }
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export interface CreateMaterialConfigInput {
  readonly id: string;
  readonly baseColorHex?: string;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly emissiveHex?: string;
  readonly emissiveIntensity?: number;
  readonly textures?: MaterialTextureSet;
  readonly doubleSided?: boolean;
  readonly transparent?: boolean;
  readonly opacity?: number;
}

function assertUnitRange(value: number, fieldName: string): void {
  if (value < 0 || value > 1) {
    throw new InvalidMaterialConfigError(`${fieldName} must be between 0 and 1 (got ${value.toString()})`);
  }
}

function assertHexColor(value: string, fieldName: string): void {
  if (!HEX_COLOR_PATTERN.test(value)) {
    throw new InvalidMaterialConfigError(`${fieldName} must be a 6-digit hex color (got "${value}")`);
  }
}

export function createMaterialConfig(input: CreateMaterialConfigInput): MaterialConfig {
  if (input.id.trim().length === 0) {
    throw new InvalidMaterialConfigError("id must not be empty");
  }

  const config: MaterialConfig = {
    id: input.id,
    baseColorHex: input.baseColorHex ?? "#ffffff",
    roughness: input.roughness ?? 0.7,
    metalness: input.metalness ?? 0,
    emissiveHex: input.emissiveHex ?? "#000000",
    emissiveIntensity: input.emissiveIntensity ?? 0,
    textures: input.textures ?? {},
    doubleSided: input.doubleSided ?? false,
    transparent: input.transparent ?? false,
    opacity: input.opacity ?? 1,
  };

  assertHexColor(config.baseColorHex, "baseColorHex");
  assertHexColor(config.emissiveHex, "emissiveHex");
  assertUnitRange(config.roughness, "roughness");
  assertUnitRange(config.metalness, "metalness");
  assertUnitRange(config.opacity, "opacity");
  if (config.emissiveIntensity < 0) {
    throw new InvalidMaterialConfigError("emissiveIntensity must not be negative");
  }

  return config;
}
