import { useEffect, useState } from "react";
import { useGameplay } from "@/presentation/gameplay/hooks/useGameplay";
import { ScriptureRepositoryImpl } from "@/infrastructure/gameplay/scripture/ScriptureRepositoryImpl";

export function OfflineIndicator() {
  const { scriptureRepository } = useGameplay();
  const isRepositoryImpl = scriptureRepository instanceof ScriptureRepositoryImpl;
  const [isOnline, setIsOnline] = useState(isRepositoryImpl ? scriptureRepository.isOnline() : true);

  useEffect(() => {
    if (!isRepositoryImpl) {
      return;
    }
    return scriptureRepository.subscribeToNetworkStatus(setIsOnline);
  }, [isRepositoryImpl, scriptureRepository]);

  if (isOnline) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border border-amber-700 bg-amber-950/80 px-3 py-1 text-xs text-amber-200">
      Offline — reading from cached scripture
    </div>
  );
}
