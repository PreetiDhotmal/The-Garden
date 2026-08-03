/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Opt-in escape hatch for local dev without a configured backend/YouVersion App Key. Never the production default. */
  readonly VITE_USE_MOCK_SCRIPTURE?: string;
}
