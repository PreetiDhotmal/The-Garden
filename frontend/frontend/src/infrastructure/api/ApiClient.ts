import type { ApiErrorResponse } from "@the-garden/shared-types";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorResponse | null
  ) {
    super(body?.message ?? `API request failed with status ${status.toString()}`);
    this.name = "ApiRequestError";
  }
}

export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly getAuthToken?: () => string | null;
}

/**
 * Thin, typed wrapper around fetch. Infrastructure-layer only —
 * application services depend on this via injection, never on `fetch`
 * directly, keeping the use-case layer testable without a network.
 */
export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  async get<TResponse>(path: string): Promise<TResponse> {
    return this.request<TResponse>(path, { method: "GET" });
  }

  async post<TResponse>(path: string, body: unknown): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  private async request<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
    const token = this.config.getAuthToken?.();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      throw new ApiRequestError(response.status, errorBody);
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }
}
