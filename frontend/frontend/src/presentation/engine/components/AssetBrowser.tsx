import { useEffect, useState } from "react";
import { AssetLoadState } from "@/domain/engine/assets/AssetLoadState";
import { useEngine } from "../hooks/useEngine";

interface AssetRow {
  readonly id: string;
  readonly type: string;
  readonly state: AssetLoadState;
}

export function AssetBrowser() {
  const { assetRegistry, assetManager, eventBus } = useEngine();
  const [stateById, setStateById] = useState<Record<string, AssetLoadState>>({});

  useEffect(() => {
    const unsubscribeStarted = eventBus.on("asset:load-started", ({ descriptor }) => {
      setStateById((previous) => ({ ...previous, [descriptor.id]: AssetLoadState.LOADING }));
    });
    const unsubscribeCompleted = eventBus.on("asset:load-completed", ({ descriptor }) => {
      setStateById((previous) => ({ ...previous, [descriptor.id]: AssetLoadState.LOADED }));
    });
    const unsubscribeFailed = eventBus.on("asset:load-failed", ({ descriptor }) => {
      setStateById((previous) => ({ ...previous, [descriptor.id]: AssetLoadState.ERROR }));
    });

    return () => {
      unsubscribeStarted();
      unsubscribeCompleted();
      unsubscribeFailed();
    };
  }, [eventBus]);

  const rows: AssetRow[] = assetRegistry.list().map((descriptor) => ({
    id: descriptor.id,
    type: descriptor.type,
    state:
      stateById[descriptor.id] ??
      (assetManager.isCached(descriptor.id) ? AssetLoadState.LOADED : AssetLoadState.IDLE),
  }));

  return (
    <div className="max-h-64 overflow-y-auto rounded-md border border-garden-700 bg-black/70 p-3 text-light-divine">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="text-left text-garden-300">
            <th className="pr-2">id</th>
            <th className="pr-2">type</th>
            <th>state</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-2 text-garden-300">
                No assets registered.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className="pr-2">{row.id}</td>
                <td className="pr-2">{row.type}</td>
                <td>{row.state}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
