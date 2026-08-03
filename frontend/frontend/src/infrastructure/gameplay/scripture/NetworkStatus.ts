export type NetworkStatusListener = (isOnline: boolean) => void;

/**
 * Wraps the browser's online/offline signal. `navigator.onLine` is a
 * best-effort heuristic (it can be wrong about actual reachability of
 * a specific host), but it's the standard, zero-cost first signal —
 * combined with the retry/fallback behavior already in
 * ScriptureRepositoryImpl, a false "online" reading just means one
 * extra failed request before falling back to cache, not a hard
 * failure.
 */
export class NetworkStatus {
  private readonly listeners = new Set<NetworkStatusListener>();

  constructor() {
    window.addEventListener("online", this.handleChange);
    window.addEventListener("offline", this.handleChange);
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    window.removeEventListener("online", this.handleChange);
    window.removeEventListener("offline", this.handleChange);
    this.listeners.clear();
  }

  private handleChange = (): void => {
    const isOnline = this.isOnline();
    for (const listener of this.listeners) {
      listener(isOnline);
    }
  };
}
