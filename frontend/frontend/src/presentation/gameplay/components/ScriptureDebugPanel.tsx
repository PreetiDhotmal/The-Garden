import { useEffect, useState } from "react";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { ScriptureRepositoryImpl } from "@/infrastructure/gameplay/scripture/ScriptureRepositoryImpl";
import { useDebugSettingsStore } from "@/presentation/engine/stores/debugSettingsStore";

/**
 * Dev-only. Reads directly off ScriptureRepositoryImpl's extra
 * (non-interface) diagnostic methods when that's the active
 * implementation — a plain interface-typed field wouldn't expose
 * these, which is intentional (gameplay code never needs them).
 */
export function ScriptureDebugPanel() {
  const { scriptureRepository } = useGameplay();
  const isRepositoryImpl = scriptureRepository instanceof ScriptureRepositoryImpl;
  const [isOnline, setIsOnline] = useState(isRepositoryImpl ? scriptureRepository.isOnline() : true);
  const [recentlyReadCount, setRecentlyReadCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [cachedVerseCount, setCachedVerseCount] = useState(0);

  useEffect(() => {
    if (!isRepositoryImpl) {
      return;
    }
    const unsubscribe = scriptureRepository.subscribeToNetworkStatus(setIsOnline);

    const refresh = () => {
      scriptureRepository
        .getRecentlyReadKeys()
        .then((keys) => {
          setRecentlyReadCount(keys.length);
        })
        .catch(() => {
          // Best-effort dev diagnostic; a failed refresh just keeps the last value.
        });
      scriptureRepository
        .getFavoriteKeys()
        .then((keys) => {
          setFavoriteCount(keys.length);
        })
        .catch(() => {
          // Best-effort, as above.
        });
      scriptureRepository
        .getCachedVerseCount()
        .then(setCachedVerseCount)
        .catch(() => {
          // Best-effort, as above.
        });
    };
    refresh();
    const interval = window.setInterval(refresh, 2000);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [isRepositoryImpl, scriptureRepository]);

  const usingMock = import.meta.env.VITE_USE_MOCK_SCRIPTURE === "true";

  const isDebugPanelOpen = useDebugSettingsStore((state) => state.isPanelOpen);

  if (!import.meta.env.DEV || !isDebugPanelOpen) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 rounded-md border border-garden-700 bg-black/70 p-3 font-mono text-xs text-light-divine">
      <div className="font-semibold text-garden-300">Scripture Platform</div>
      <div>Provider: {usingMock ? "Mock (dev override)" : "Backend (YouVersion)"}</div>
      {isRepositoryImpl && (
        <>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-garden-500" : "bg-red-500"}`} />
            <span>{isOnline ? "Online" : "Offline — serving cached verses"}</span>
          </div>
          <div>Cached verses (IndexedDB): {cachedVerseCount}</div>
          <div>Recently read: {recentlyReadCount}</div>
          <div>Favorites: {favoriteCount}</div>
        </>
      )}
    </div>
  );
}
