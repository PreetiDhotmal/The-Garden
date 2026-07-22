import { useDebugSettingsStore } from "../stores/debugSettingsStore";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { AssetBrowser } from "./AssetBrowser";

/**
 * Renders nothing outside of development builds. Mount once, outside
 * `<Canvas>` (it's plain DOM/HTML, not a Three.js scene member).
 */
export function DebugPanel() {
  const isPanelOpen = useDebugSettingsStore((state) => state.isPanelOpen);
  const isPhysicsDebugEnabled = useDebugSettingsStore((state) => state.isPhysicsDebugEnabled);
  const isAssetBrowserOpen = useDebugSettingsStore((state) => state.isAssetBrowserOpen);
  const togglePanel = useDebugSettingsStore((state) => state.togglePanel);
  const togglePhysicsDebug = useDebugSettingsStore((state) => state.togglePhysicsDebug);
  const toggleAssetBrowser = useDebugSettingsStore((state) => state.toggleAssetBrowser);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={togglePanel}
        className="pointer-events-auto rounded-md border border-garden-700 bg-black/70 px-3 py-1 font-mono text-xs text-light-divine"
      >
        {isPanelOpen ? "Hide debug" : "Debug"}
      </button>

      {isPanelOpen && (
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <PerformanceMonitor />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={togglePhysicsDebug}
              className="rounded-md border border-garden-700 bg-black/70 px-3 py-1 font-mono text-xs text-light-divine"
            >
              Physics debug: {isPhysicsDebugEnabled ? "on" : "off"}
            </button>
            <button
              type="button"
              onClick={toggleAssetBrowser}
              className="rounded-md border border-garden-700 bg-black/70 px-3 py-1 font-mono text-xs text-light-divine"
            >
              Assets: {isAssetBrowserOpen ? "hide" : "show"}
            </button>
          </div>

          {isAssetBrowserOpen && <AssetBrowser />}
        </div>
      )}
    </div>
  );
}
