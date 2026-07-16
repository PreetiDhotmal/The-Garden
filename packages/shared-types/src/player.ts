import type { FaithWorld } from "./faith-world";

/**
 * Mirrors backend DTO: com.thegarden.application.dto.PlayerProfileDto
 */
export interface PlayerProfile {
  readonly id: string;
  readonly displayName: string;
  readonly currentWorld: FaithWorld;
  readonly unlockedWorlds: readonly FaithWorld[];
  readonly gardenId: string;
  readonly createdAt: string; // ISO-8601
}

/**
 * API error envelope. Mirrors backend:
 * com.thegarden.presentation.exception.ApiErrorResponse
 */
export interface ApiErrorResponse {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly timestamp: string; // ISO-8601
  readonly path: string;
}
