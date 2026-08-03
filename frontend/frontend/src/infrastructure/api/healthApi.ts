import { apiClient } from "./apiClientInstance";

export interface HealthStatus {
  readonly status: "UP" | "DOWN";
  readonly service: string;
}

export async function fetchHealthStatus(): Promise<HealthStatus> {
  return apiClient.get<HealthStatus>("/health");
}
